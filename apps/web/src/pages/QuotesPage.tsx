import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

type ProductSuggestion = { sku: string; description: string; subcategory: string; cost: number; prices: { tier1: number; tier2: number; tier3: number; tier4: number } };

type Line = {
  sku: string;
  description: string;
  subcategory: string;
  quantity: number;
  tier: 1 | 2 | 3 | 4;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineSubtotal: number;
  netLineTotal: number;
};

export const QuotesPage = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [quoteId, setQuoteId] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) return setSuggestions([]);
    apiGet<ProductSuggestion[]>(`/quotes/search?q=${encodeURIComponent(query)}`).then(setSuggestions);
  }, [query]);

  const addSuggestion = (p: ProductSuggestion) => {
    setLines((prev) => [
      ...prev,
      {
        sku: p.sku,
        description: p.description,
        subcategory: p.subcategory,
        quantity: 1,
        tier: 1,
        unitPrice: p.prices.tier1,
        discountPercent: 0,
        discountAmount: 0,
        lineSubtotal: p.prices.tier1,
        netLineTotal: p.prices.tier1
      }
    ]);
    setQuery('');
    setSuggestions([]);
  };

  const recalc = (line: Line): Line => {
    const lineSubtotal = line.unitPrice * line.quantity;
    const discountAmount = line.discountAmount > 0 ? line.discountAmount : (line.discountPercent / 100) * lineSubtotal;
    const netLineTotal = lineSubtotal - discountAmount;
    return { ...line, lineSubtotal, discountAmount, netLineTotal };
  };

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((line, i) => (i === idx ? recalc({ ...line, ...patch }) : line)));
  };

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
    const discount = lines.reduce((s, l) => s + l.discountAmount, 0);
    const net = lines.reduce((s, l) => s + l.netLineTotal, 0);
    return { subtotal, discount, net };
  }, [lines]);

  const saveDraft = async () => {
    const result = await apiPost<any>('/quotes', {
      customer: { name: customerName },
      lines: lines.map((l) => ({
        sku: l.sku,
        quantity: l.quantity,
        tier: l.tier,
        manualUnitPrice: l.unitPrice,
        discountPercent: l.discountPercent,
        discountAmount: l.discountAmount
      }))
    });
    setQuoteId(result.quote.id);
  };

  const finalize = async () => {
    if (!quoteId) return;
    await apiPost(`/quotes/${quoteId}/status`, { status: 'FINALIZED' });
  };

  return (
    <section>
      <h2>Quote Builder</h2>

      <div className="panel">
        <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input placeholder="Type SKU or description..." value={query} onChange={(e) => setQuery(e.target.value)} />
        {suggestions.length > 0 && (
          <ul>
            {suggestions.map((s) => (
              <li key={s.sku}>
                <button onClick={() => addSuggestion(s)}>{s.sku} — {s.description} ({s.subcategory})</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>SKU</th><th>Description</th><th>Subcategory</th><th>Qty</th><th>Tier</th><th>Unit Price</th><th>Discount %</th><th>Discount €</th><th>Subtotal</th><th>Net</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={`${line.sku}-${idx}`}>
                <td>{line.sku}</td>
                <td>{line.description}</td>
                <td>{line.subcategory}</td>
                <td><input type="number" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} /></td>
                <td>
                  <select value={line.tier} onChange={(e) => updateLine(idx, { tier: Number(e.target.value) as 1 | 2 | 3 | 4 })}>
                    <option value={1}>Tier 1</option><option value={2}>Tier 2</option><option value={3}>Tier 3</option><option value={4}>Tier 4</option>
                  </select>
                </td>
                <td><input type="number" step="0.0001" value={line.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })} /></td>
                <td><input type="number" step="0.01" value={line.discountPercent} onChange={(e) => updateLine(idx, { discountPercent: Number(e.target.value), discountAmount: 0 })} /></td>
                <td><input type="number" step="0.01" value={line.discountAmount} onChange={(e) => updateLine(idx, { discountAmount: Number(e.target.value), discountPercent: 0 })} /></td>
                <td>{line.lineSubtotal.toFixed(2)}</td>
                <td>{line.netLineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>Totals</h3>
        <p>Subtotal: {totals.subtotal.toFixed(2)} EUR</p>
        <p>Discount: {totals.discount.toFixed(2)} EUR</p>
        <p><strong>Net Total: {totals.net.toFixed(2)} EUR</strong></p>
        <button onClick={saveDraft}>Save Draft</button>
        <button onClick={finalize} disabled={!quoteId}>Finalize</button>
        {quoteId && <a href={`http://localhost:4000/api/quotes/${quoteId}/pdf`} target="_blank">Export PDF</a>}
      </div>
    </section>
  );
};
