import { CostingEngine } from '../costing/costingEngine.js';
export class ApprovalService {
    audit;
    constructor(audit) {
        this.audit = audit;
    }
    approveChanges(proposals, prices, products, overhead) {
        const approved = proposals.filter((p) => !p.ignored && p.status !== 'none' && !p.unitMismatch && p.itemId);
        const changedItemIds = [];
        for (const change of approved) {
            const current = prices.find((p) => p.itemId === change.itemId && p.active);
            if (!current)
                continue;
            current.active = false;
            const newRow = { ...current, id: `${current.id}-rev`, unitPrice: change.importedPrice, validFrom: new Date().toISOString(), active: true };
            prices.push(newRow);
            changedItemIds.push(current.itemId);
            this.audit.record({ eventType: 'PRICE_CHANGE_APPROVED', actor: 'system', before: current, after: newRow });
        }
        const engine = new CostingEngine(prices);
        const affectedSkus = engine.findAffectedSkus(products, changedItemIds);
        const recalculated = engine.recalculateMany(products.filter((p) => affectedSkus.includes(p.sku)), overhead);
        this.audit.record({ eventType: 'RECALC_RUN', actor: 'system', before: null, after: { affectedSkus, changedItemIds } });
        return { approvedCount: approved.length, changedItemIds, affectedSkus, recalculated };
    }
}
