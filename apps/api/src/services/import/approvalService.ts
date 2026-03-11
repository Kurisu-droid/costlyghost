import { CostingEngine } from '../costing/costingEngine.js';
import { AuditService } from '../audit/auditService.js';
import { OverheadSet, PriceItem, ProductSpec, ProposedPriceChange } from '../../types/domain.js';

export class ApprovalService {
  constructor(private readonly audit: AuditService) {}

  approveChanges(
    proposals: ProposedPriceChange[],
    prices: PriceItem[],
    products: ProductSpec[],
    overheadResolver: (product: ProductSpec) => OverheadSet
  ) {
    const approved = proposals.filter((p) => !p.ignored && p.status !== 'none' && !p.unitMismatch && p.itemId);
    const changedItemIds: string[] = [];

    for (const change of approved) {
      const current = prices.find((p) => p.itemId === change.itemId && p.active);
      if (!current) continue;
      current.active = false;
      const newRow: PriceItem = { ...current, id: `${current.id}-rev`, unitPrice: change.importedPrice, validFrom: new Date().toISOString(), active: true };
      prices.push(newRow);
      changedItemIds.push(current.itemId);
      this.audit.record({ eventType: 'PRICE_CHANGE_APPROVED', actor: 'system', before: current, after: newRow });
    }

    const engine = new CostingEngine(prices);
    const affectedSkus = engine.findAffectedSkus(products, changedItemIds);
    const affectedProducts = products.filter((p) => affectedSkus.includes(p.sku));
    const recalculated = affectedProducts.map((product) => engine.recalculateProduct(product, overheadResolver(product)));

    this.audit.record({ eventType: 'RECALC_RUN', actor: 'system', before: null, after: { affectedSkus, changedItemIds } });

    return { approvedCount: approved.length, changedItemIds, affectedSkus, recalculated };
  }
}
