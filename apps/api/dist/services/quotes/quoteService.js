import { CostingEngine } from '../costing/costingEngine.js';
import { PricingService } from '../pricing/pricingService.js';
import { buildBusinessQuotePdf } from './pdfBuilder.js';
export class QuoteService {
    products;
    prices;
    overheadResolver;
    marginProfileLines;
    customers;
    quotes;
    quoteLines;
    lineSnapshots;
    statusHistory;
    constructor(products, prices, overheadResolver, marginProfileLines, customers, quotes, quoteLines, lineSnapshots, statusHistory) {
        this.products = products;
        this.prices = prices;
        this.overheadResolver = overheadResolver;
        this.marginProfileLines = marginProfileLines;
        this.customers = customers;
        this.quotes = quotes;
        this.quoteLines = quoteLines;
        this.lineSnapshots = lineSnapshots;
        this.statusHistory = statusHistory;
    }
    searchProducts(query) {
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
    createOrFindCustomer(input) {
        const existing = this.customers.find((c) => c.name.toLowerCase() === input.name.toLowerCase());
        if (existing)
            return existing;
        const customer = {
            id: `cust-${this.customers.length + 1}`,
            name: input.name,
            vatNumber: input.vatNumber,
            email: input.email,
            phone: input.phone,
            createdAt: new Date().toISOString()
        };
        this.customers.push(customer);
        return customer;
    }
    createQuoteDraft(input) {
        const customer = this.createOrFindCustomer(input.customer);
        const quoteId = `Q-${String(this.quotes.length + 1).padStart(5, '0')}`;
        const now = new Date().toISOString();
        const lines = input.lines.map((line) => this.buildLine(quoteId, line));
        const subtotal = lines.reduce((sum, l) => sum + l.lineSubtotal, 0);
        const discountTotal = lines.reduce((sum, l) => sum + l.discountAmount, 0);
        const netTotal = lines.reduce((sum, l) => sum + l.netLineTotal, 0);
        const quote = {
            id: quoteId,
            customerId: customer.id,
            quoteNumber: quoteId,
            currency: input.currency ?? 'EUR',
            status: 'DRAFT',
            subtotal: round2(subtotal),
            discountTotal: round2(discountTotal),
            netTotal: round2(netTotal),
            notes: input.notes,
            paymentTerms: input.paymentTerms,
            validityDate: input.validityDate,
            createdAt: now,
            updatedAt: now
        };
        this.quotes.push(quote);
        this.quoteLines.push(...lines);
        this.statusHistory.push({ id: `qsh-${this.statusHistory.length + 1}`, quoteId, fromStatus: null, toStatus: 'DRAFT', changedAt: now, changedBy: 'system' });
        return this.getQuoteDetail(quoteId);
    }
    updateQuoteStatus(quoteId, status) {
        const quote = this.quotes.find((q) => q.id === quoteId);
        if (!quote)
            throw new Error('Quote not found');
        const prev = quote.status;
        quote.status = status;
        quote.updatedAt = new Date().toISOString();
        this.statusHistory.push({ id: `qsh-${this.statusHistory.length + 1}`, quoteId, fromStatus: prev, toStatus: status, changedAt: quote.updatedAt, changedBy: 'system' });
        return quote;
    }
    listQuotes() {
        return this.quotes.map((q) => ({ ...q, customer: this.customers.find((c) => c.id === q.customerId)?.name ?? '-' }));
    }
    getQuoteDetail(quoteId) {
        const quote = this.quotes.find((q) => q.id === quoteId);
        if (!quote)
            throw new Error('Quote not found');
        const customer = this.customers.find((c) => c.id === quote.customerId);
        const lines = this.quoteLines.filter((l) => l.quoteId === quoteId);
        return { quote, customer, lines };
    }
    toPdf(quoteId) {
        const detail = this.getQuoteDetail(quoteId);
        return buildBusinessQuotePdf(detail.quote, detail.customer, detail.lines);
    }
    buildLine(quoteId, input) {
        const product = this.products.find((p) => p.sku === input.sku);
        if (!product)
            throw new Error(`SKU not found: ${input.sku}`);
        const engine = new CostingEngine(this.prices, []);
        const cost = engine.recalculateProduct(product, this.overheadResolver(product)).totalCost;
        const margins = this.resolveMargins(product);
        const pricing = new PricingService([]);
        const tierPrices = {
            1: pricing.priceFromMargin(cost, margins.tier1),
            2: pricing.priceFromMargin(cost, margins.tier2),
            3: pricing.priceFromMargin(cost, margins.tier3),
            4: pricing.priceFromMargin(cost, margins.tier4)
        };
        const selectedUnitPrice = input.manualUnitPrice && input.manualUnitPrice > 0 ? input.manualUnitPrice : tierPrices[input.tier];
        const lineSubtotal = selectedUnitPrice * input.quantity;
        const discountAmount = input.discountAmount ?? ((input.discountPercent ?? 0) / 100) * lineSubtotal;
        const netLineTotal = lineSubtotal - discountAmount;
        const line = {
            id: `ql-${this.quoteLines.length + 1}`,
            quoteId,
            productId: product.id,
            sku: product.sku,
            description: product.name,
            subcategory: product.subcategoryId,
            quantity: input.quantity,
            selectedTier: input.tier,
            selectedUnitPrice: round4(selectedUnitPrice),
            costReference: round4(cost),
            lineSubtotal: round2(lineSubtotal),
            discountPercent: input.discountPercent ?? 0,
            discountAmount: round2(discountAmount),
            netLineTotal: round2(netLineTotal),
            createdAt: new Date().toISOString()
        };
        this.lineSnapshots.push({
            id: `qlps-${this.lineSnapshots.length + 1}`,
            quoteLineId: line.id,
            tier1Price: round4(tierPrices[1]),
            tier2Price: round4(tierPrices[2]),
            tier3Price: round4(tierPrices[3]),
            tier4Price: round4(tierPrices[4]),
            costReference: round4(cost),
            capturedAt: line.createdAt
        });
        return line;
    }
    resolveMargins(product) {
        const line = this.marginProfileLines.find((l) => (l.subcategoryId ? l.subcategoryId === product.subcategoryId : l.category === product.category));
        return {
            tier1: line?.tier1Margin ?? 45,
            tier2: line?.tier2Margin ?? 35,
            tier3: line?.tier3Margin ?? 25,
            tier4: line?.tier4Margin ?? 15
        };
    }
}
const round2 = (v) => Number(v.toFixed(2));
const round4 = (v) => Number(v.toFixed(4));
