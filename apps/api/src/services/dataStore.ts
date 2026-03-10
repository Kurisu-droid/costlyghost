import {
  ExpenseAllocationRule,
  ExpenseDefinition,
  ExpenseImportMatch,
  ExpenseValueVersion,
  HourlyCostSnapshot,
  ImportBatch,
  ImportMappingTemplate,
  ImportRowRecord,
  CostSnapshotRecord,
  DraftPriceList,
  MarginProfile,
  MarginProfileLine,
  MarginRule,
  OverheadSet,
  PriceItem,
  ProductSpec,
  ProductionParameterVersion,
  ProposedExpenseUpdate,
  PriceSnapshot,
  ProposedPriceChange,
  Customer,
  QuoteDocument,
  QuoteLinePriceSnapshot,
  QuoteLineRecord,
  QuoteRecord,
  QuoteStatusHistoryRecord,
  RowMatchCandidate,
  Supplier
} from '../types/domain.js';

export const suppliers: Supplier[] = [
  { id: 'sup-1', name: 'Αλουμίνιο ΑΕ', country: 'GR', currency: 'EUR', active: true },
  { id: 'sup-2', name: 'PackTrade SRL', country: 'RO', currency: 'EUR', active: true }
];

export const prices: PriceItem[] = [
  { id: 'p1', itemType: 'material', itemId: 'ALU-FOIL-11', supplierId: 'sup-1', unit: 'kg', currency: 'EUR', unitPrice: 3.4, validFrom: '2026-01-01', active: true },
  { id: 'p2', itemType: 'material', itemId: 'PE-STRETCH', supplierId: 'sup-2', unit: 'kg', currency: 'EUR', unitPrice: 2.1, validFrom: '2026-01-01', active: true },
  { id: 'p3', itemType: 'component', itemId: 'BOX-TRAY-A', supplierId: 'sup-2', unit: 'pcs', currency: 'EUR', unitPrice: 0.18, validFrom: '2026-01-01', active: true }
];

export const products: ProductSpec[] = [
  {
    id: 'prod-1', sku: 'SKU-FOIL-001', name: 'Foil 30m', subcategoryId: 'foil-household', category: 'Foil', type: 1,
    status: 'active', wasteMode: 'percentage', wasteValue: 2, overheadSetOverrideId: null, notes: 'Core foil item',
    materialItemIds: ['ALU-FOIL-11'], componentItemIds: ['BOX-TRAY-A'], productionRatePerHour: 450, params: { description: 'Foil 30m', length_m: 30, width_cm: 29, thickness_mic: 11, density_or_gsm: 2.7, net_weight_kg: 0.26, mandrel_cost: 0.03, box_label_cost: 0.04, carton_cost: 0.55, pieces_per_carton: 24, pieces_per_hour: 450, hourly_factory_cost: 6.2 }
  },
  {
    id: 'prod-2', sku: 'SKU-STRETCH-001', name: 'Stretch 300m', subcategoryId: 'stretch-consumer', category: 'Stretch', type: 2,
    status: 'active', wasteMode: 'percentage', wasteValue: 3, overheadSetOverrideId: null, notes: 'Stretch line A',
    materialItemIds: ['PE-STRETCH'], componentItemIds: ['BOX-TRAY-A'], productionRatePerHour: 380, params: { micron: 10 }
  },
  {
    id: 'prod-3', sku: 'SKU-TRAY-001', name: 'Trade Tray', subcategoryId: 'trade-trays', category: 'Trade', type: 6,
    status: 'active', wasteMode: 'fixed', wasteValue: 0, overheadSetOverrideId: 'ov-trade', notes: 'Imported tray line',
    materialItemIds: ['BOX-TRAY-A'], componentItemIds: [], params: {}
  }
];

export const overheadSets: OverheadSet[] = [
  { id: 'ov-2026-01', effectiveDate: '2026-01-01', labourAnnual: 450000, factoryAnnual: 270000, operatingAnnual: 185000, machineCount: 6, workingDays: 250, hoursPerDay: 16, utilizationPct: 78 },
  { id: 'ov-trade', effectiveDate: '2026-01-01', labourAnnual: 120000, factoryAnnual: 65000, operatingAnnual: 45000, machineCount: 2, workingDays: 250, hoursPerDay: 8, utilizationPct: 70 }
];

const now = new Date().toISOString();

const def = (id: string, code: string, sectionEnum: ExpenseDefinition['sectionEnum'], category: string, nameEl: string, nameEn: string, importableFromInvoice = true): ExpenseDefinition => ({
  id, code, sectionEnum, category, nameEl, nameEn, unit: 'EUR', importableFromInvoice, allocationMethod: 'HOURLY_FACTORY', active: true, createdAt: now, updatedAt: now
});

export const expenseDefinitions: ExpenseDefinition[] = [
  def('ed-1', 'RAW_ALUMINIO', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Αλουμίνιο', 'Aluminium'),
  def('ed-2', 'RAW_PVC_HOME', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Μεμβράνη Οικιακή PVC', 'Household PVC Film'),
  def('ed-3', 'RAW_PE_HOME', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Μεμβράνη Οικιακή PE', 'Household PE Film'),
  def('ed-4', 'RAW_PRO_FILM', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Μεμβράνη Επαγγελματική', 'Professional Film'),
  def('ed-5', 'RAW_FOIL_PAINT', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Βαφή αλουμινοχάρτου', 'Foil Paint'),
  def('ed-6', 'RAW_BAKING', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Λαδόκολλα (Baking paper)', 'Baking Paper'),
  def('ed-7', 'RAW_SILIDOR', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Αντικολλητικό / Silidor', 'Silidor'),
  def('ed-8', 'RAW_NONSTICK_SHEETS', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Αντικολλητικό Φύλλα', 'Non-stick Sheets'),
  def('ed-9', 'RAW_WHITE_TISSUE', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Χαρτί χ/π ΛΕΥΚΟ', 'White Tissue Paper'),
  def('ed-10', 'RAW_PLASTIC_TISSUE', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Πλαστικό χ/π', 'Tissue Plastic'),
  def('ed-11', 'RAW_STRETCH_CLEAR', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Stretch Film Διαφανό', 'Stretch Film Clear'),
  def('ed-12', 'RAW_STRETCH_BLACK', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Stretch Film Μαύρο', 'Stretch Film Black'),
  def('ed-13', 'RAW_STRETCH_BOX', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Κιβώτιο Stretch Film', 'Stretch Film Box'),
  def('ed-14', 'LABOUR_PROD', 'PRODUCTION_LABOUR', 'Γ. ΕΡΓΑΤΙΚΑ ΠΑΡΑΓΩΓΗΣ', 'Γ. Εργατικά Παραγωγής', 'Production Labour', false),
  def('ed-15', 'OFFICE_ADMIN', 'OFFICE_ADMIN', 'Δ. ΓΡΑΦΕΙΟ / ΔΙΟΙΚΗΣΗ', 'Δ. Γραφείο / Διοίκηση', 'Office / Administration', false),
  def('ed-16', 'OVR_GLUE', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Κόλα', 'Glue'),
  def('ed-17', 'OVR_SPARE_PARTS', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Ανταλλακτικά', 'Spare Parts'),
  def('ed-18', 'OVR_POWER', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Ρεύμα', 'Electricity'),
  def('ed-19', 'OVR_DEPR', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Αποσβέσεις μηχανημάτων', 'Machine Depreciation', false),
  def('ed-20', 'OVR_MAINT', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Συντήρηση μηχανημάτων', 'Machine Maintenance'),
  def('ed-21', 'OVR_LUBE', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Λιπαντικά', 'Lubricants'),
  def('ed-22', 'OVR_RENT', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Ενοίκιο εργοστασίου', 'Factory Rent', false),
  def('ed-23', 'OVR_BUILDING_INS', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Ασφάλιση κτιρίου', 'Building Insurance', false),
  def('ed-24', 'OVR_CLEANING', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Καθαρισμός εργοστασίου', 'Factory Cleaning'),
  def('ed-25', 'OVR_AIR', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Πεπιεσμένος αέρας', 'Compressed Air'),
  def('ed-26', 'OVR_COMMON', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Λοιπά κοινόχρηστα', 'Other Shared Utilities'),
  def('ed-27', 'OP_OFFICE_ADMIN', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Γραφείο / Διοίκηση', 'Office / Administration', false),
  def('ed-28', 'OP_SALES_PAYROLL', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Μισθοδοσία πωλήσεων', 'Sales Payroll', false),
  def('ed-29', 'OP_SALES_COMM', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Προμήθειες πωλήσεων', 'Sales Commissions', false),
  def('ed-30', 'OP_EXHIBITIONS', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Εκθέσεις', 'Exhibitions'),
  def('ed-31', 'OP_MARKETING', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Marketing', 'Marketing'),
  def('ed-32', 'OP_FUEL', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Καύσιμα διανομής', 'Distribution Fuel'),
  def('ed-33', 'OP_VAN', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Βαν μεταφορών', 'Delivery Vans'),
  def('ed-34', 'OP_COURIER', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Couriers', 'Couriers'),
  def('ed-35', 'OP_LOGISTICS', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Logistics / 3PL', 'Logistics / 3PL'),
  def('ed-36', 'OP_OFFICE_UTIL', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Κοινόχρηστα γραφείου', 'Office Utilities'),
  def('ed-37', 'OP_TEL_NET', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Τηλέφωνο / Internet', 'Phone / Internet'),
  def('ed-38', 'OP_SOFTWARE', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Software / Συνδρομές', 'Software / Subscriptions')
];

export const expenseValueVersions: ExpenseValueVersion[] = [
  { id: 'ev-1', expenseDefinitionId: 'ed-14', periodYear: 2026, periodMonth: null, amount: 430000, currency: 'EUR', sourceType: 'PAYROLL_IMPORT', isActive: true, createdAt: now },
  { id: 'ev-2', expenseDefinitionId: 'ed-18', periodYear: 2026, periodMonth: null, amount: 120000, currency: 'EUR', sourceType: 'INVOICE_IMPORT', isActive: true, createdAt: now },
  { id: 'ev-3', expenseDefinitionId: 'ed-20', periodYear: 2026, periodMonth: null, amount: 48000, currency: 'EUR', sourceType: 'INVOICE_IMPORT', isActive: true, createdAt: now },
  { id: 'ev-4', expenseDefinitionId: 'ed-27', periodYear: 2026, periodMonth: null, amount: 150000, currency: 'EUR', sourceType: 'MANUAL', isActive: true, createdAt: now }
];

export const productionParameterVersions: ProductionParameterVersion[] = [
  {
    id: 'pp-1', wastePercent: 2.5, activeMachines: 5, workingDaysPerYear: 250, hoursPerDay: 16,
    utilizationPercent: 0.78, totalMachines: 6, effectiveFrom: '2026-01-01', approvedAt: now, createdAt: now
  }
];

export const expenseImportMatches: ExpenseImportMatch[] = [];
export const expenseAllocationRules: ExpenseAllocationRule[] = [];
export const hourlyCostSnapshots: HourlyCostSnapshot[] = [];
export const finalizedExpenseYears: Set<number> = new Set();

export const quotes: QuoteDocument[] = [];

export const customers: Customer[] = [
  { id: 'cust-1', name: 'Demo Retail SA', vatNumber: 'EL123456789', email: 'buyer@demoretail.gr', phone: '+30-210-0000000', createdAt: now }
];

export const quoteRecords: QuoteRecord[] = [];
export const quoteLines: QuoteLineRecord[] = [];
export const quoteLinePriceSnapshots: QuoteLinePriceSnapshot[] = [];
export const quoteStatusHistory: QuoteStatusHistoryRecord[] = [];


export const getActiveOverheadSet = (): OverheadSet => overheadSets[0];
export const getOverheadForProduct = (product: ProductSpec): OverheadSet =>
  overheadSets.find((set) => set.id === product.overheadSetOverrideId) ?? getActiveOverheadSet();

export const marginRules: MarginRule[] = [
  { category: 'Foil', tier: 1, marginPct: 20 },
  { category: 'Foil', tier: 2, marginPct: 23 },
  { category: 'Foil', tier: 3, marginPct: 26 },
  { category: 'Foil', tier: 4, marginPct: 30 },
  { category: 'Foil', tier: 5, marginPct: 35 },
  { category: 'Stretch', tier: 1, marginPct: 19 },
  { category: 'Stretch', tier: 2, marginPct: 22 },
  { category: 'Stretch', tier: 3, marginPct: 25 },
  { category: 'Stretch', tier: 4, marginPct: 28 },
  { category: 'Stretch', tier: 5, marginPct: 32 },
  { category: 'Trade', tier: 1, marginPct: 14 },
  { category: 'Trade', tier: 2, marginPct: 18 },
  { category: 'Trade', tier: 3, marginPct: 20 },
  { category: 'Trade', tier: 4, marginPct: 24 },
  { category: 'Trade', tier: 5, marginPct: 28 }
];


export const importBatches: ImportBatch[] = [];
export const importRows: ImportRowRecord[] = [];
export const rowMatchCandidates: RowMatchCandidate[] = [];
export const proposedPriceChanges: ProposedPriceChange[] = [];
export const proposedExpenseUpdates: ProposedExpenseUpdate[] = [];
export const importMappingTemplates: ImportMappingTemplate[] = [
  {
    id: 'imt-1',
    templateName: 'ERP Standard CSV',
    sourceFormat: 'ERP_CSV_V1',
    mapping: {
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
    },
    createdAt: now,
    updatedAt: now
  }
];


export const costSnapshots: CostSnapshotRecord[] = [];


export const marginProfiles: MarginProfile[] = [
  { id: 'mp-1', name: 'Default Live', active: true, state: 'live', createdAt: now, updatedAt: now },
  { id: 'mp-2', name: 'Q2 Draft', active: false, state: 'draft', createdAt: now, updatedAt: now }
];

export const marginProfileLines: MarginProfileLine[] = [
  { id: 'mpl-1', profileId: 'mp-1', category: 'Foil', subcategoryId: 'foil-household', tier1Margin: 45, tier2Margin: 35, tier3Margin: 25, tier4Margin: 15, updatedAt: now },
  { id: 'mpl-2', profileId: 'mp-1', category: 'Stretch', subcategoryId: 'stretch-consumer', tier1Margin: 45, tier2Margin: 35, tier3Margin: 25, tier4Margin: 15, updatedAt: now },
  { id: 'mpl-3', profileId: 'mp-1', category: 'Trade', subcategoryId: 'trade-trays', tier1Margin: 45, tier2Margin: 35, tier3Margin: 25, tier4Margin: 15, updatedAt: now }
];

export const priceSnapshots: PriceSnapshot[] = [];
export const draftPriceLists: DraftPriceList[] = [
  { id: 'dpl-1', name: 'Draft List - Q2', profileId: 'mp-2', createdAt: now }
];
