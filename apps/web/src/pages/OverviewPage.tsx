import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export const OverviewPage = () => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    apiGet('/dashboard/pricing-control').then(setSummary).catch(() => setSummary({ rows: [] }));
  }, []);

  const rows = summary?.rows ?? [];
  const live = rows.filter((r: any) => r.state === 'live').length;

  return (
    <section>
      <header className="page-head"><h2>Overview</h2><p>Operational snapshot for daily decisions.</p></header>
      <div className="kpi-grid">
        <article><h4>SKUs in pricing control</h4><strong>{rows.length}</strong></article>
        <article><h4>Live rows</h4><strong>{live}</strong></article>
        <article><h4>Draft rows</h4><strong>{rows.length - live}</strong></article>
        <article><h4>Focus</h4><strong>Cost + Price + Quote</strong></article>
      </div>
    </section>
  );
};
