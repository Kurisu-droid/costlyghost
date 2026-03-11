import { NavLink, Route, Routes } from 'react-router-dom';
import { OverviewPage } from './pages/OverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { FactoryCostsPage } from './pages/FactoryCostsPage';
import { PricingPage } from './pages/PricingPage';
import { QuotesPage } from './pages/QuotesPage';
import { CatalogPage } from './pages/CatalogPage';
import { ImportsPage } from './pages/ImportsPage';
import { HistoryPage } from './pages/HistoryPage';

const navItems = [
  ['/', 'Overview'],
  ['/products', 'Products'],
  ['/materials', 'Materials'],
  ['/factory-costs', 'Factory Costs'],
  ['/pricing', 'Pricing'],
  ['/quotes', 'Quotes'],
  ['/catalog', 'Catalog'],
  ['/imports', 'Imports'],
  ['/history', 'History']
] as const;

export const App = () => (
  <div className="shell">
    <aside className="sidebar">
      <h1>CostlyGhost Ops</h1>
      <p>Internal Operations System</p>
      <nav>
        {navItems.map(([path, label]) => (
          <NavLink key={path} to={path} end={path === '/'}>{label}</NavLink>
        ))}
      </nav>
    </aside>
    <main className="content">
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/factory-costs" element={<FactoryCostsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/imports" element={<ImportsPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </main>
  </div>
);
