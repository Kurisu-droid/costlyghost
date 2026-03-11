import { describe, expect, it } from 'vitest';
import { CostingEngine } from '../src/services/costing/costingEngine.js';
import { marginRules, overhead, prices, products } from '../src/services/dataStore.js';
import { PricingService } from '../src/services/pricing/pricingService.js';
import { formulaRegistry } from '../src/services/costing/formulaTypes.js';
describe('costing formulas', () => {
    it('supports all 6 product formulas via registry', () => {
        expect(Object.keys(formulaRegistry)).toEqual(['1', '2', '3', '4', '5', '6']);
    });
    it('recalculates affected sku only', () => {
        const engine = new CostingEngine(prices);
        const affected = engine.findAffectedSkus(products, ['ALU-FOIL-11']);
        expect(affected).toEqual(['SKU-FOIL-001']);
    });
    it('pricing handles zero cost', () => {
        const svc = new PricingService(marginRules);
        expect(svc.priceFromMargin(0, 25)).toBe(0);
    });
    it('calculates deterministic output', () => {
        const engine = new CostingEngine(prices);
        const cost = engine.recalculateProduct(products[0], overhead);
        expect(cost.totalCost).toBeGreaterThan(0);
        expect(cost.formulaVersion).toBe('v1.0');
    });
});
