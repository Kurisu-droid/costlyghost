import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/client';

interface ImportBatch { id: string; fileName: string; status: string }
interface Template { id: string; templateName: string; sourceFormat: string; mapping: Record<string, string> }

const defaultMapping = {
  supplierName: 'Supplier',
  invoiceDate: 'Date',
  itemDescription: 'Desc',
  itemCode: 'Code',
  quantity: 'Qty',
  unit: 'Unit',
  unitPrice: 'Price',
  totalValue: 'Total',
  currency: 'Currency',
  expenseCategoryCode: 'ExpCode'
};

export const ImportWizardPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [batchId, setBatchId] = useState('');
  const [mappingText, setMappingText] = useState(JSON.stringify(defaultMapping, null, 2));
  const [summary, setSummary] = useState<string>('');

  const refresh = async () => {
    setTemplates(await apiGet('/imports/templates'));
    setBatches(await apiGet('/imports/batches'));
  };

  useEffect(() => { refresh(); }, []);

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file') as File;
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    body.append('sourceFormat', String(form.get('sourceFormat') || 'ERP_GENERIC'));
    const response = await fetch('http://localhost:4000/api/imports/batches/upload', { method: 'POST', body });
    const data = await response.json();
    setBatchId(data.batch.id);
    await refresh();
  };

  const saveTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await apiPost('/imports/templates', {
      templateName: 'ERP Yearly Template',
      sourceFormat: 'ERP_GENERIC',
      mapping: JSON.parse(mappingText)
    });
    await refresh();
  };

  const runMap = async () => {
    if (!batchId) return;
    const result = await apiPost(`/imports/batches/${batchId}/map`, {
      mapping: JSON.parse(mappingText),
      periodYear: new Date().getFullYear()
    });
    setSummary(JSON.stringify(result.summary, null, 2));
  };

  return (
    <section>
      <h2>Annual ERP Purchase Invoice Import</h2>

      <form className="panel" onSubmit={upload}>
        <h3>1) Upload CSV/XLSX</h3>
        <input type="file" name="file" required />
        <input type="text" name="sourceFormat" placeholder="Source format (e.g. ERP_GENERIC)" />
        <button type="submit">Create Import Batch</button>
      </form>

      <form className="panel" onSubmit={saveTemplate}>
        <h3>2) Column mapping template</h3>
        <textarea rows={12} style={{ width: '100%' }} value={mappingText} onChange={(e) => setMappingText(e.target.value)} />
        <button type="submit">Save Template</button>
      </form>

      <div className="panel">
        <h3>3) Run detection and proposal generation</h3>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">Select Batch</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.id} - {b.fileName} ({b.status})</option>)}
        </select>
        <button onClick={runMap}>Map & Generate Proposals</button>
      </div>

      <div className="panel">
        <h3>Saved templates</h3>
        <ul>{templates.map((t) => <li key={t.id}>{t.templateName} / {t.sourceFormat}</li>)}</ul>
      </div>

      <div className="panel">
        <h3>Summary Output</h3>
        <pre>{summary || 'Run map to view matched/unmatched counts, spend totals, and largest price changes.'}</pre>
      </div>
    </section>
  );
};
