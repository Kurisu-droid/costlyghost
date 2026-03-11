import { CostingEngine } from '../costing/costingEngine.js';
import { PricingService } from '../pricing/pricingService.js';
import {
  Customer,
  CustomerContact,
  MarginProfileLine,
  OverheadSet,
  PriceItem,
  ProductSpec,
  QuotePdfRecord,
  QuoteLinePriceSnapshot,
  QuoteLineRecord,
  QuoteRecord,
  QuoteStatus,
  QuoteStatusHistoryRecord
} from '../../types/domain.js';
import { buildBusinessQuotePdf } from './pdfBuilder.js';

interface QuoteLineInput {
  sku: string;
  quantity: number;
  tier: 1 | 2 | 3 | 4;
  manualUnitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
}

export class QuoteService {
  constructor(
    private readonly products: ProductSpec[],
    private readonly prices: PriceItem[],
    private readonly overheadResolver: (product: ProductSpec) => OverheadSet,
    private readonly marginProfileLines: MarginProfileLine[],
    private readonly customers: Customer[],
    private readonly quotes: QuoteRecord[],
    private readonly quoteLines: QuoteLineRecord[],
    private readonly lineSnapshots: QuoteLinePriceSnapshot[],
    private readonly statusHistory: QuoteStatusHistoryRecord[],
    private readonly customerContacts: CustomerContact[] = [],
    private readonly quotePdfs: QuotePdfRecord[] = []
  ) {}

  searchProducts(query: string): Array<{ sku: string; description: string; subcategory: string; cost: number; prices: Record<string, number> }> {
    const q = query.toLowerCase();
    const engine = new CostingEngine(this.prices, []);
    return this.products
      .filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .slice(0, 30)
      .map((product) => {
        const cost = engine.recalculateProduct(product, this.overheadResolver(product)).totalCost;
        const margins = this.resolveMargins(product);
        const pricing = new PricingService([]);
        return {
          sku: product.sku,
          description: product.name,
          subcategory: product.subcategoryId,
          cost,
          prices: {
            tier1: pricing.priceFromMargin(cost, margins.tier1),
            tier2: pricing.priceFromMargin(cost, margins.tier2),
            tier3: pricing.priceFromMargin(cost, margins.tier3),
            tier4: pricing.priceFromMargin(cost, margins.tier4)
          }
        };
      });
  }

  createOrFindCustomer(input: { name: string; vatNumber?: string; email?: string; phone?: string; address?: string; city?: string; country?: string; notes?: string; active?: boolean; contactName?: string; contactEmail?: string; contactPhone?: string; contactRole?: string }): Customer {
    const existing = this.customers.find((c) => c.name.toLowerCase() === input.name.toLowerCase());
    if (existing) return existing;
    const customerId = `cust-${this.customers.length + 1}`;
    const customer: Customer = {
      id: customerId,
      code: `CUST-${String(this.customers.length + 1).padStart(4, '0')}`,
      name: input.name,
      vatNumber: input.vatNumber,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      country: input.country ?? 'GR',
      notes: input.notes,
      active: input.active ?? true,
      createdAt: new Date().toISOString()
    };
    this.customers.push(customer);
    if (input.contactName) {
      this.customerContacts.push({
        id: `cc-${this.customerContacts.length + 1}`,
        customerId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        role: input.contactRole
      });
    }
    return customer;
  }

  createQuoteDraft(input: {
    customer: { name: string; vatNumber?: string; email?: string; phone?: string; address?: string; city?: string; country?: string; notes?: string; active?: boolean };
    currency?: string;
    notes?: string;
    validUntil?: string;
    createdBy?: string;
    lines: QuoteLineInput[];
  }) {
    const customer = this.createOrFindCustomer(input.customer);
    const quoteId = `Q-${String(this.quotes.length + 1).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const lines = input.lines.map((line) => this.buildLine(quoteId, line));
    const subtotal = lines.reduce((sum, l) => sum + (l.unitPrice * l.quantity), 0);
    const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const discountTotal = subtotal - total;

    const quote: QuoteRecord = {
      id: quoteId,
      customerId: customer.id,
      quoteNumber: quoteId,
      quoteDate: now.slice(0, 10),
      validUntil: input.validUntil,
      currency: input.currency ?? 'EUR',
      status: 'DRAFT',
      subtotal: round2(subtotal),
      discountTotal: round2(discountTotal),
      total: round2(total),
      notes: input.notes,
      createdBy: input.createdBy ?? 'system',
      createdAt: now,
    };

    this.quotes.push(quote);
    this.quoteLines.push(...lines);
    this.statusHistory.push({ id: `qsh-${this.statusHistory.length + 1}`, quoteId, status: 'DRAFT', changedAt: now, changedBy: 'system' });

    return this.getQuoteDetail(quoteId);
  }

  updateQuoteStatus(quoteId: string, status: QuoteStatus) {
    const quote = this.quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Quote not found');
    quote.status = status;
    this.statusHistory.push({ id: `qsh-${this.statusHistory.length + 1}`, quoteId, status, changedAt: new Date().toISOString(), changedBy: 'system' });
    return quote;
  }

  listQuotes() {
    return this.quotes.map((q) => ({ ...q, customer: this.customers.find((c) => c.id === q.customerId)?.name ?? '-' }));
  }

  getQuoteDetail(quoteId: string) {
    const quote = this.quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Quote not found');
    const customer = this.customers.find((c) => c.id === quote.customerId);
    const lines = this.quoteLines.filter((l) => l.quoteId === quoteId);
    return { quote, customer, lines };
  }

  toPdf(quoteId: string): Buffer {
    const detail = this.getQuoteDetail(quoteId);
    const pdf = buildBusinessQuotePdf(detail.quote, detail.customer, detail.lines);
    this.quotePdfs.push({ id: `qpdf-${this.quotePdfs.length + 1}`, quoteId, filePath: `/tmp/quotes/${quoteId}.pdf`, createdAt: new Date().toISOString() });
    return pdf;
  }

  private buildLine(quoteId: string, input: QuoteLineInput): QuoteLineRecord {
    const product = this.products.find((p) => p.sku === input.sku);
    if (!product) throw new Error(`SKU not found: ${input.sku}`);
    const engine = new CostingEngine(this.prices, []);
    const cost = engine.recalculateProduct(product, this.overheadResolver(product)).totalCost;
    const margins = this.resolveMargins(product);
    const pricing = new PricingService([]);
    const tierPrices = {
      1: pricing.priceFromMargin(cost, margins.tier1),
      2: pricing.priceFromMargin(cost, margins.tier2),
      3: pricing.priceFromMargin(cost, margins.tier3),
      4: pricing.priceFromMargin(cost, margins.tier4)
    } as const;

    const selectedUnitPrice = input.manualUnitPrice && input.manualUnitPrice > 0 ? input.manualUnitPrice : tierPrices[input.tier];
    const lineSubtotal = selectedUnitPrice * input.quantity;
    const discountAmount = input.discountAmount ?? ((input.discountPercent ?? 0) / 100) * lineSubtotal;
    const netLineTotal = lineSubtotal - discountAmount;

    const line: QuoteLineRecord = {
      id: `ql-${this.quoteLines.length + 1}`,
      quoteId,
      productId: product.id,
      skuSnapshot: product.sku,
      descriptionSnapshot: product.name,
      subcategorySnapshot: product.subcategoryId,
      quantity: input.quantity,
      unitPrice: round4(selectedUnitPrice),
      discountPercent: input.discountPercent ?? 0,
      lineTotal: round2(netLineTotal)
    };

    this.lineSnapshots.push({
      id: `qlps-${this.lineSnapshots.length + 1}`,
      quoteLineId: line.id,
      tier1Price: round4(tierPrices[1]),
      tier2Price: round4(tierPrices[2]),
      tier3Price: round4(tierPrices[3]),
      tier4Price: round4(tierPrices[4]),
      costReference: round4(cost),
      capturedAt: new Date().toISOString()
    });

    line.priceSnapshotId = this.lineSnapshots.at(-1)?.id;

    return line;
  }

  private resolveMargins(product: ProductSpec) {
    const line = this.marginProfileLines.find((l) => (l.subcategoryId ? l.subcategoryId === product.subcategoryId : l.category === product.category));
    return {
      tier1: line?.tier1Margin ?? 45,
      tier2: line?.tier2Margin ?? 35,
      tier3: line?.tier3Margin ?? 25,
      tier4: line?.tier4Margin ?? 15
    };
  }
}

const round2 = (v: number) => Number(v.toFixed(2));
const round4 = (v: number) => Number(v.toFixed(4));
