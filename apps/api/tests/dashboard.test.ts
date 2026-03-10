import { describe, expect, it } from 'vitest';
import { PricingDashboardService } from '../src/services/pricing/dashboardService.js';
import { getOverheadForProduct, marginProfileLines, marginProfiles, priceSnapshots, prices, products } from '../src/services/dataStore.js';

describe('pricing dashboard service', () => {
  it('builds pricing control rows with required columns', () => {
    const svc = new PricingDashboardService(products, prices, marginProfiles, marginProfileLines, []);
    const rows = svc.buildRows(getOverheadForProduct, {});
    expect(rows[0]).toHaveProperty('supplier');
    expect(rows[0]).toHaveProperty('price1');
    expect(rows[0]).toHaveProperty('price4');
    expect(rows[0]).toHaveProperty('variancePct');
  });

  it('handles zero cost safely', () => {
    const zeroPrices = prices.map((p) => ({ ...p, unitPrice: 0 }));
    const svc = new PricingDashboardService(products, zeroPrices, marginProfiles, marginProfileLines, []);
    const rows = svc.buildRows(getOverheadForProduct, {});
    expect(rows.every((r) => r.price1 >= 0)).toBe(true);
  });

  it('creates csv export', () => {
    const svc = new PricingDashboardService(products, prices, marginProfiles, marginProfileLines, priceSnapshots);
    const csv = svc.exportCsv(svc.buildRows(getOverheadForProduct, {}));
    expect(csv.split('\n')[0]).toContain('supplier');
  });
});
