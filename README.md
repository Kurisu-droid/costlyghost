# CostlyGhost - Packaging Costing & Pricing Operations

Deterministic operations app for packaging manufacturing/trading.
No core workflow depends on AI.

## What is implemented now

### 1) Master data + costing/pricing
- Supplier and product masters
- Deterministic costing engine with 6 formula modules
- Margin tier pricing

### 2) Imports (draft-first)
- CSV/XLSX upload + mapping
- Raw-material price change proposals
- Expense match proposals (`expense_import_matches`)
- Approval flow for price updates only (no silent overwrite)

### 3) Full Expenses & Overheads module
Dedicated backend + UI for the exact sections:
- **A. ΤΙΜΕΣ Α' ΥΛΩΝ**
- **B. ΠΑΡΑΜΕΤΡΟΙ ΠΑΡΑΓΩΓΗΣ**
- **Γ. ΕΡΓΑΤΙΚΑ ΠΑΡΑΓΩΓΗΣ**
- **Δ. ΓΡΑΦΕΙΟ / ΔΙΟΙΚΗΣΗ**
- **Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ**
- **ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ**

With:
- versioned expense values (`expense_value_versions`)
- versioned production parameters (`production_parameter_versions`)
- allocation rules (`expense_allocation_rules`)
- import matches (`expense_import_matches`)
- hourly snapshots (`hourly_cost_snapshots`)
- year lock/finalize behavior

### 4) Hourly-cost summary formulas
- `gross_hours_per_year = active_machines * working_days_per_year * hours_per_day`
- `net_hours_per_year = gross_hours_per_year * utilization_percent`
- `hourly_factory_cost = grand_total / net_hours_per_year`

Validation rules:
- utilization must be > 0 and <= 1
- zero net hours block finalization
- divide-by-zero is blocked

### 5) Quotes
- SKU search
- Deterministic quote generation by tier
- server-side PDF export endpoint

## API highlights
- `GET /api/expenses/definitions`
- `GET /api/expenses/value-versions/:year`
- `POST /api/expenses/value-versions/manual`
- `POST /api/expenses/production-parameters`
- `GET /api/expenses/summary/:year`
- `POST /api/expenses/finalize/:year`
- `GET /api/expenses/hourly-snapshots/:year`
- `GET /api/expenses/import-matches/:batchId`
- `POST /api/expenses/allocation-rules`

## Local run
```bash
npm install
npm run dev -w apps/api
npm run dev -w apps/web
```

## Tests
```bash
npm run test -w apps/api
```


## Annual purchase-invoice import pipeline
Reusable typed flow for ERP CSV/XLSX exports:
1. Upload file to create `import_batches`
2. Parse rows into `import_rows`
3. Apply or save `import_mapping_templates`
4. Generate `row_match_candidates` for material/component/expense
5. Build `proposed_price_changes` and `proposed_expense_updates`
6. Review controls: remap, ignore, split, approve/reject selected
7. On approval, create expense value versions and preserve audit trail

Matching rules implemented:
- exact by item code
- exact by normalized description/code
- fuzzy Greek/English description ranking
- supplier-aware candidate boost
- unit mismatch flagging
- total-only row protection (no silent unit-price overwrite)
- VAT/tax contamination protection for expense amounts


## Costing engine upgrade (Type 1 fully working)
- Dedicated formula services:
  - `Type1FoilFormulaService`
  - `Type2StretchFormulaService`
  - `Type3BakingPaperFormulaService`
  - `Type4NapkinFormulaService`
  - `Type5TissueFormulaService`
  - `Type6TradeGoodsFormulaService`
- Type 1 now returns structured business breakdown fields:
  - `raw_material_cost`
  - `packaging_cost_mandrel`
  - `packaging_cost_box_label`
  - `packaging_cost_carton`
  - `packaging_cost_total`
  - `overhead_per_piece`
  - `waste_cost`
  - `total_cost`
  - `total_cost_with_waste`
- Types 2–6 keep production-ready infrastructure with explicit workbook insertion points.
- Every recalculation stores a cost snapshot linked to active price input IDs and overhead set ID.


## Operations / Pricing control sheet dashboard
Dashboard now behaves like a costing control sheet, with:
- required columns: supplier, product, subcategory, m, μm, €/kg, cost €, price1-4, free/custom, variance %, updated at
- pricing rule: `price = cost / (1 - margin)`
- default margins: price1 45%, price2 35%, price3 25%, price4 15%
- grouped rows by subcategory and filters by supplier/type/subcategory
- SKU detail drawer with previous/current cost and variance
- CSV export endpoint
- color-coded variance indicators and live/draft state visibility

Backend stores support:
- `margin_profiles`
- `margin_profile_lines`
- `price_snapshots`
- `draft_price_lists`


## Fast quote builder for daily sales
Implemented quote workflow:
1. Create quote draft
2. Select/create customer
3. Search SKU or description while typing
4. Auto-fill SKU, description, subcategory, cost reference, and live tier prices
5. Choose tier 1/2/3/4 or manual unit-price override, quantity, and discount %/amount
6. Compute line subtotal, discount, net line total, and quote totals
7. Save draft and optionally finalize
8. Export business-style PDF

Quote persistence structures:
- `customers`
- `quotes`
- `quote_lines`
- `quote_line_price_snapshots`
- `quote_status_history`

Snapshot guarantee:
- quote line prices are captured at creation and remain unchanged even if product prices change later.
