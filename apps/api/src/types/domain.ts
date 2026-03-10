export type ProductType = 1 | 2 | 3 | 4 | 5 | 6;

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
  sku: string;
  name: string;
  category: string;
  type: ProductType;
  wastePct: number;
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

export interface CostBreakdown {
  sku: string;
  materialCost: number;
  packagingCost: number;
  overheadCost: number;
  wasteCost: number;
  directPurchaseCost: number;
  totalCost: number;
  formulaVersion: string;
  timestamp: string;
  warnings: string[];
  inputSnapshot: Record<string, unknown>;
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
