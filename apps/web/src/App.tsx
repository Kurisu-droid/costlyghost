import { NavLink, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { ImportWizardPage } from './pages/ImportWizardPage';
import { MasterDataPage } from './pages/MasterDataPage';

export const App = () => (
  <div className="shell">
    <aside className="sidebar">
      <h1>Cost Control</h1>
      <p>Σύστημα Κοστολόγησης</p>
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/imports">Invoice Imports</NavLink>
        <NavLink to="/master-data">Master Data</NavLink>
      </nav>
    </aside>
    <main className="content">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/imports" element={<ImportWizardPage />} />
        <Route path="/master-data" element={<MasterDataPage />} />
      </Routes>
    </main>
  </div>
);
