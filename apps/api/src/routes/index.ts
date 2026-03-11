import express from 'express';
import multer from 'multer';
import { CostingEngine } from '../services/costing/costingEngine.js';
import { ApprovalService } from '../services/import/approvalService.js';
import { ImportPipeline } from '../services/import/importPipeline.js';
import { PricingService } from '../services/pricing/pricingService.js';
import { PricingDashboardService } from '../services/pricing/dashboardService.js';
import { AuditService } from '../services/audit/auditService.js';
import {
  expenseAllocationRules,
  expenseDefinitions,
  expenseImportMatches,
  expenseValueVersions,
  finalizedExpenseYears,
  costSnapshots,
  getOverheadForProduct,
  hourlyCostSnapshots,
  importBatches,
  importMappingTemplates,
  importRows,
  marginProfileLines,
  marginProfiles,
  marginRules,
  priceSnapshots,
  prices,
  productionParameterVersions,
  draftPriceLists,
  products,
  proposedExpenseUpdates,
  proposedPriceChanges,
  quotes,
  customers,
  customerContacts,
  quoteRecords,
  quoteLines,
  quoteLinePriceSnapshots,
  quoteStatusHistory,
  quotePdfs,
  rowMatchCandidates,
  suppliers
} from '../services/dataStore.js';
import { ExpenseService } from '../services/expenses/expenseService.js';
import { QuoteService } from '../services/quotes/quoteService.js';
import { ImportService } from '../services/import/importService.js';

const upload = multer();
const importPipeline = new ImportPipeline();
const auditService = new AuditService();
const approvalService = new ApprovalService(auditService);
const expenseService = new ExpenseService(
  expenseDefinitions,
  expenseValueVersions,
  productionParameterVersions,
  expenseImportMatches,
  expenseAllocationRules,
  hourlyCostSnapshots,
  finalizedExpenseYears
);
const quoteService = new QuoteService(products, prices, getOverheadForProduct, marginProfileLines, customers, quoteRecords, quoteLines, quoteLinePriceSnapshots, quoteStatusHistory, customerContacts, quotePdfs);
const pricingDashboardService = new PricingDashboardService(products, prices, marginProfiles, marginProfileLines, priceSnapshots);

const importService = new ImportService(
  importBatches,
  importRows,
  rowMatchCandidates,
  proposedPriceChanges,
  proposedExpenseUpdates,
  importMappingTemplates,
  expenseValueVersions
);

export const router = express.Router();
router.use(express.json());

router.get('/health', (_req, res) => res.json({ ok: true }));
router.get('/suppliers', (_req, res) => res.json(suppliers));
router.get('/products', (_req, res) => res.json(products));
router.get('/prices', (_req, res) => res.json(prices));

router.get('/costing/:sku', (req, res) => {
  const product = products.find((p) => p.sku === req.params.sku);
  if (!product) return res.status(404).json({ error: 'SKU not found' });
  const engine = new CostingEngine(prices, costSnapshots);
  return res.json(engine.recalculateProduct(product, getOverheadForProduct(product)));
});


router.get('/costing/snapshots/:sku', (req, res) => {
  return res.json(costSnapshots.filter((s) => s.sku === req.params.sku));
});

router.get('/pricing/:sku', (req, res) => {
  const product = products.find((p) => p.sku === req.params.sku);
  if (!product) return res.status(404).json({ error: 'SKU not found' });
  const engine = new CostingEngine(prices, costSnapshots);
  const cost = engine.recalculateProduct(product, getOverheadForProduct(product));
  const pricing = new PricingService(marginRules).buildTierPrices(product.category, cost.totalCost);
  return res.json({ sku: product.sku, cost: cost.totalCost, tiers: pricing });
});


router.get('/dashboard/pricing-control', (req, res) => {
  const filters = {
    supplier: req.query.supplier ? String(req.query.supplier) : undefined,
    type: req.query.type ? String(req.query.type) : undefined,
    subcategory: req.query.subcategory ? String(req.query.subcategory) : undefined
  };
  const rows = pricingDashboardService.buildRows(getOverheadForProduct, filters);
  return res.json({ rows, draftPriceLists, marginProfiles });
});

router.get('/dashboard/pricing-control/export.csv', (req, res) => {
  const rows = pricingDashboardService.buildRows(getOverheadForProduct, {});
  const csv = pricingDashboardService.exportCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=pricing-control.csv');
  return res.send(csv);
});

router.get('/dashboard/pricing-control/:sku', (req, res) => {
  const product = products.find((p) => p.sku === req.params.sku);
  if (!product) return res.status(404).json({ error: 'SKU not found' });
  const snapshots = costSnapshots.filter((s) => s.sku === product.sku);
  const current = snapshots.at(-1);
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : current;
  const variancePct = previous && previous.totalCost > 0 && current ? ((current.totalCost - previous.totalCost) / previous.totalCost) * 100 : 0;
  return res.json({ product, current, previous, variancePct });
});

// Robust annual ERP import pipeline
router.post('/imports/batches/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing' });
  const sourceFormat = String(req.body.sourceFormat ?? 'ERP_GENERIC');
  const rawRows = importPipeline.parseBuffer(req.file.originalname, req.file.buffer);
  const batch = importService.createBatch(req.file.originalname, sourceFormat, rawRows);
  return res.status(201).json({ batch, sampleHeaders: Object.keys(rawRows[0] ?? {}) });
});

router.get('/imports/batches', (_req, res) => res.json(importBatches));
router.get('/imports/batches/:batchId/rows', (req, res) => res.json(importRows.filter((r) => r.batchId === req.params.batchId)));

router.get('/imports/templates', (req, res) => {
  const sourceFormat = req.query.sourceFormat ? String(req.query.sourceFormat) : undefined;
  return res.json(importService.listTemplates(sourceFormat));
});

router.post('/imports/templates', (req, res) => {
  const created = importService.saveTemplate(req.body.templateName, req.body.sourceFormat, req.body.mapping);
  return res.status(201).json(created);
});

router.post('/imports/batches/:batchId/map', (req, res) => {
  const batch = importBatches.find((b) => b.id === req.params.batchId);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });
  const mapping = req.body.mapping;
  if (!mapping) return res.status(400).json({ error: 'Mapping required' });

  const rawRows = importRows.filter((r) => r.batchId === req.params.batchId).map((r) => r.rawPayload);
  const parsed = importPipeline.mapRows(rawRows, mapping);
  const summary = importService.generateProposals(batch.id, parsed, suppliers, prices, expenseDefinitions, Number(req.body.periodYear ?? new Date().getFullYear()));
  return res.json({ summary, candidates: rowMatchCandidates.filter((c) => c.batchId === batch.id), proposedPriceChanges, proposedExpenseUpdates: proposedExpenseUpdates.filter((p) => p.batchId === batch.id) });
});

router.post('/imports/batches/:batchId/remap', (req, res) => {
  importService.remapRow(req.body.rowId, req.body.type, req.body.candidateRefId);
  return res.json({ ok: true });
});

router.post('/imports/batches/:batchId/ignore', (req, res) => {
  importService.ignoreRow(req.body.rowId);
  return res.json({ ok: true });
});

router.post('/imports/batches/:batchId/split', (req, res) => {
  const rows = importService.splitRow(req.body.rowId, req.body.splitAmounts ?? []);
  return res.json({ createdRows: rows.length });
});

router.post('/imports/batches/:batchId/approve', (req, res) => {
  const result = importService.approveSelected(req.params.batchId, req.body.approvedPriceRowNumbers ?? [], req.body.approvedExpenseIds ?? []);
  auditService.record({ eventType: 'IMPORT_APPROVED', actor: 'system', before: null, after: result });
  return res.json(result);
});

router.post('/imports/approve-prices', (req, res) => {
  const result = approvalService.approveChanges(req.body.proposals ?? [], prices, products, getOverheadForProduct);
  return res.json(result);
});

// Full Expenses & Overheads module
router.get('/expenses/definitions', (_req, res) => res.json(expenseDefinitions));
router.get('/expenses/value-versions/:year', (req, res) => res.json(expenseValueVersions.filter((v) => v.periodYear === Number(req.params.year))));
router.get('/expenses/production-parameters', (_req, res) => res.json(productionParameterVersions));
router.get('/expenses/import-matches/:batchId', (req, res) => res.json(expenseService.listImportMatches(req.params.batchId)));
router.get('/expenses/allocation-rules', (_req, res) => res.json(expenseService.listAllocationRules()));
router.get('/expenses/summary/:year', (req, res) => res.json(expenseService.summaryByYear(Number(req.params.year))));
router.get('/expenses/hourly-snapshots/:year', (req, res) => res.json(hourlyCostSnapshots.filter((s) => s.periodYear === Number(req.params.year))));

router.post('/expenses/value-versions/manual', (req, res) => {
  try {
    const created = expenseService.createManualValue(req.body);
    auditService.record({ eventType: 'EXPENSE_VALUE_VERSION_CREATED', actor: 'system', before: null, after: created });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/expenses/production-parameters', (req, res) => {
  try {
    const created = expenseService.createParameterVersion(req.body);
    auditService.record({ eventType: 'PRODUCTION_PARAMETER_VERSION_CREATED', actor: 'system', before: null, after: created });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/expenses/allocation-rules', (req, res) => {
  const saved = expenseService.upsertAllocationRule(req.body);
  auditService.record({ eventType: 'EXPENSE_ALLOCATION_RULE_UPSERTED', actor: 'system', before: null, after: saved });
  return res.status(201).json(saved);
});

router.post('/expenses/finalize/:year', (req, res) => {
  try {
    const snapshot = expenseService.finalizeYear(Number(req.params.year));
    auditService.record({ eventType: 'EXPENSE_YEAR_FINALIZED', actor: 'system', before: null, after: snapshot });
    return res.json(snapshot);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/quotes/search', (req, res) => {
  const query = String(req.query.q ?? '');
  return res.json(quoteService.searchProducts(query));
});

router.get('/quotes', (_req, res) => {
  return res.json(quoteService.listQuotes());
});

router.post('/customers', (req, res) => {
  const customer = quoteService.createOrFindCustomer(req.body);
  return res.status(201).json(customer);
});

router.post('/quotes', (req, res) => {
  try {
    const quote = quoteService.createQuoteDraft(req.body);
    auditService.record({ eventType: 'QUOTE_CREATED', actor: 'system', before: null, after: quote });
    return res.status(201).json(quote);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/quotes/:id/status', (req, res) => {
  try {
    const updated = quoteService.updateQuoteStatus(req.params.id, req.body.status);
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/quotes/:id', (req, res) => {
  try {
    return res.json(quoteService.getQuoteDetail(req.params.id));
  } catch (error) {
    return res.status(404).json({ error: (error as Error).message });
  }
});

router.get('/quotes/:id/pdf', (req, res) => {
  try {
    const pdf = quoteService.toPdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.id}.pdf`);
    return res.send(pdf);
  } catch (error) {
    return res.status(404).json({ error: (error as Error).message });
  }
});

router.get('/audit-events', (_req, res) => res.json(auditService.events));
