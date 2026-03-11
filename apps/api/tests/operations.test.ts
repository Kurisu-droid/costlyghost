import { describe, expect, it } from 'vitest';
import {
  expenseAllocationRules,
  expenseDefinitions,
  expenseImportMatches,
  expenseValueVersions,
  finalizedExpenseYears,
  getOverheadForProduct,
  hourlyCostSnapshots,
  prices,
  productionParameterVersions,
  products,
  marginProfileLines,
  customers,
  quoteRecords,
  quoteLines,
  quoteLinePriceSnapshots,
  quoteStatusHistory
} from '../src/services/dataStore.js';
import { ExpenseService } from '../src/services/expenses/expenseService.js';
import { QuoteService } from '../src/services/quotes/quoteService.js';

describe('operations modules', () => {
  it('creates and finalizes yearly hourly cost snapshot', () => {
    const svc = new ExpenseService(
      structuredClone(expenseDefinitions),
      structuredClone(expenseValueVersions),
      structuredClone(productionParameterVersions),
      structuredClone(expenseImportMatches),
      structuredClone(expenseAllocationRules),
      [],
      new Set<number>()
    );

    const snapshot = svc.finalizeYear(2026);
    expect(snapshot.grossHoursPerYear).toBe(20000);
    expect(snapshot.netHoursPerYear).toBe(15600);
    expect(snapshot.hourlyFactoryCost).toBeGreaterThan(0);
  });

  it('blocks finalization on zero utilization', () => {
    const params = structuredClone(productionParameterVersions);
    params[0].utilizationPercent = 0;
    const svc = new ExpenseService(
      structuredClone(expenseDefinitions),
      structuredClone(expenseValueVersions),
      params,
      structuredClone(expenseImportMatches),
      structuredClone(expenseAllocationRules),
      [],
      new Set<number>()
    );
    expect(() => svc.finalizeYear(2026)).toThrow();
  });

  it('locks year after finalization and prevents manual edits', () => {
    const svc = new ExpenseService(
      structuredClone(expenseDefinitions),
      structuredClone(expenseValueVersions),
      structuredClone(productionParameterVersions),
      structuredClone(expenseImportMatches),
      structuredClone(expenseAllocationRules),
      [],
      new Set<number>()
    );
    svc.finalizeYear(2026);
    expect(() => svc.createManualValue({ expenseDefinitionId: 'ed-18', periodYear: 2026, amount: 1000, currency: 'EUR' })).toThrow();
  });

  it('builds quote lines and exports deterministic pdf buffer', () => {
    const quoteService = new QuoteService(products, prices, getOverheadForProduct, marginProfileLines, structuredClone(customers), structuredClone(quoteRecords), structuredClone(quoteLines), structuredClone(quoteLinePriceSnapshots), structuredClone(quoteStatusHistory));
    const quote = quoteService.createQuoteDraft({
      customer: { name: 'Acme Retail' },
      lines: [{ sku: 'SKU-FOIL-001', quantity: 10, tier: 2 }]
    });
    const pdf = quoteService.toPdf(quote.quote.id);
    expect(quote.quote.total).toBeGreaterThan(0);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
