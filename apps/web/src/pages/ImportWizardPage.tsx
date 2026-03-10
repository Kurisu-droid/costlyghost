const steps = ['Upload', 'Map Columns', 'Match Items', 'Review Changes', 'Approve & Recalculate'];

export const ImportWizardPage = () => (
  <section>
    <h2>Monthly Supplier Invoice Wizard</h2>
    <ol className="wizard-steps">
      {steps.map((step, i) => <li key={step}><span>{i + 1}</span>{step}</li>)}
    </ol>
    <div className="panel">
      <h3>Review Rules</h3>
      <ul>
        <li>No row is auto-applied without explicit approval.</li>
        <li>Unit mismatch rows are blocked and highlighted.</li>
        <li>Imported values create new price history rows.</li>
      </ul>
    </div>
  </section>
);
