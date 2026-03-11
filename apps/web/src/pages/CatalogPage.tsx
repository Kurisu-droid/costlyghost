import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export const CatalogPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [included, setIncluded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiGet<any[]>('/products').then((list) => {
      setProducts(list);
      const init: Record<string, boolean> = {};
      list.forEach((p) => { init[p.id] = true; });
      setIncluded(init);
    });
  }, []);

  return (
    <section className="split">
      <div className="panel">
        <h2>Catalog Builder</h2>
        <table className="dense"><thead><tr><th>Include</th><th>Category</th><th>Subcategory</th><th>Product</th></tr></thead><tbody>
          {products.map((p) => <tr key={p.id}><td><input type="checkbox" checked={!!included[p.id]} onChange={(e) => setIncluded((x) => ({ ...x, [p.id]: e.target.checked }))} /></td><td>{p.category}</td><td>{p.subcategoryId}</td><td>{p.name}</td></tr>)}
        </tbody></table>
      </div>
      <aside className="panel sticky-summary">
        <h3>Print Preview</h3>
        <p>Selected products: {Object.values(included).filter(Boolean).length}</p>
        <p>Subcategory margin controls are managed in Pricing Profiles.</p>
        <button>Generate catalog preview</button>
      </aside>
    </section>
  );
};
