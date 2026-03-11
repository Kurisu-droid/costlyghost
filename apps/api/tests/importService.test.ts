import { describe, expect, it } from 'vitest';
import { ImportService } from '../src/services/import/importService.js';
import {
  expenseDefinitions,
  expenseValueVersions,
  importBatches,
  importMappingTemplates,
  importRows,
  prices,
  proposedExpenseUpdates,
  proposedPriceChanges,
  rowMatchCandidates,
  suppliers
} from '../src/services/dataStore.js';

describe('import service', () => {
  it('saves mapping templates and generates supplier-aware proposals', () => {
    const service = new ImportService([], [], [], [], [], [], []);
    const saved = service.saveTemplate('ERP', 'V1', { supplierName: 'Supplier' });
    expect(saved.templateName).toBe('ERP');
  });

  it('handles total-only rows and VAT rows safely', () => {
    const service = new ImportService(
      structuredClone(importBatches),
      structuredClone(importRows),
      structuredClone(rowMatchCandidates),
      structuredClone(proposedPriceChanges),
      structuredClone(proposedExpenseUpdates),
      structuredClone(importMappingTemplates),
      structuredClone(expenseValueVersions)
    );

    const batch = service.createBatch('erp.csv', 'ERP_GENERIC', [
      { Supplier: 'Αλουμίνιο ΑΕ', Date: '2026-01-10', Desc: 'ALU-FOIL-11', Code: 'ALU-FOIL-11', Qty: 0, Unit: 'kg', Price: 0, Total: 1000, Currency: 'EUR', ExpCode: 'OVR_POWER' },
      { Supplier: 'Αλουμίνιο ΑΕ', Date: '2026-01-11', Desc: 'VAT 24%', Code: '', Qty: 1, Unit: 'pcs', Price: 240, Total: 240, Currency: 'EUR', ExpCode: 'OVR_POWER' }
    ]);

    const parsedRows = [
      { sourceRowNumber: 2, supplierName: 'Αλουμίνιο ΑΕ', invoiceDate: '2026-01-10', itemDescription: 'ALU-FOIL-11', itemCode: 'ALU-FOIL-11', quantity: 0, unit: 'kg', unitPrice: 0, totalValue: 1000, currency: 'EUR', expenseCategoryCode: 'OVR_POWER' },
      { sourceRowNumber: 3, supplierName: 'Αλουμίνιο ΑΕ', invoiceDate: '2026-01-11', itemDescription: 'VAT 24%', itemCode: '', quantity: 1, unit: 'pcs', unitPrice: 240, totalValue: 240, currency: 'EUR', expenseCategoryCode: 'OVR_POWER' }
    ];

    const summary = service.generateProposals(batch.id, parsedRows as never, suppliers, prices, expenseDefinitions, 2026);
    expect(summary.totalProposedRawMaterialUpdates).toBeGreaterThanOrEqual(1);

    const approval = service.approveSelected(batch.id, [2], []);
    expect(approval.approvedPriceChanges).toBeGreaterThanOrEqual(0);
  });
});
