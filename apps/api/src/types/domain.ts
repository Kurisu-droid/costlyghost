export type ProductType = 1 | 2 | 3 | 4 | 5 | 6;
export type ProductStatus = 'active' | 'inactive';
export type WasteMode = 'percentage' | 'fixed';

export type ExpenseSectionEnum =
  | 'RAW_MATERIAL_PRICES'
  | 'PRODUCTION_PARAMETERS'
  | 'PRODUCTION_LABOUR'
  | 'OFFICE_ADMIN'
  | 'FACTORY_GENERAL_OVERHEAD'
  | 'OPERATING_EXPENSES';

export type AllocationMethod = 'DIRECT' | 'HOURLY_FACTORY' | 'BY_WEIGHT' | 'BY_REVENUE';
export type ExpenseSourceType = 'MANUAL' | 'INVOICE_IMPORT' | 'PAYROLL_IMPORT' | 'SYSTEM';

export interface Supplier {
  id: string;
  name: string;
  country: string;
  currency: string;
  active: boolean;
}

export interface PriceItem {
  id: string;
  itemType: 'material' | 'component';
  itemId: string;
  supplierId: string;
  unit: string;
  currency: string;
  unitPrice: number;
  validFrom: string;
  active: boolean;
}

export interface ProductSpec {
  id: string;
  sku: string;
  name: string;
  subcategoryId: string;
  category: string;
  type: ProductType;
  status: ProductStatus;
  wasteMode: WasteMode;
  wasteValue: number;
  overheadSetOverrideId?: string | null;
  notes?: string;
  materialItemIds: string[];
  componentItemIds: string[];
  productionRatePerHour?: number;
  params: Record<string, number | string>;
}

export interface OverheadSet {
  id: string;
  effectiveDate: string;
  labourAnnual: number;
  factoryAnnual: number;
  operatingAnnual: number;
  machineCount: number;
  workingDays: number;
  hoursPerDay: number;
  utilizationPct: number;
}

export interface ExpenseDefinition {
  id: string;
  code: string;
  sectionEnum: ExpenseSectionEnum;
  category: string;
  nameEl: string;
  nameEn: string;
  unit: string;
  importableFromInvoice: boolean;
  allocationMethod: AllocationMethod;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseValueVersion {
  id: string;
  expenseDefinitionId: string;
  periodYear: number;
  periodMonth: number | null;
  amount: number;
  currency: string;
  sourceType: ExpenseSourceType;
  sourceBatchId?: string | null;
  notes?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductionParameterVersion {
  id: string;
  wastePercent: number;
  activeMachines: number;
  workingDaysPerYear: number;
  hoursPerDay: number;
  utilizationPercent: number;
  totalMachines: number;
  effectiveFrom: string;
  approvedAt?: string | null;
  createdAt: string;
}

export interface ExpenseImportMatch {
  id: string;
  sourceBatchId: string;
  sourceRowNumber: number;
  supplierName: string;
  description: string;
  matchedExpenseDefinitionId?: string;
  confidence: number;
  status: 'exact' | 'possible' | 'none' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ExpenseAllocationRule {
  id: string;
  expenseDefinitionId: string;
  allocationMethod: AllocationMethod;
  productCategory?: string;
  ratio: number;
  active: boolean;
  createdAt: string;
}

export interface HourlyCostSnapshot {
  id: string;
  periodYear: number;
  labourTotal: number;
  factoryOverheadTotal: number;
  operatingExpenseTotal: number;
  grandTotal: number;
  grossHoursPerYear: number;
  netHoursPerYear: number;
  hourlyFactoryCost: number;
  parameterVersionId: string;
  createdAt: string;
  finalized: boolean;
}

export interface CostBreakdown {
  sku: string;
  materialCost: number;
  packagingCost: number;
  overheadCost: number;
  wasteCost: number;
  directPurchaseCost: number;
  totalCost: number;
  calculationTimestamp: string;
  formulaVersion: string;
  warnings: string[];
  inputSnapshot: Record<string, unknown>;

  raw_material_cost?: number;
  packaging_cost_mandrel?: number;
  packaging_cost_box_label?: number;
  packaging_cost_carton?: number;
  packaging_cost_total?: number;
  overhead_per_piece?: number;
  total_cost?: number;
  total_cost_with_waste?: number;
}

export interface CostSnapshotRecord {
  id: string;
  sku: string;
  totalCost: number;
  formulaVersion: string;
  linkedOverheadSetId: string;
  linkedActivePriceItemIds: string[];
  breakdown: CostBreakdown;
  createdAt: string;
}

export interface MarginRule {
  category: string;
  tier: 1 | 2 | 3 | 4 | 5;
  marginPct: number;
}

export interface ParsedImportRow {
  sourceRowNumber: number;
  supplierName: string;
  invoiceDate: string;
  itemDescription: string;
  itemCode?: string;
  quantity?: number;
  unit?: string;
  unitPrice: number;
  totalValue?: number;
  currency: string;
  expenseCategoryCode?: string;
}

export type MatchStatus = 'exact' | 'possible' | 'none';

export interface MatchCandidate {
  itemId: string;
  score: number;
  status: MatchStatus;
}

export interface ProposedPriceChange {
  rowNumber: number;
  itemId?: string;
  status: MatchStatus;
  oldPrice?: number;
  importedPrice: number;
  deltaAbs?: number;
  deltaPct?: number;
  unitMismatch: boolean;
  ignored: boolean;
}

export interface QuoteLine {
  sku: string;
  description: string;
  quantity: number;
  unitCost: number;
  tierPrice: number;
  lineTotal: number;
}

export interface QuoteDocument {
  id: string;
  customerName: string;
  createdAt: string;
  marginTier: 1 | 2 | 3 | 4 | 5;
  lines: QuoteLine[];
  subtotal: number;
  currency: string;
}


export interface ImportBatch {
  id: string;
  fileName: string;
  sourceFormat: string;
  status: 'uploaded' | 'mapped' | 'review' | 'approved' | 'rejected';
  uploadedAt: string;
}

export interface ImportRowRecord {
  id: string;
  batchId: string;
  sourceRowNumber: number;
  rawPayload: Record<string, unknown>;
  normalizedDescription: string;
  ignored: boolean;
  splitGroupId?: string;
}

export interface RowMatchCandidate {
  id: string;
  batchId: string;
  rowId: string;
  candidateType: 'material' | 'component' | 'expense';
  candidateRefId: string;
  confidence: number;
  status: MatchStatus;
  unitMismatch: boolean;
  supplierAwareRank: number;
}

export interface ProposedExpenseUpdate {
  id: string;
  batchId: string;
  rowId: string;
  expenseDefinitionId: string;
  periodYear: number;
  periodMonth: number | null;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ImportMappingTemplate {
  id: string;
  templateName: string;
  sourceFormat: string;
  mapping: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}


export interface MarginProfile {
  id: string;
  name: string;
  active: boolean;
  state: 'live' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface MarginProfileLine {
  id: string;
  profileId: string;
  category: string;
  subcategoryId?: string;
  tier1Margin: number;
  tier2Margin: number;
  tier3Margin: number;
  tier4Margin: number;
  updatedAt: string;
}

export interface PriceSnapshot {
  id: string;
  sku: string;
  supplier: string;
  product: string;
  subcategory: string;
  m: number;
  um: number;
  eurPerKg: number;
  costEur: number;
  previousCostEur: number;
  price1: number;
  price2: number;
  price3: number;
  price4: number;
  freeCustom: string;
  variancePct: number;
  updatedAt: string;
  state: 'live' | 'draft';
}

export interface DraftPriceList {
  id: string;
  name: string;
  profileId: string;
  createdAt: string;
}


export type QuoteStatus = 'DRAFT' | 'FINALIZED' | 'SENT' | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface QuoteRecord {
  id: string;
  customerId: string;
  quoteNumber: string;
  currency: string;
  status: QuoteStatus;
  subtotal: number;
  discountTotal: number;
  netTotal: number;
  notes?: string;
  paymentTerms?: string;
  validityDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLineRecord {
  id: string;
  quoteId: string;
  productId: string;
  sku: string;
  description: string;
  subcategory: string;
  quantity: number;
  selectedTier: 1 | 2 | 3 | 4;
  selectedUnitPrice: number;
  costReference: number;
  lineSubtotal: number;
  discountPercent: number;
  discountAmount: number;
  netLineTotal: number;
  createdAt: string;
}

export interface QuoteLinePriceSnapshot {
  id: string;
  quoteLineId: string;
  tier1Price: number;
  tier2Price: number;
  tier3Price: number;
  tier4Price: number;
  costReference: number;
  capturedAt: string;
}

export interface QuoteStatusHistoryRecord {
  id: string;
  quoteId: string;
  fromStatus: QuoteStatus | null;
  toStatus: QuoteStatus;
  changedAt: string;
  changedBy: string;
}
