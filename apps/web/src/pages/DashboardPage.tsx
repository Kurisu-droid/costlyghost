import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

type Row = {
  sku: string;
  supplier: string;
  product: string;
  subcategory: string;
  m: number;
  um: number;
  eurPerKg: number;
  costEur: number;
  previousCostEur: number;
  price1: number;
  price2: number;
  price3: number;
  price4: number;
  freeCustom: string;
  variancePct: number;
  updatedAt: string;
  state: 'live' | 'draft';
};

export const DashboardPage = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [supplier, setSupplier] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [type, setType] = useState('');
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);

  const load = async () => {
    const q = new URLSearchParams();
    if (supplier) q.set('supplier', supplier);
    if (subcategory) q.set('subcategory', subcategory);
    if (type) q.set('type', type);
    const res = await apiGet<{ rows: Row[] }>(`/dashboard/pricing-control?${q.toString()}`);
    setRows(res.rows);
  };

  useEffect(() => { load(); }, [supplier, subcategory, type]);

  useEffect(() => {
    if (!selectedSku) return;
    apiGet(`/dashboard/pricing-control/${selectedSku}`).then(setDetail);
  }, [selectedSku]);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    rows.forEach((r) => {
      const key = `${r.subcategory}`;
      map.set(key, [...(map.get(key) ?? []), r]);
    });
    return [...map.entries()];
  }, [rows]);

  const csvExportUrl = 'http://localhost:4000/api/dashboard/pricing-control/export.csv';

  return (
    <section>
      <h2>Costing Control Sheet</h2>
      <div className="panel">
        <input placeholder="Filter supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        <input placeholder="Filter subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
        <input placeholder="Filter type" value={type} onChange={(e) => setType(e.target.value)} />
        <a href={csvExportUrl} target="_blank">Export CSV</a>
      </div>

      {grouped.map(([group, data]) => (
        <div className="panel" key={group}>
          <h3>{group}</h3>
          <table>
            <thead>
              <tr>
                <th>supplier</th>
                <th>product</th>
                <th>subcategory</th>
                <th>m</th>
                <th>μm</th>
                <th>€/kg</th>
                <th>cost €</th>
                <th>price 1</th>
                <th>price 2</th>
                <th>price 3</th>
                <th>price 4</th>
                <th>free/custom</th>
                <th>variance %</th>
                <th>updated at</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.sku} onClick={() => setSelectedSku(r.sku)}>
                  <td>{r.supplier}</td>
                  <td>{r.product}</td>
                  <td>{r.subcategory}</td>
                  <td>{r.m}</td>
                  <td>{r.um}</td>
                  <td>{r.eurPerKg.toFixed(4)}</td>
                  <td>{r.costEur.toFixed(4)}</td>
                  <td>{r.price1.toFixed(4)}</td>
                  <td>{r.price2.toFixed(4)}</td>
                  <td>{r.price3.toFixed(4)}</td>
                  <td>{r.price4.toFixed(4)}</td>
                  <td><input defaultValue={r.freeCustom} placeholder="override" /></td>
                  <td className={r.variancePct >= 0 ? 'up' : 'down'}>{r.variancePct.toFixed(2)}%</td>
                  <td>{new Date(r.updatedAt).toLocaleString()} ({r.state})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {selectedSku && detail && (
        <div className="panel">
          <h3>SKU Detail: {selectedSku}</h3>
          <p>Previous cost: {detail.previous?.totalCost?.toFixed?.(4) ?? '-'}</p>
          <p>Current cost: {detail.current?.totalCost?.toFixed?.(4) ?? '-'}</p>
          <p>Variance: {Number(detail.variancePct ?? 0).toFixed(2)}%</p>
          <button onClick={() => setSelectedSku(null)}>Close</button>
        </div>
      )}
    </section>
  );
};
