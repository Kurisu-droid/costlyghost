import { describe, expect, it } from 'vitest';
import { ImportPipeline } from '../src/services/import/importPipeline.js';
import { expenseDefinitions, prices } from '../src/services/dataStore.js';
import { ApprovalService } from '../src/services/import/approvalService.js';
import { AuditService } from '../src/services/audit/auditService.js';
import { getOverheadForProduct, products } from '../src/services/dataStore.js';

describe('import workflow', () => {
  const pipeline = new ImportPipeline();

  it('maps rows using mapping template including expense code', () => {
    const rows = [{ Supplier: 'Αλουμίνιο ΑΕ', Date: '2026-02-01', Desc: 'ALU-FOIL-11', Code: 'ALU-FOIL-11', Qty: 1, Unit: 'kg', Price: 3.9, Total: 3.9, Currency: 'EUR', ExpCode: 'OVR_POWER' }];
    const mapped = pipeline.mapRows(rows as never, {
      supplierName: 'Supplier',
      invoiceDate: 'Date',
      itemDescription: 'Desc',
      itemCode: 'Code',
      quantity: 'Qty',
      unit: 'Unit',
      unitPrice: 'Price',
      totalValue: 'Total',
      currency: 'Currency',
      expenseCategoryCode: 'ExpCode'
    });
    expect(mapped[0].expenseCategoryCode).toBe('OVR_POWER');
  });

  it('detects unit mismatch warning and price deltas', () => {
    const mapped = [{ sourceRowNumber: 2, supplierName: 'x', invoiceDate: '2026', itemDescription: 'ALU-FOIL-11', itemCode: 'ALU-FOIL-11', unit: 'lt', unitPrice: 4.1, currency: 'EUR', expenseCategoryCode: '' }];
    const matches = pipeline.matchRows(mapped as never, prices);
    const changes = pipeline.detectPriceChanges(mapped as never, matches, prices, 0);
    expect(changes[0].unitMismatch).toBe(true);
    expect(changes[0].deltaAbs).toBeGreaterThan(0);
  });

  it('creates expense value versions from mapped rows', () => {
    const mapped = [{ sourceRowNumber: 2, supplierName: 'x', invoiceDate: '2026-02-14', itemDescription: 'Ρεύμα εργοστασίου', itemCode: '', unit: 'pcs', unitPrice: 1500, totalValue: 1500, currency: 'EUR', expenseCategoryCode: 'OVR_POWER' }];
    const proposals = pipeline.detectExpenseMappings(mapped as never, expenseDefinitions);
    const versions = pipeline.toExpenseValueVersions(mapped as never, proposals, 2026, 'batch-1');
    expect(versions[0].expenseDefinitionId).toBe('ed-18');
    expect(versions[0].periodMonth).toBe(2);
  });

  it('approves change and triggers recalculation', () => {
    const audit = new AuditService();
    const approval = new ApprovalService(audit);
    const result = approval.approveChanges([{ rowNumber: 2, itemId: 'ALU-FOIL-11', status: 'exact', oldPrice: 3.4, importedPrice: 4, unitMismatch: false, ignored: false }], structuredClone(prices), products, getOverheadForProduct);
    expect(result.approvedCount).toBe(1);
    expect(result.affectedSkus).toContain('SKU-FOIL-001');
  });
});
