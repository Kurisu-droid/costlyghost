import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

const tabs = ['Specs', 'Cost Breakdown', 'Pricing', 'BOM', 'History'] as const;

export const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Specs');
  const [cost, setCost] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);

  useEffect(() => { apiGet<any[]>('/products').then(setProducts); }, []);

  useEffect(() => {
    if (!selected) return;
    apiGet(`/costing/${selected.sku}`).then(setCost);
    apiGet(`/pricing/${selected.sku}`).then(setPricing);
  }, [selected]);

  return (
    <section className="split">
      <div className="panel">
        <h2>Products</h2>
        <table className="dense"><thead><tr><th>SKU</th><th>Name</th><th>Type</th></tr></thead><tbody>
          {products.map((p) => <tr key={p.id} onClick={() => setSelected(p)}><td>{p.sku}</td><td>{p.name}</td><td>{p.type}</td></tr>)}
        </tbody></table>
      </div>
      <div className="panel">
        {!selected ? <p>Select a product to inspect details.</p> : <>
          <h3>{selected.sku} — {selected.name}</h3>
          <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
          {tab === 'Specs' && <pre>{JSON.stringify(selected.params, null, 2)}</pre>}
          {tab === 'Cost Breakdown' && <pre>{JSON.stringify(cost?.breakdown ?? {}, null, 2)}</pre>}
          {tab === 'Pricing' && <pre>{JSON.stringify(pricing?.tiers ?? {}, null, 2)}</pre>}
          {tab === 'BOM' && <div><p>Materials: {(selected.materialItemIds ?? []).join(', ')}</p><p>Components: {(selected.componentItemIds ?? []).join(', ')}</p></div>}
          {tab === 'History' && <p>Use History page for full audit and rollback actions.</p>}
        </>}
      </div>
    </section>
  );
};
