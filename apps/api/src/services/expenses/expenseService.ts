import {
  ExpenseAllocationRule,
  ExpenseDefinition,
  ExpenseImportMatch,
  ExpenseValueVersion,
  HourlyCostSnapshot,
  ProductionParameterVersion
} from '../../types/domain.js';

export interface ExpenseSectionView {
  section: string;
  items: Array<{ definitionId: string; nameEl: string; amount: number; sourceType: string; periodMonth: number | null }>;
  total: number;
}

export interface ExpenseYearSummary {
  year: number;
  sections: ExpenseSectionView[];
  totals: {
    labourTotal: number;
    factoryOverheadTotal: number;
    operatingExpenseTotal: number;
    grandTotal: number;
  };
  finalized: boolean;
}

export class ExpenseService {
  constructor(
    private readonly definitions: ExpenseDefinition[],
    private readonly values: ExpenseValueVersion[],
    private readonly parameterVersions: ProductionParameterVersion[],
    private readonly importMatches: ExpenseImportMatch[],
    private readonly allocationRules: ExpenseAllocationRule[],
    private readonly hourlySnapshots: HourlyCostSnapshot[],
    private readonly finalizedYears: Set<number>
  ) {}

  createManualValue(input: {
    expenseDefinitionId: string;
    periodYear: number;
    periodMonth?: number | null;
    amount: number;
    currency: string;
    notes?: string;
    approvedBy?: string;
  }): ExpenseValueVersion {
    this.assertYearUnlocked(input.periodYear);
    const definition = this.definitions.find((item) => item.id === input.expenseDefinitionId && item.active);
    if (!definition) throw new Error('Expense definition not found');
    if (input.amount < 0) throw new Error('Amount cannot be negative');

    const version: ExpenseValueVersion = {
      id: `ev-${this.values.length + 1}`,
      expenseDefinitionId: input.expenseDefinitionId,
      periodYear: input.periodYear,
      periodMonth: input.periodMonth ?? null,
      amount: input.amount,
      currency: input.currency,
      sourceType: 'MANUAL',
      notes: input.notes,
      approvedBy: input.approvedBy ?? null,
      approvedAt: input.approvedBy ? new Date().toISOString() : null,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.values.push(version);
    return version;
  }

  createParameterVersion(input: {
    wastePercent: number;
    activeMachines: number;
    workingDaysPerYear: number;
    hoursPerDay: number;
    utilizationPercent: number;
    totalMachines: number;
    effectiveFrom: string;
  }): ProductionParameterVersion {
    this.assertYearUnlocked(new Date(input.effectiveFrom).getFullYear());
    this.validateParameterInput(input.utilizationPercent, input.activeMachines, input.workingDaysPerYear, input.hoursPerDay);
    const version: ProductionParameterVersion = {
      id: `pp-${this.parameterVersions.length + 1}`,
      ...input,
      approvedAt: null,
      createdAt: new Date().toISOString()
    };
    this.parameterVersions.push(version);
    return version;
  }

  listSections(year: number): ExpenseSectionView[] {
    const yearValues = this.values.filter((entry) => entry.periodYear === year && entry.isActive);
    const grouped = new Map<string, ExpenseSectionView>();

    for (const definition of this.definitions.filter((entry) => entry.active)) {
      if (!grouped.has(definition.sectionEnum)) {
        grouped.set(definition.sectionEnum, { section: definition.sectionEnum, items: [], total: 0 });
      }
      const section = grouped.get(definition.sectionEnum)!;
      const related = yearValues.filter((entry) => entry.expenseDefinitionId === definition.id);
      for (const value of related) {
        section.items.push({ definitionId: definition.id, nameEl: definition.nameEl, amount: value.amount, sourceType: value.sourceType, periodMonth: value.periodMonth });
        section.total += value.amount;
      }
    }

    return [...grouped.values()];
  }

  summaryByYear(year: number): ExpenseYearSummary {
    const sections = this.listSections(year);
    const labourTotal = sectionTotal(sections, 'PRODUCTION_LABOUR');
    const factoryOverheadTotal = sectionTotal(sections, 'FACTORY_GENERAL_OVERHEAD');
    const operatingExpenseTotal = sectionTotal(sections, 'OPERATING_EXPENSES');

    return {
      year,
      sections,
      totals: {
        labourTotal,
        factoryOverheadTotal,
        operatingExpenseTotal,
        grandTotal: labourTotal + factoryOverheadTotal + operatingExpenseTotal
      },
      finalized: this.finalizedYears.has(year)
    };
  }

  finalizeYear(year: number): HourlyCostSnapshot {
    if (this.finalizedYears.has(year)) throw new Error('Year already finalized');
    const summary = this.summaryByYear(year);
    const parameter = this.latestParameterForYear(year);
    if (!parameter) throw new Error('No production parameters available for this year');

    const grossHoursPerYear = parameter.activeMachines * parameter.workingDaysPerYear * parameter.hoursPerDay;
    const netHoursPerYear = grossHoursPerYear * parameter.utilizationPercent;

    if (parameter.utilizationPercent <= 0) throw new Error('Utilization must be greater than zero');
    if (netHoursPerYear <= 0) throw new Error('Zero net production hours: finalization blocked');

    const snapshot: HourlyCostSnapshot = {
      id: `hc-${this.hourlySnapshots.length + 1}`,
      periodYear: year,
      labourTotal: summary.totals.labourTotal,
      factoryOverheadTotal: summary.totals.factoryOverheadTotal,
      operatingExpenseTotal: summary.totals.operatingExpenseTotal,
      grandTotal: summary.totals.grandTotal,
      grossHoursPerYear,
      netHoursPerYear,
      hourlyFactoryCost: Number((summary.totals.grandTotal / netHoursPerYear).toFixed(6)),
      parameterVersionId: parameter.id,
      createdAt: new Date().toISOString(),
      finalized: true
    };

    this.hourlySnapshots.push(snapshot);
    this.finalizedYears.add(year);
    return snapshot;
  }

  latestSnapshot(year: number): HourlyCostSnapshot | undefined {
    return [...this.hourlySnapshots].reverse().find((entry) => entry.periodYear === year);
  }

  addImportMatches(matches: ExpenseImportMatch[]) {
    this.importMatches.push(...matches);
  }

  listImportMatches(batchId: string): ExpenseImportMatch[] {
    return this.importMatches.filter((entry) => entry.sourceBatchId === batchId);
  }

  listAllocationRules(): ExpenseAllocationRule[] {
    return this.allocationRules;
  }

  upsertAllocationRule(input: Omit<ExpenseAllocationRule, 'id' | 'createdAt'> & { id?: string }): ExpenseAllocationRule {
    const existing = input.id ? this.allocationRules.find((entry) => entry.id === input.id) : null;
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const created: ExpenseAllocationRule = {
      ...input,
      id: `ar-${this.allocationRules.length + 1}`,
      createdAt: new Date().toISOString()
    };
    this.allocationRules.push(created);
    return created;
  }

  private latestParameterForYear(year: number): ProductionParameterVersion | undefined {
    return [...this.parameterVersions]
      .filter((entry) => new Date(entry.effectiveFrom).getFullYear() <= year)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  }

  private validateParameterInput(utilizationPercent: number, activeMachines: number, workingDaysPerYear: number, hoursPerDay: number) {
    if (!utilizationPercent || utilizationPercent <= 0) throw new Error('Utilization must be greater than zero');
    if (utilizationPercent > 1) throw new Error('Utilization must be expressed as 0..1');
    if (activeMachines <= 0 || workingDaysPerYear <= 0 || hoursPerDay <= 0) throw new Error('Production parameters must be positive values');
  }

  private assertYearUnlocked(year: number) {
    if (this.finalizedYears.has(year)) throw new Error('Year is finalized and locked');
  }
}

const sectionTotal = (sections: ExpenseSectionView[], section: string): number =>
  sections.find((entry) => entry.section === section)?.total ?? 0;
