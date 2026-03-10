# CostlyGhost - Packaging Costing & Supplier Price Control

Production-oriented web app (AI optional) for deterministic costing, supplier invoice imports, review/approval, and SKU repricing.

## Architecture

- **Frontend**: React + TypeScript dashboard (`apps/web`)
- **Backend**: Express + TypeScript API (`apps/api`)
- **DB schema**: PostgreSQL via Prisma (`prisma/schema.prisma`)
- **Core services**:
  - deterministic costing engine with 6 formula modules
  - margin pricing service with 5 tiers
  - invoice import pipeline (CSV/XLSX)
  - proposal approval + recalculation propagation
  - audit event service
- **AI abstraction**: provider interface with `DisabledAIProvider` and `OllamaProvider` stubs

> App-first, AI-second: No calculation depends on AI.

## Backend modules and routes

### Core modules
- `services/costing/*`: Formula services and engine
- `services/import/*`: Parse/map/match/detect + approval flow
- `services/pricing/*`: deterministic margin pricing
- `services/audit/*`: event log
- `ai/provider.ts`: optional AI integration boundary

### API routes
- `GET /api/health`
- `GET /api/suppliers`
- `GET /api/products`
- `GET /api/costing/:sku`
- `GET /api/pricing/:sku`
- `POST /api/imports/preview` (multipart `file`, `mapping`, `tolerancePct`)
- `POST /api/imports/approve` (JSON proposals)
- `GET /api/audit-events`

## Frontend pages
- Dashboard (cost changes, margin erosion, approval queue)
- Invoice import wizard (flow A)
- Master data (Greek-friendly labels)

## Import workflow (deterministic)
1. Upload CSV/XLSX
2. Parse rows
3. Apply manual/saved mapping template
4. Match by exact code then fuzzy description
5. Show confidence (exact/possible/none)
6. Compute old vs new price delta + unit mismatch
7. User approves/rejects
8. New active price rows created; old rows deactivated
9. Recalculate affected SKUs and log audit

## Formula implementation notes
All 6 product types are isolated in dedicated classes. The current MVP contains deterministic baseline factors and explicit extension points for workbook-accurate math constants.

## Seed/demo data
In-memory demo data exists in `apps/api/src/services/dataStore.ts` for:
- suppliers
- materials/components prices
- products across multiple types
- overhead set
- margin table

Sample invoice file: `samples/monthly_invoice_sample.csv`.

## Local setup (non-Docker)

```bash
npm install
npm run dev -w apps/api
npm run dev -w apps/web
```

- API: `http://localhost:4000/api`
- Web: `http://localhost:5173`

## Tests

```bash
npm run test -w apps/api
```

Test coverage includes:
- import mapping
- price change detection
- unit mismatch warnings
- approval + recalculation propagation
- formula registry for all 6 product types
- margin pricing zero-cost behavior

## Future phase hooks
- enable Ollama provider in `ai/provider.ts`
- replace in-memory store with Prisma repositories
- implement draft/live price list persistence and rollback batches via DB transactions
