import express from 'express';
import multer from 'multer';
import { CostingEngine } from '../services/costing/costingEngine.js';
import { ApprovalService } from '../services/import/approvalService.js';
import { ImportPipeline } from '../services/import/importPipeline.js';
import { PricingService } from '../services/pricing/pricingService.js';
import { AuditService } from '../services/audit/auditService.js';
import { marginRules, overhead, prices, products, suppliers } from '../services/dataStore.js';

const upload = multer();
const importPipeline = new ImportPipeline();
const auditService = new AuditService();
const approvalService = new ApprovalService(auditService);

export const router = express.Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.get('/suppliers', (_req, res) => res.json(suppliers));
router.get('/products', (_req, res) => res.json(products));

router.get('/costing/:sku', (req, res) => {
  const product = products.find((p) => p.sku === req.params.sku);
  if (!product) return res.status(404).json({ error: 'SKU not found' });
  const engine = new CostingEngine(prices);
  return res.json(engine.recalculateProduct(product, overhead));
});

router.get('/pricing/:sku', (req, res) => {
  const product = products.find((p) => p.sku === req.params.sku);
  if (!product) return res.status(404).json({ error: 'SKU not found' });
  const engine = new CostingEngine(prices);
  const cost = engine.recalculateProduct(product, overhead);
  const pricing = new PricingService(marginRules).buildTierPrices(product.category, cost.totalCost);
  return res.json({ sku: product.sku, cost: cost.totalCost, tiers: pricing });
});

router.post('/imports/preview', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing' });
  const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
  if (!mapping) return res.status(400).json({ error: 'Column mapping missing' });
  const rows = importPipeline.parseBuffer(req.file.originalname, req.file.buffer);
  const mappedRows = importPipeline.mapRows(rows, mapping);
  const matches = importPipeline.matchRows(mappedRows, prices);
  const proposed = importPipeline.detectPriceChanges(mappedRows, matches, prices, Number(req.body.tolerancePct ?? 0));
  return res.json({ rows: mappedRows.length, proposed });
});

router.post('/imports/approve', express.json(), (req, res) => {
  const result = approvalService.approveChanges(req.body.proposals ?? [], prices, products, overhead);
  return res.json(result);
});

router.get('/audit-events', (_req, res) => res.json(auditService.events));
