import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';
import { MatchCandidate, ParsedImportRow, PriceItem, ProposedPriceChange } from '../../types/domain.js';

export type ColumnMapping = Record<keyof Omit<ParsedImportRow, 'sourceRowNumber'>, string>;

export class ImportPipeline {
  parseBuffer(fileName: string, buffer: Buffer): Record<string, unknown>[] {
    if (fileName.endsWith('.csv')) {
      return parse(buffer, { columns: true, skip_empty_lines: true, bom: true });
    }
    const wb = XLSX.read(buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  }

  mapRows(rows: Record<string, unknown>[], mapping: ColumnMapping): ParsedImportRow[] {
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
      currency: String(raw[mapping.currency] ?? 'EUR')
    }));
  }

  matchRows(rows: ParsedImportRow[], items: PriceItem[]): Map<number, MatchCandidate> {
    const output = new Map<number, MatchCandidate>();
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
      } else {
        output.set(row.sourceRowNumber, { itemId: '', score: 0, status: 'none' });
      }
    }
    return output;
  }

  detectPriceChanges(rows: ParsedImportRow[], matches: Map<number, MatchCandidate>, activePrices: PriceItem[], tolerancePct = 0): ProposedPriceChange[] {
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
}

const similarity = (a: string, b: string): number => {
  const aa = new Set(a.toLowerCase().split(/\s+/));
  const bb = new Set(b.toLowerCase().split(/\s+/));
  const overlap = [...aa].filter((token) => bb.has(token)).length;
  return overlap / Math.max(aa.size, bb.size, 1);
};
