import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/client';

export const MaterialsPage = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    apiGet<any[]>('/suppliers').then(setSuppliers);
    apiGet<any[]>('/prices').then(setPrices);
  }, []);

  const preview = useMemo(() => {
    if (!selected || !newPrice) return null;
    const next = Number(newPrice);
    if (!Number.isFinite(next)) return null;
    const deltaPct = ((next - selected.unitPrice) / selected.unitPrice) * 100;
    return { next, deltaPct };
  }, [selected, newPrice]);

  return (
    <section>
      <header className="page-head"><h2>Materials</h2><p>Raw materials, components, suppliers, and safe price workflow.</p></header>
      <div className="panel"><strong>Suppliers:</strong> {suppliers.map((s) => s.name).join(' · ')}</div>
      <div className="panel">
        <table className="dense"><thead><tr><th>Item</th><th>Type</th><th>Supplier</th><th>Unit Price</th><th>Valid From</th></tr></thead><tbody>
          {prices.map((p) => <tr key={p.id} onClick={() => { setSelected(p); setNewPrice(String(p.unitPrice)); }}><td>{p.itemId}</td><td>{p.itemType}</td><td>{suppliers.find((s) => s.id === p.supplierId)?.name ?? p.supplierId}</td><td>{p.unitPrice.toFixed(4)}</td><td>{p.validFrom}</td></tr>)}
        </tbody></table>
      </div>

      {selected && (
        <aside className="drawer">
          <h3>New Price Workflow</h3>
          <p>{selected.itemId}</p>
          <label>Current</label><input value={selected.unitPrice} readOnly />
          <label>Proposed</label><input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
          {preview && <div className="panel"><p>Preview only (no overwrite)</p><p>New: {preview.next.toFixed(4)}</p><p>Impact: {preview.deltaPct.toFixed(2)}%</p><button>Create price proposal</button></div>}
          <button onClick={() => setSelected(null)}>Close</button>
        </aside>
      )}
    </section>
  );
};
