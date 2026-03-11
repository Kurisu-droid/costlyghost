import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

export const PricingPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [scenarioMargin, setScenarioMargin] = useState(35);

  useEffect(() => { apiGet('/dashboard/pricing-control').then((r: any) => setRows(r.rows)); }, []);

  const scenario = useMemo(() => {
    if (!selected) return null;
    const unit = selected.costEur / (1 - scenarioMargin / 100);
    return { unit };
  }, [selected, scenarioMargin]);

  return (
    <section>
      <header className="page-head"><h2>Pricing</h2><p>Operational table with margin tiers and impact preview.</p></header>
      <div className="panel">
        <table className="dense"><thead><tr><th>SKU</th><th>Cost</th><th>Tier1</th><th>Tier2</th><th>Tier3</th><th>Tier4</th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.sku} onClick={() => setSelected(r)}><td>{r.sku}</td><td>{r.costEur.toFixed(4)}</td><td>{r.price1.toFixed(4)}</td><td>{r.price2.toFixed(4)}</td><td>{r.price3.toFixed(4)}</td><td>{r.price4.toFixed(4)}</td></tr>)}
        </tbody></table>
      </div>
      {selected && <aside className="drawer"><h3>What-if Scenario</h3><p>{selected.sku}</p><label>Margin %</label><input type="number" value={scenarioMargin} onChange={(e) => setScenarioMargin(Number(e.target.value))} /><p>Scenario Unit Price: <strong>{scenario?.unit.toFixed(4)}</strong></p><button>Preview bulk impact</button><button onClick={() => setSelected(null)}>Close</button></aside>}
    </section>
  );
};
