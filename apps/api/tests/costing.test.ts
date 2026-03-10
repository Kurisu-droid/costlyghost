import { describe, expect, it } from 'vitest';
import { CostingEngine } from '../src/services/costing/costingEngine.js';
import { costSnapshots, getOverheadForProduct, marginRules, prices, products } from '../src/services/dataStore.js';
import { PricingService } from '../src/services/pricing/pricingService.js';
import { formulaRegistry } from '../src/services/costing/formulaTypes.js';

describe('costing formulas', () => {
  it('supports all 6 product formulas via registry', () => {
    expect(Object.keys(formulaRegistry)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('recalculates affected sku only', () => {
    const engine = new CostingEngine(prices, []);
    const affected = engine.findAffectedSkus(products, ['ALU-FOIL-11']);
    expect(affected).toEqual(['SKU-FOIL-001']);
  });

  it('pricing handles zero cost', () => {
    const svc = new PricingService(marginRules);
    expect(svc.priceFromMargin(0, 25)).toBe(0);
  });

  it('calculates real type-1 breakdown with required outputs', () => {
    const snapshots = [];
    const engine = new CostingEngine(prices, snapshots);
    const foil = products.find((p) => p.type === 1)!;
    const cost = engine.recalculateProduct(foil, getOverheadForProduct(foil));

    expect(cost.raw_material_cost).toBeGreaterThan(0);
    expect(cost.packaging_cost_mandrel).toBeGreaterThan(0);
    expect(cost.packaging_cost_box_label).toBeGreaterThan(0);
    expect(cost.packaging_cost_carton).toBeGreaterThan(0);
    expect(cost.packaging_cost_total).toBeGreaterThan(0);
    expect(cost.overhead_per_piece).toBeGreaterThan(0);
    expect(cost.total_cost_with_waste).toBeGreaterThan(cost.total_cost ?? 0);
    expect(snapshots.length).toBe(1);
  });

  it('stores snapshot links to price and overhead inputs', () => {
    costSnapshots.length = 0;
    const engine = new CostingEngine(prices, costSnapshots);
    const foil = products.find((p) => p.type === 1)!;
    engine.recalculateProduct(foil, getOverheadForProduct(foil));
    expect(costSnapshots[0].linkedOverheadSetId).toBeTruthy();
    expect(costSnapshots[0].linkedActivePriceItemIds.length).toBeGreaterThan(0);
  });
});
