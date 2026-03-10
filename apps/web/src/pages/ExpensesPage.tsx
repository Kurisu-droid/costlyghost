import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

type Section =
  | 'RAW_MATERIAL_PRICES'
  | 'PRODUCTION_PARAMETERS'
  | 'PRODUCTION_LABOUR'
  | 'OFFICE_ADMIN'
  | 'FACTORY_GENERAL_OVERHEAD'
  | 'OPERATING_EXPENSES';

interface ExpenseDefinition { id: string; code: string; sectionEnum: Section; nameEl: string; importableFromInvoice: boolean }
interface ExpenseSummary {
  year: number;
  sections: Array<{ section: Section; total: number; items: Array<{ definitionId: string; nameEl: string; amount: number; sourceType: string; periodMonth: number | null }> }>;
  totals: { labourTotal: number; factoryOverheadTotal: number; operatingExpenseTotal: number; grandTotal: number };
  finalized: boolean;
}
interface Snapshot { grossHoursPerYear: number; netHoursPerYear: number; hourlyFactoryCost: number }

const sectionLabels: Record<Section, string> = {
  RAW_MATERIAL_PRICES: "A. ΤΙΜΕΣ Α' ΥΛΩΝ",
  PRODUCTION_PARAMETERS: 'B. ΠΑΡΑΜΕΤΡΟΙ ΠΑΡΑΓΩΓΗΣ',
  PRODUCTION_LABOUR: 'Γ. ΕΡΓΑΤΙΚΑ ΠΑΡΑΓΩΓΗΣ',
  OFFICE_ADMIN: 'Δ. ΓΡΑΦΕΙΟ / ΔΙΟΙΚΗΣΗ',
  FACTORY_GENERAL_OVERHEAD: 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ',
  OPERATING_EXPENSES: 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ'
};

export const ExpensesPage = () => {
  const [year, setYear] = useState(2026);
  const [definitions, setDefinitions] = useState<ExpenseDefinition[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');

  const refresh = async () => {
    const [defs, sum, snaps] = await Promise.all([
      apiGet<ExpenseDefinition[]>('/expenses/definitions'),
      apiGet<ExpenseSummary>(`/expenses/summary/${year}`),
      apiGet<Snapshot[]>(`/expenses/hourly-snapshots/${year}`)
    ]);
    setDefinitions(defs);
    setSummary(sum);
    setSnapshot(snaps.at(-1) ?? null);
  };

  useEffect(() => { refresh(); }, [year]);

  const defsBySection = useMemo(() => {
    const map = new Map<Section, ExpenseDefinition[]>();
    definitions.forEach((definition) => {
      map.set(definition.sectionEnum, [...(map.get(definition.sectionEnum) ?? []), definition]);
    });
    return map;
  }, [definitions]);

  const submitManualValue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiPost('/expenses/value-versions/manual', {
        expenseDefinitionId: String(form.get('expenseDefinitionId')),
        periodYear: year,
        periodMonth: form.get('periodMonth') ? Number(form.get('periodMonth')) : null,
        amount: Number(form.get('amount')),
        currency: 'EUR',
        notes: String(form.get('notes') || '')
      });
      await refresh();
      event.currentTarget.reset();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submitParameters = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiPost('/expenses/production-parameters', {
        wastePercent: Number(form.get('wastePercent')),
        activeMachines: Number(form.get('activeMachines')),
        workingDaysPerYear: Number(form.get('workingDaysPerYear')),
        hoursPerDay: Number(form.get('hoursPerDay')),
        utilizationPercent: Number(form.get('utilizationPercent')),
        totalMachines: Number(form.get('totalMachines')),
        effectiveFrom: `${year}-01-01`
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const finalizeYear = async () => {
    setError('');
    try {
      await apiPost(`/expenses/finalize/${year}`, {});
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section>
      <h2>Expenses & Overheads</h2>
      <div className="panel">
        <label>Year: <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        <button onClick={finalizeYear} disabled={summary?.finalized}>Finalize / Lock Year</button>
        {summary?.finalized && <strong className="ok">Finalized</strong>}
        {error && <p className="err">{error}</p>}
      </div>

      <div className="cards">
        <article><h3>Γ. Εργατικά Παραγωγής</h3><p>{summary?.totals.labourTotal.toFixed(2) ?? '0.00'} EUR</p></article>
        <article><h3>Ε. Γενικά Έξοδα Παραγωγής</h3><p>{summary?.totals.factoryOverheadTotal.toFixed(2) ?? '0.00'} EUR</p></article>
        <article><h3>ΣΤ. Λειτουργικά Έξοδα</h3><p>{summary?.totals.operatingExpenseTotal.toFixed(2) ?? '0.00'} EUR</p></article>
        <article><h3>ΓΕΝΙΚΟ ΣΥΝΟΛΟ</h3><p>{summary?.totals.grandTotal.toFixed(2) ?? '0.00'} EUR</p></article>
      </div>

      <div className="panel">
        <h3>ΣΥΝΟΨΗ — ΥΠΟΛΟΓΙΣΜΟΣ ΩΡΙΑΙΟΥ ΚΟΣΤΟΥΣ</h3>
        <p>Μικτές ώρες / έτος: {snapshot?.grossHoursPerYear ?? '-'}</p>
        <p>Καθαρές ώρες παραγωγής / έτος: {snapshot?.netHoursPerYear ?? '-'}</p>
        <p><strong>ΩΡΙΑΙΟ ΚΟΣΤΟΣ ΕΡΓΟΣΤΑΣΙΟΥ: {snapshot ? `${snapshot.hourlyFactoryCost.toFixed(6)} EUR` : '-'}</strong></p>
      </div>

      <form className="panel" onSubmit={submitParameters}>
        <h3>B. ΠΑΡΑΜΕΤΡΟΙ ΠΑΡΑΓΩΓΗΣ</h3>
        <input name="wastePercent" type="number" step="0.01" placeholder="Φύρα / Απώλειες %" required />
        <input name="activeMachines" type="number" placeholder="Ενεργές μηχανήματα" required />
        <input name="workingDaysPerYear" type="number" placeholder="Εργάσιμες ημέρες / έτος" required />
        <input name="hoursPerDay" type="number" step="0.1" placeholder="Ώρες εργασίας / ημέρα" required />
        <input name="utilizationPercent" type="number" step="0.01" min="0.01" max="1" placeholder="Αξιοποίηση (0..1)" required />
        <input name="totalMachines" type="number" placeholder="Σύνολο μηχανημάτων" required />
        <button type="submit">Save Parameter Version</button>
      </form>

      <form className="panel" onSubmit={submitManualValue}>
        <h3>Manual Expense Entry (versioned)</h3>
        <select name="expenseDefinitionId" required>
          <option value="">Select expense</option>
          {definitions.map((d) => <option key={d.id} value={d.id}>{d.nameEl} ({d.code})</option>)}
        </select>
        <input name="periodMonth" type="number" min={1} max={12} placeholder="Month (optional)" />
        <input name="amount" type="number" step="0.01" placeholder="Amount" required />
        <input name="notes" placeholder="Notes" />
        <button type="submit" disabled={summary?.finalized}>Add Version</button>
      </form>

      {Object.entries(sectionLabels).map(([key, label]) => (
        <div className="panel" key={key}>
          <h3>{label}</h3>
          <p>Definitions: {(defsBySection.get(key as Section) ?? []).map((d) => d.nameEl).join(' • ') || '-'}</p>
          <table>
            <thead><tr><th>Είδος</th><th>Ποσό</th><th>Πηγή</th><th>Μήνας</th></tr></thead>
            <tbody>
              {(summary?.sections.find((s) => s.section === key)?.items ?? []).map((item, i) => (
                <tr key={`${item.definitionId}-${i}`}><td>{item.nameEl}</td><td>{item.amount.toFixed(2)}</td><td>{item.sourceType}</td><td>{item.periodMonth ?? '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
};
