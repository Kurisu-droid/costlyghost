import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
export class ImportPipeline {
    parseBuffer(fileName, buffer) {
        if (fileName.endsWith('.csv')) {
            return parse(buffer, { columns: true, skip_empty_lines: true, bom: true });
        }
        const wb = XLSX.read(buffer);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet);
    }
    mapRows(rows, mapping) {
        return rows.map((raw, index) => ({
            sourceRowNumber: index + 2,
            supplierName: String(raw[mapping.supplierName] ?? ''),
            invoiceDate: String(raw[mapping.invoiceDate] ?? ''),
            itemDescription: String(raw[mapping.itemDescription] ?? ''),
            itemCode: String(raw[mapping.itemCode] ?? ''),
            quantity: Number(raw[mapping.quantity] ?? 0),
            unit: String(raw[mapping.unit] ?? ''),
            unitPrice: Number(raw[mapping.unitPrice] ?? 0),
            totalValue: Number(raw[mapping.totalValue] ?? 0),
            currency: String(raw[mapping.currency] ?? 'EUR'),
            expenseCategoryCode: String(raw[mapping.expenseCategoryCode] ?? '')
        }));
    }
    matchRows(rows, items) {
        const output = new Map();
        for (const row of rows) {
            const exact = items.find((i) => row.itemCode && i.itemId.toLowerCase() === row.itemCode.toLowerCase());
            if (exact) {
                output.set(row.sourceRowNumber, { itemId: exact.itemId, score: 1, status: 'exact' });
                continue;
            }
            const possible = items
                .map((i) => ({ itemId: i.itemId, score: similarity(row.itemDescription, i.itemId) }))
                .sort((a, b) => b.score - a.score)[0];
            if (possible && possible.score >= 0.65) {
                output.set(row.sourceRowNumber, { ...possible, status: 'possible' });
            }
            else {
                output.set(row.sourceRowNumber, { itemId: '', score: 0, status: 'none' });
            }
        }
        return output;
    }
    detectPriceChanges(rows, matches, activePrices, tolerancePct = 0) {
        return rows.map((row) => {
            const match = matches.get(row.sourceRowNumber);
            if (!match || match.status === 'none') {
                return { rowNumber: row.sourceRowNumber, status: 'none', importedPrice: row.unitPrice, unitMismatch: false, ignored: false };
            }
            const active = activePrices.find((p) => p.itemId === match.itemId && p.active);
            const oldPrice = active?.unitPrice ?? 0;
            const deltaAbs = row.unitPrice - oldPrice;
            const deltaPct = oldPrice === 0 ? 100 : (deltaAbs / oldPrice) * 100;
            const unitMismatch = Boolean(active?.unit && row.unit && active.unit !== row.unit);
            return {
                rowNumber: row.sourceRowNumber,
                itemId: match.itemId,
                status: match.status,
                oldPrice,
                importedPrice: row.unitPrice,
                deltaAbs,
                deltaPct,
                unitMismatch,
                ignored: Math.abs(deltaPct) <= tolerancePct
            };
        });
    }
    detectExpenseMappings(rows, definitions) {
        const importable = definitions.filter((d) => d.importableFromInvoice && d.active);
        return rows.map((row) => {
            const exact = importable.find((item) => item.code.toLowerCase() === (row.expenseCategoryCode ?? '').toLowerCase());
            if (exact) {
                return { rowNumber: row.sourceRowNumber, expenseDefinitionId: exact.id, status: 'exact', amount: row.totalValue ?? row.unitPrice, confidence: 1 };
            }
            const possible = importable
                .map((item) => ({ expenseDefinitionId: item.id, score: Math.max(similarity(row.itemDescription, item.nameEl), similarity(row.itemDescription, item.nameEn)) }))
                .sort((a, b) => b.score - a.score)[0];
            if (possible && possible.score >= 0.55) {
                return { rowNumber: row.sourceRowNumber, expenseDefinitionId: possible.expenseDefinitionId, status: 'possible', amount: row.totalValue ?? row.unitPrice, confidence: possible.score };
            }
            return { rowNumber: row.sourceRowNumber, status: 'none', amount: row.totalValue ?? row.unitPrice, confidence: 0 };
        });
    }
    toExpenseValueVersions(rows, proposals, year, batchId) {
        return proposals
            .filter((proposal) => proposal.status !== 'none' && proposal.expenseDefinitionId)
            .map((proposal) => {
            const row = rows.find((entry) => entry.sourceRowNumber === proposal.rowNumber);
            return {
                id: `ev-imp-${proposal.rowNumber}`,
                expenseDefinitionId: proposal.expenseDefinitionId,
                periodYear: year,
                periodMonth: row?.invoiceDate ? new Date(row.invoiceDate).getMonth() + 1 : null,
                amount: proposal.amount,
                currency: row?.currency ?? 'EUR',
                sourceType: 'INVOICE_IMPORT',
                sourceBatchId: batchId,
                isActive: true,
                createdAt: new Date().toISOString()
            };
        });
    }
    toImportMatches(rows, proposals, batchId) {
        return proposals.map((proposal) => {
            const row = rows.find((entry) => entry.sourceRowNumber === proposal.rowNumber);
            return {
                id: `match-${batchId}-${proposal.rowNumber}`,
                sourceBatchId: batchId,
                sourceRowNumber: proposal.rowNumber,
                supplierName: row?.supplierName ?? '',
                description: row?.itemDescription ?? '',
                matchedExpenseDefinitionId: proposal.expenseDefinitionId,
                confidence: proposal.confidence,
                status: proposal.status,
                createdAt: new Date().toISOString()
            };
        });
    }
}
const similarity = (a, b) => {
    const aa = new Set(a.toLowerCase().split(/\s+/));
    const bb = new Set(b.toLowerCase().split(/\s+/));
    const overlap = [...aa].filter((token) => bb.has(token)).length;
    return overlap / Math.max(aa.size, bb.size, 1);
};
