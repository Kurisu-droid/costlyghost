import {
  ExpenseDefinition,
  ExpenseValueVersion,
  ImportBatch,
  ImportMappingTemplate,
  ImportRowRecord,
  MatchStatus,
  ParsedImportRow,
  PriceItem,
  ProposedExpenseUpdate,
  ProposedPriceChange,
  RowMatchCandidate,
  Supplier
} from '../../types/domain.js';

export class ImportService {
  constructor(
    private readonly batches: ImportBatch[],
    private readonly rows: ImportRowRecord[],
    private readonly candidates: RowMatchCandidate[],
    private readonly proposedPrices: ProposedPriceChange[],
    private readonly proposedExpenses: ProposedExpenseUpdate[],
    private readonly mappingTemplates: ImportMappingTemplate[],
    private readonly expenseValues: ExpenseValueVersion[]
  ) {}

  createBatch(fileName: string, sourceFormat: string, rawRows: Record<string, unknown>[]): ImportBatch {
    const batch: ImportBatch = {
      id: `ib-${this.batches.length + 1}`,
      fileName,
      sourceFormat,
      status: 'uploaded',
      uploadedAt: new Date().toISOString()
    };
    this.batches.push(batch);
    rawRows.forEach((raw, idx) => {
      this.rows.push({
        id: `ir-${this.rows.length + 1}`,
        batchId: batch.id,
        sourceRowNumber: idx + 2,
        rawPayload: raw,
        normalizedDescription: normalize(String(raw['Desc'] ?? raw['Description'] ?? '')),
        ignored: false
      });
    });
    return batch;
  }

  saveTemplate(templateName: string, sourceFormat: string, mapping: Record<string, string>): ImportMappingTemplate {
    const existing = this.mappingTemplates.find((t) => t.templateName === templateName && t.sourceFormat === sourceFormat);
    if (existing) {
      existing.mapping = mapping;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }
    const template: ImportMappingTemplate = {
      id: `imt-${this.mappingTemplates.length + 1}`,
      templateName,
      sourceFormat,
      mapping,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.mappingTemplates.push(template);
    return template;
  }

  listTemplates(sourceFormat?: string): ImportMappingTemplate[] {
    return sourceFormat ? this.mappingTemplates.filter((t) => t.sourceFormat === sourceFormat) : this.mappingTemplates;
  }

  generateProposals(
    batchId: string,
    parsedRows: ParsedImportRow[],
    suppliers: Supplier[],
    prices: PriceItem[],
    expenseDefinitions: ExpenseDefinition[],
    periodYear: number
  ) {
    const scopedRows = this.rows.filter((r) => r.batchId === batchId);
    this.candidates.splice(0, this.candidates.length, ...this.candidates.filter((c) => c.batchId !== batchId));
    this.proposedPrices.splice(0, this.proposedPrices.length, ...this.proposedPrices.filter((c) => (c as unknown as { batchId?: string }).batchId !== batchId));
    this.proposedExpenses.splice(0, this.proposedExpenses.length, ...this.proposedExpenses.filter((c) => c.batchId !== batchId));

    for (const row of parsedRows) {
      const rowRecord = scopedRows.find((r) => r.sourceRowNumber === row.sourceRowNumber);
      if (!rowRecord) continue;
      const supplier = suppliers.find((s) => normalize(s.name) === normalize(row.supplierName));
      const materialCandidates = this.matchPriceCandidates(row, prices, supplier?.id);
      materialCandidates.forEach((c) => this.candidates.push({ ...c, id: `rc-${this.candidates.length + 1}`, batchId, rowId: rowRecord.id }));

      const topItem = materialCandidates[0];
      if (topItem) {
        const active = prices.find((p) => p.itemId === topItem.candidateRefId && p.active);
        const oldPrice = active?.unitPrice ?? 0;
        const deltaAbs = row.unitPrice - oldPrice;
        const deltaPct = oldPrice === 0 ? 100 : (deltaAbs / oldPrice) * 100;
        const unitMismatch = Boolean(active?.unit && row.unit && normalize(active.unit) !== normalize(row.unit));
        const totalOnly = (!row.quantity || row.quantity <= 0) && (row.totalValue ?? 0) > 0;
        this.proposedPrices.push({
          rowNumber: row.sourceRowNumber,
          itemId: topItem.candidateRefId,
          status: topItem.status,
          oldPrice,
          importedPrice: totalOnly ? oldPrice : row.unitPrice,
          deltaAbs,
          deltaPct,
          unitMismatch,
          ignored: totalOnly
        });
      }

      const exp = this.matchExpense(row, expenseDefinitions);
      if (exp) {
        this.candidates.push({ id: `rc-${this.candidates.length + 1}`, batchId, rowId: rowRecord.id, candidateType: 'expense', candidateRefId: exp.expenseDefinitionId, confidence: exp.confidence, status: exp.status, unitMismatch: false, supplierAwareRank: 0 });
        this.proposedExpenses.push({
          id: `peu-${this.proposedExpenses.length + 1}`,
          batchId,
          rowId: rowRecord.id,
          expenseDefinitionId: exp.expenseDefinitionId,
          periodYear,
          periodMonth: row.invoiceDate ? new Date(row.invoiceDate).getMonth() + 1 : null,
          amount: netAmount(row),
          currency: row.currency,
          status: 'pending'
        });
      }
    }

    const batch = this.batches.find((b) => b.id === batchId);
    if (batch) batch.status = 'review';

    return this.buildSummary(batchId);
  }

  remapRow(rowId: string, type: 'material' | 'component' | 'expense', candidateRefId: string) {
    if (type === 'expense') {
      const pe = this.proposedExpenses.find((p) => p.rowId === rowId);
      if (pe) pe.expenseDefinitionId = candidateRefId;
      return;
    }
    const pp = this.proposedPrices.find((p) => {
      const row = this.rows.find((r) => r.id === rowId);
      return row && p.rowNumber === row.sourceRowNumber;
    });
    if (pp) pp.itemId = candidateRefId;
  }

  ignoreRow(rowId: string) {
    const row = this.rows.find((r) => r.id === rowId);
    if (row) row.ignored = true;
    const pp = this.proposedPrices.find((p) => {
      const rr = this.rows.find((r) => r.id === rowId);
      return rr && p.rowNumber === rr.sourceRowNumber;
    });
    if (pp) pp.ignored = true;
    this.proposedExpenses.filter((e) => e.rowId === rowId).forEach((e) => (e.status = 'rejected'));
  }

  splitRow(rowId: string, splitAmounts: number[]) {
    const row = this.rows.find((r) => r.id === rowId);
    if (!row || splitAmounts.length < 2) return [];
    const gid = `split-${rowId}`;
    row.splitGroupId = gid;
    return splitAmounts.map((amount, idx) => {
      const clone: ImportRowRecord = {
        ...row,
        id: `ir-${this.rows.length + idx + 1}`,
        splitGroupId: gid,
        rawPayload: { ...row.rawPayload, SplitAmount: amount }
      };
      this.rows.push(clone);
      return clone;
    });
  }

  approveSelected(batchId: string, approvedPriceRowNumbers: number[], approvedExpenseIds: string[]) {
    const approvedExpenseRows = this.proposedExpenses.filter((p) => p.batchId === batchId && approvedExpenseIds.includes(p.id));
    approvedExpenseRows.forEach((entry) => {
      this.expenseValues.push({
        id: `ev-${this.expenseValues.length + 1}`,
        expenseDefinitionId: entry.expenseDefinitionId,
        periodYear: entry.periodYear,
        periodMonth: entry.periodMonth,
        amount: entry.amount,
        currency: entry.currency,
        sourceType: 'INVOICE_IMPORT',
        sourceBatchId: batchId,
        isActive: true,
        approvedAt: new Date().toISOString(),
        approvedBy: 'system',
        createdAt: new Date().toISOString()
      });
      entry.status = 'approved';
    });

    const approvedPrices = this.proposedPrices.filter((p) => approvedPriceRowNumbers.includes(p.rowNumber) && !p.ignored);
    const batch = this.batches.find((b) => b.id === batchId);
    if (batch) batch.status = 'approved';

    return {
      approvedPriceChanges: approvedPrices.length,
      approvedExpenseUpdates: approvedExpenseRows.length
    };
  }

  buildSummary(batchId: string) {
    const batchRows = this.rows.filter((r) => r.batchId === batchId);
    const unmatched = this.candidates.filter((c) => c.batchId === batchId && c.status === 'none').length;
    const skipped = batchRows.filter((r) => r.ignored).length;
    const expenseByDef = new Map<string, number>();
    this.proposedExpenses.filter((p) => p.batchId === batchId).forEach((p) => {
      expenseByDef.set(p.expenseDefinitionId, (expenseByDef.get(p.expenseDefinitionId) ?? 0) + p.amount);
    });
    const priceChanges = this.proposedPrices
      .filter((p) => !p.ignored)
      .sort((a, b) => Math.abs((b.deltaPct ?? 0)) - Math.abs((a.deltaPct ?? 0)))
      .slice(0, 5);

    return {
      matchedRows: batchRows.length - unmatched,
      unmatchedRows: unmatched,
      totalProposedSpendByCategory: [...expenseByDef.entries()],
      totalProposedRawMaterialUpdates: this.proposedPrices.filter((p) => !p.ignored).length,
      largestDetectedPriceChanges: priceChanges,
      skippedRowsSummary: skipped
    };
  }

  private matchPriceCandidates(row: ParsedImportRow, prices: PriceItem[], supplierId?: string): Omit<RowMatchCandidate, 'id' | 'batchId' | 'rowId'>[] {
    const normalizedDesc = normalize(row.itemDescription);
    const byCode = prices.find((p) => row.itemCode && normalize(p.itemId) === normalize(row.itemCode));
    if (byCode) return [{ candidateType: byCode.itemType, candidateRefId: byCode.itemId, confidence: 1, status: 'exact', unitMismatch: false, supplierAwareRank: byCode.supplierId === supplierId ? 1 : 2 }];

    const ranked = prices.map((price) => {
      const score = similarity(normalizedDesc, normalize(price.itemId));
      const supplierBoost = supplierId && price.supplierId === supplierId ? 0.2 : 0;
      const confidence = Math.min(1, score + supplierBoost);
      return { price, confidence };
    }).sort((a, b) => b.confidence - a.confidence);

    return ranked.slice(0, 3).map((r, idx) => ({
      candidateType: r.price.itemType,
      candidateRefId: r.price.itemId,
      confidence: r.confidence,
      status: statusFromScore(r.confidence),
      unitMismatch: Boolean(row.unit && normalize(r.price.unit) !== normalize(row.unit)),
      supplierAwareRank: idx + 1
    }));
  }

  private matchExpense(row: ParsedImportRow, defs: ExpenseDefinition[]): { expenseDefinitionId: string; status: MatchStatus; confidence: number } | null {
    if (row.expenseCategoryCode) {
      const exactCode = defs.find((d) => normalize(d.code) === normalize(row.expenseCategoryCode));
      if (exactCode) return { expenseDefinitionId: exactCode.id, status: 'exact', confidence: 1 };
    }
    const ranked = defs.map((d) => ({ def: d, confidence: Math.max(similarity(normalize(row.itemDescription), normalize(d.nameEl)), similarity(normalize(row.itemDescription), normalize(d.nameEn))) }))
      .sort((a, b) => b.confidence - a.confidence)[0];
    if (!ranked) return null;
    return { expenseDefinitionId: ranked.def.id, status: statusFromScore(ranked.confidence), confidence: ranked.confidence };
  }
}

const normalize = (input: string): string => input.toLowerCase().replace(/[.,/\\-]/g, ' ').replace(/\s+/g, ' ').trim();
const statusFromScore = (score: number): MatchStatus => (score >= 0.92 ? 'exact' : score >= 0.6 ? 'possible' : 'none');

const similarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aa = new Set(a.split(/\s+/));
  const bb = new Set(b.split(/\s+/));
  const overlap = [...aa].filter((token) => bb.has(token)).length;
  return overlap / Math.max(aa.size, bb.size, 1);
};

const netAmount = (row: ParsedImportRow): number => {
  const gross = row.totalValue ?? row.unitPrice * (row.quantity ?? 1);
  const desc = normalize(row.itemDescription);
  if (desc.includes('vat') || desc.includes('φπα') || desc.includes('tax')) return 0;
  return gross;
};
