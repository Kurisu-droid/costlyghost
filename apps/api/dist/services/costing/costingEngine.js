import { formulaRegistry } from './formulaTypes.js';
export class CostingEngine {
    prices;
    constructor(prices) {
        this.prices = prices;
    }
    recalculateProduct(product, overheadSet) {
        const formula = formulaRegistry[product.type];
        const warnings = formula.validate(product);
        const materialCost = this.sumItems(product.materialItemIds);
        const packagingCost = this.sumItems(product.componentItemIds);
        const directPurchaseCost = product.type === 6 ? materialCost + packagingCost : 0;
        const result = formula.calculate({ product, materialCost, packagingCost, directPurchaseCost, overheadSet });
        if (product.productionRatePerHour === 0) {
            warnings.push('Zero production rate: overhead cost forced to zero.');
        }
        return {
            sku: product.sku,
            ...result,
            warnings,
            timestamp: new Date().toISOString(),
            inputSnapshot: {
                materialItemIds: product.materialItemIds,
                componentItemIds: product.componentItemIds,
                overheadSetId: overheadSet.id
            }
        };
    }
    recalculateMany(products, overheadSet) {
        return products.map((p) => this.recalculateProduct(p, overheadSet));
    }
    findAffectedSkus(products, changedItemIds) {
        return products
            .filter((p) => [...p.materialItemIds, ...p.componentItemIds].some((id) => changedItemIds.includes(id)))
            .map((p) => p.sku);
    }
    sumItems(ids) {
        return ids
            .map((id) => this.prices.find((p) => p.itemId === id && p.active))
            .filter(Boolean)
            .reduce((sum, item) => sum + (item?.unitPrice ?? 0), 0);
    }
}
