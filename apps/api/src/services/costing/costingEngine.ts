import { CostBreakdown, CostSnapshotRecord, OverheadSet, PriceItem, ProductSpec } from '../../types/domain.js';
import { formulaRegistry } from './formulaTypes.js';

export class CostingEngine {
  constructor(
    private readonly prices: PriceItem[],
    private readonly snapshots: CostSnapshotRecord[] = []
  ) {}

  recalculateProduct(product: ProductSpec, overheadSet: OverheadSet): CostBreakdown {
    const formula = formulaRegistry[product.type];
    const warnings = formula.validate(product);

    const materialCost = this.sumItems(product.materialItemIds);
    const packagingCost = this.sumItems(product.componentItemIds);
    const directPurchaseCost = product.type === 6 ? materialCost + packagingCost : 0;
    const activeRawMaterialPricePerKg = this.findActiveRawMaterialPrice(product);

    const result = formula.calculate({
      product,
      materialCost,
      packagingCost,
      directPurchaseCost,
      overheadSet,
      activeRawMaterialPricePerKg
    });

    if ((product.params.pieces_per_hour ?? product.productionRatePerHour ?? 0) === 0) {
      warnings.push('Zero production rate: overhead per piece forced to zero.');
    }

    const breakdown: CostBreakdown = {
      sku: product.sku,
      ...result,
      warnings,
      calculationTimestamp: new Date().toISOString(),
      inputSnapshot: {
        materialItemIds: product.materialItemIds,
        componentItemIds: product.componentItemIds,
        overheadSetId: overheadSet.id,
        activePriceItemIds: this.activePriceItemIdsForProduct(product),
        rawMaterialPricePerKg: activeRawMaterialPricePerKg
      }
    };

    this.snapshots.push({
      id: `cs-${this.snapshots.length + 1}`,
      sku: product.sku,
      totalCost: breakdown.totalCost,
      formulaVersion: breakdown.formulaVersion,
      linkedOverheadSetId: overheadSet.id,
      linkedActivePriceItemIds: this.activePriceItemIdsForProduct(product),
      breakdown,
      createdAt: new Date().toISOString()
    });

    return breakdown;
  }

  recalculateMany(products: ProductSpec[], overheadSet: OverheadSet): CostBreakdown[] {
    return products.map((p) => this.recalculateProduct(p, overheadSet));
  }

  findAffectedSkus(products: ProductSpec[], changedItemIds: string[]): string[] {
    return products
      .filter((p) => [...p.materialItemIds, ...p.componentItemIds].some((id) => changedItemIds.includes(id)))
      .map((p) => p.sku);
  }

  private sumItems(ids: string[]): number {
    return ids
      .map((id) => this.prices.find((p) => p.itemId === id && p.active))
      .filter(Boolean)
      .reduce((sum, item) => sum + (item?.unitPrice ?? 0), 0);
  }

  private findActiveRawMaterialPrice(product: ProductSpec): number {
    const itemId = product.materialItemIds[0];
    const active = this.prices.find((p) => p.itemId === itemId && p.active && p.itemType === 'material');
    return active?.unitPrice ?? 0;
  }

  private activePriceItemIdsForProduct(product: ProductSpec): string[] {
    const ids = [...product.materialItemIds, ...product.componentItemIds];
    return this.prices.filter((p) => p.active && ids.includes(p.itemId)).map((p) => p.id);
  }
}
