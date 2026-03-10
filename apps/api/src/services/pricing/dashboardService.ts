import { CostingEngine } from '../costing/costingEngine.js';
import { MarginProfile, MarginProfileLine, OverheadSet, PriceItem, PriceSnapshot, ProductSpec } from '../../types/domain.js';
import { PricingService } from './pricingService.js';

interface DashboardFilters {
  supplier?: string;
  type?: string;
  subcategory?: string;
}

export class PricingDashboardService {
  constructor(
    private readonly products: ProductSpec[],
    private readonly prices: PriceItem[],
    private readonly marginProfiles: MarginProfile[],
    private readonly marginProfileLines: MarginProfileLine[],
    private readonly snapshots: PriceSnapshot[]
  ) {}

  buildRows(overheadResolver: (p: ProductSpec) => OverheadSet, filters: DashboardFilters = {}): PriceSnapshot[] {
    const profile = this.marginProfiles.find((p) => p.active) ?? this.marginProfiles[0];
    const activeProducts = this.products.filter((p) => p.status === 'active');
    const filteredProducts = activeProducts.filter((product) => {
      if (filters.type && String(product.type) !== filters.type) return false;
      if (filters.subcategory && product.subcategoryId !== filters.subcategory) return false;
      if (filters.supplier) {
        const supplierPrice = this.findRawMaterialPrice(product);
        return Boolean(supplierPrice && supplierPrice.supplierId === filters.supplier);
      }
      return true;
    });

    const engine = new CostingEngine(this.prices, []);
    const rows = filteredProducts.map((product) => {
      const cost = engine.recalculateProduct(product, overheadResolver(product));
      const line = this.marginProfileLines.find((l) => l.profileId === profile.id && (l.subcategoryId ? l.subcategoryId === product.subcategoryId : l.category === product.category));
      const pricing = new PricingService([]);
      const tierMargins = {
        m1: line?.tier1Margin ?? 45,
        m2: line?.tier2Margin ?? 35,
        m3: line?.tier3Margin ?? 25,
        m4: line?.tier4Margin ?? 15
      };

      const rawPrice = this.findRawMaterialPrice(product);
      const previous = [...this.snapshots].reverse().find((s) => s.sku === product.sku && s.state === 'live');
      const variancePct = previous?.costEur ? ((cost.totalCost - previous.costEur) / previous.costEur) * 100 : 0;

      const row: PriceSnapshot = {
        id: `ps-${Date.now()}-${product.sku}`,
        sku: product.sku,
        supplier: rawPrice?.supplierId ?? '-',
        product: product.name,
        subcategory: product.subcategoryId,
        m: Number(product.params.length_m ?? 0),
        um: Number(product.params.thickness_mic ?? 0),
        eurPerKg: rawPrice?.unitPrice ?? 0,
        costEur: Number(cost.totalCost.toFixed(4)),
        previousCostEur: previous?.costEur ?? Number(cost.totalCost.toFixed(4)),
        price1: pricing.priceFromMargin(cost.totalCost, tierMargins.m1),
        price2: pricing.priceFromMargin(cost.totalCost, tierMargins.m2),
        price3: pricing.priceFromMargin(cost.totalCost, tierMargins.m3),
        price4: pricing.priceFromMargin(cost.totalCost, tierMargins.m4),
        freeCustom: '',
        variancePct: Number(variancePct.toFixed(2)),
        updatedAt: new Date().toISOString(),
        state: profile.state
      };

      this.snapshots.push(row);
      return row;
    });

    return rows;
  }

  exportCsv(rows: PriceSnapshot[]): string {
    const headers = ['supplier','product','subcategory','m','μm','€/kg','cost €','price 1','price 2','price 3','price 4','free/custom','variance %','updated at'];
    const lines = rows.map((r) => [r.supplier,r.product,r.subcategory,r.m,r.um,r.eurPerKg,r.costEur,r.price1,r.price2,r.price3,r.price4,r.freeCustom,r.variancePct,r.updatedAt].join(','));
    return [headers.join(','), ...lines].join('\n');
  }

  private findRawMaterialPrice(product: ProductSpec): PriceItem | undefined {
    const id = product.materialItemIds[0];
    return this.prices.find((p) => p.itemId === id && p.active && p.itemType === 'material');
  }
}
