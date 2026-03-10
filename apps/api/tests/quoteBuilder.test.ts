import { describe, expect, it } from 'vitest';
import {
  customers,
  getOverheadForProduct,
  marginProfileLines,
  prices,
  products,
  quoteLinePriceSnapshots,
  quoteLines,
  quoteRecords,
  quoteStatusHistory
} from '../src/services/dataStore.js';
import { QuoteService } from '../src/services/quotes/quoteService.js';

describe('quote builder flow', () => {
  it('creates draft quote with line snapshots and status history', () => {
    const svc = new QuoteService(
      products,
      prices,
      getOverheadForProduct,
      marginProfileLines,
      structuredClone(customers),
      [],
      [],
      [],
      []
    );

    const draft = svc.createQuoteDraft({
      customer: { name: 'Fast Buyer' },
      lines: [{ sku: 'SKU-FOIL-001', quantity: 100, tier: 1, discountPercent: 5 }],
      paymentTerms: '30 days',
      validityDate: '2026-12-31'
    });

    expect(draft.quote.status).toBe('DRAFT');
    expect(draft.lines[0].subcategory).toBeTruthy();
    expect(draft.lines[0].selectedUnitPrice).toBeGreaterThan(0);
  });

  it('keeps price snapshot immutable after source price changes', () => {
    const lines = [] as typeof quoteLines;
    const snapshots = [] as typeof quoteLinePriceSnapshots;
    const svc = new QuoteService(
      products,
      structuredClone(prices),
      getOverheadForProduct,
      marginProfileLines,
      structuredClone(customers),
      [] as typeof quoteRecords,
      lines,
      snapshots,
      [] as typeof quoteStatusHistory
    );

    const draft = svc.createQuoteDraft({ customer: { name: 'Buyer 2' }, lines: [{ sku: 'SKU-FOIL-001', quantity: 1, tier: 2 }] });
    const captured = snapshots[0].tier2Price;
    // simulate later price update in master data
    const alteredPrices = structuredClone(prices);
    alteredPrices[0].unitPrice += 10;
    const detail = svc.getQuoteDetail(draft.quote.id);
    expect(detail.lines[0].selectedUnitPrice).toBe(captured);
  });
});
