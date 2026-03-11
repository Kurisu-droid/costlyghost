import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export const FactoryCostsPage = () => {
  const [year, setYear] = useState(2026);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => { apiGet(`/expenses/summary/${year}`).then(setSummary); }, [year]);

  return (
    <section className="split costs-layout">
      <div className="panel">
        <h2>Factory Costs</h2>
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <table className="dense"><thead><tr><th>Section</th><th>Total</th></tr></thead><tbody>
          {(summary?.sections ?? []).map((s: any) => <tr key={s.section}><td>{s.section}</td><td>{Number(s.total).toFixed(2)}</td></tr>)}
        </tbody></table>
      </div>
      <aside className="panel sticky-summary">
        <h3>Live Hourly-Cost Summary</h3>
        <p>Labour: {Number(summary?.totals?.labourTotal ?? 0).toFixed(2)}</p>
        <p>Factory: {Number(summary?.totals?.factoryOverheadTotal ?? 0).toFixed(2)}</p>
        <p>Operating: {Number(summary?.totals?.operatingExpenseTotal ?? 0).toFixed(2)}</p>
        <p><strong>Grand Total: {Number(summary?.totals?.grandTotal ?? 0).toFixed(2)}</strong></p>
      </aside>
    </section>
  );
};
