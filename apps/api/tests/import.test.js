import { describe, expect, it } from 'vitest';
import { ImportPipeline } from '../src/services/import/importPipeline.js';
import { prices } from '../src/services/dataStore.js';
import { ApprovalService } from '../src/services/import/approvalService.js';
import { AuditService } from '../src/services/audit/auditService.js';
import { overhead, products } from '../src/services/dataStore.js';
describe('import workflow', () => {
    const pipeline = new ImportPipeline();
    it('maps csv rows using mapping template', () => {
        const rows = [{ Supplier: 'Αλουμίνιο ΑΕ', Date: '2026-02-01', Desc: 'ALU-FOIL-11', Code: 'ALU-FOIL-11', Qty: 1, Unit: 'kg', Price: 3.9, Total: 3.9, Currency: 'EUR' }];
        const mapped = pipeline.mapRows(rows, {
            supplierName: 'Supplier',
            invoiceDate: 'Date',
            itemDescription: 'Desc',
            itemCode: 'Code',
            quantity: 'Qty',
            unit: 'Unit',
            unitPrice: 'Price',
            totalValue: 'Total',
            currency: 'Currency'
        });
        expect(mapped[0].itemCode).toBe('ALU-FOIL-11');
    });
    it('detects unit mismatch warning and price deltas', () => {
        const mapped = [{ sourceRowNumber: 2, supplierName: 'x', invoiceDate: '2026', itemDescription: 'ALU-FOIL-11', itemCode: 'ALU-FOIL-11', unit: 'lt', unitPrice: 4.1, currency: 'EUR' }];
        const matches = pipeline.matchRows(mapped, prices);
        const changes = pipeline.detectPriceChanges(mapped, matches, prices, 0);
        expect(changes[0].unitMismatch).toBe(true);
        expect(changes[0].deltaAbs).toBeGreaterThan(0);
    });
    it('approves change and triggers recalculation', () => {
        const audit = new AuditService();
        const approval = new ApprovalService(audit);
        const result = approval.approveChanges([{ rowNumber: 2, itemId: 'ALU-FOIL-11', status: 'exact', oldPrice: 3.4, importedPrice: 4, unitMismatch: false, ignored: false }], structuredClone(prices), products, overhead);
        expect(result.approvedCount).toBe(1);
        expect(result.affectedSkus).toContain('SKU-FOIL-001');
    });
});
