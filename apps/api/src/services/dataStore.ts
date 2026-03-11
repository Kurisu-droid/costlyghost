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

const now = new Date().toISOString();

export const suppliers: Supplier[] = [
  { id: 'sup-1', name: 'ΕΛΒΑΛ Αλουμίνιο ΑΕ', country: 'GR', currency: 'EUR', active: true },
  { id: 'sup-2', name: 'Θράκη Πλαστικά ΑΒΕΕ', country: 'GR', currency: 'EUR', active: true },
  { id: 'sup-3', name: 'Macedon Carton SA', country: 'GR', currency: 'EUR', active: true },
  { id: 'sup-4', name: 'PackTrade SRL', country: 'RO', currency: 'EUR', active: true },
  { id: 'sup-5', name: 'Aegean Core Tubes', country: 'GR', currency: 'EUR', active: true }
];

export const prices: PriceItem[] = [
  { id: 'p1', itemType: 'material', itemId: 'ALU-FOIL-11', supplierId: 'sup-1', unit: 'kg', currency: 'EUR', unitPrice: 3.42, validFrom: '2026-01-01', active: true },
  { id: 'p2', itemType: 'material', itemId: 'ALU-FOIL-13', supplierId: 'sup-1', unit: 'kg', currency: 'EUR', unitPrice: 3.68, validFrom: '2026-01-01', active: true },
  { id: 'p3', itemType: 'material', itemId: 'PVC-CLING-8', supplierId: 'sup-2', unit: 'kg', currency: 'EUR', unitPrice: 2.95, validFrom: '2026-01-01', active: true },
  { id: 'p4', itemType: 'material', itemId: 'PVC-CLING-10', supplierId: 'sup-2', unit: 'kg', currency: 'EUR', unitPrice: 3.12, validFrom: '2026-01-01', active: true },
  { id: 'p5', itemType: 'material', itemId: 'PE-STRETCH-CLEAR', supplierId: 'sup-4', unit: 'kg', currency: 'EUR', unitPrice: 2.18, validFrom: '2026-01-01', active: true },
  { id: 'p6', itemType: 'material', itemId: 'PE-STRETCH-BLACK', supplierId: 'sup-4', unit: 'kg', currency: 'EUR', unitPrice: 2.34, validFrom: '2026-01-01', active: true },
  { id: 'p7', itemType: 'material', itemId: 'PARCHMENT-BAKING', supplierId: 'sup-2', unit: 'kg', currency: 'EUR', unitPrice: 2.66, validFrom: '2026-01-01', active: true },
  { id: 'p8', itemType: 'component', itemId: 'CORE-30CM', supplierId: 'sup-5', unit: 'pcs', currency: 'EUR', unitPrice: 0.024, validFrom: '2026-01-01', active: true },
  { id: 'p9', itemType: 'component', itemId: 'CORE-45CM', supplierId: 'sup-5', unit: 'pcs', currency: 'EUR', unitPrice: 0.031, validFrom: '2026-01-01', active: true },
  { id: 'p10', itemType: 'component', itemId: 'BOX-FOIL-30M', supplierId: 'sup-3', unit: 'pcs', currency: 'EUR', unitPrice: 0.183, validFrom: '2026-01-01', active: true },
  { id: 'p11', itemType: 'component', itemId: 'BOX-FOIL-50M', supplierId: 'sup-3', unit: 'pcs', currency: 'EUR', unitPrice: 0.229, validFrom: '2026-01-01', active: true },
  { id: 'p12', itemType: 'component', itemId: 'BOX-CLING-30M', supplierId: 'sup-3', unit: 'pcs', currency: 'EUR', unitPrice: 0.171, validFrom: '2026-01-01', active: true },
  { id: 'p13', itemType: 'component', itemId: 'BOX-STRETCH-300M', supplierId: 'sup-3', unit: 'pcs', currency: 'EUR', unitPrice: 0.262, validFrom: '2026-01-01', active: true }
];

export const products: ProductSpec[] = [
  {
    id: 'prod-1', sku: 'SKU-FOIL-001', name: 'Αλουμινόχαρτο 30m x 29cm', subcategoryId: 'foil-household', category: 'Foil', type: 1,
    status: 'active', wasteMode: 'percentage', wasteValue: 2, overheadSetOverrideId: null, notes: 'Best seller λιανικής',
    materialItemIds: ['ALU-FOIL-11'], componentItemIds: ['CORE-30CM', 'BOX-FOIL-30M'], productionRatePerHour: 460,
    params: { description: 'Foil 30m', length_m: 30, width_cm: 29, thickness_mic: 11, density_or_gsm: 2.7, net_weight_kg: 0.26, mandrel_cost: 0.024, box_label_cost: 0.042, carton_cost: 0.58, pieces_per_carton: 24, pieces_per_hour: 460, hourly_factory_cost: 6.7 }
  },
  {
    id: 'prod-2', sku: 'SKU-FOIL-002', name: 'Αλουμινόχαρτο 50m x 29cm', subcategoryId: 'foil-household', category: 'Foil', type: 1,
    status: 'active', wasteMode: 'percentage', wasteValue: 2.2, overheadSetOverrideId: null, notes: 'Μοντέλο οικογενειακής κατανάλωσης',
    materialItemIds: ['ALU-FOIL-13'], componentItemIds: ['CORE-30CM', 'BOX-FOIL-50M'], productionRatePerHour: 420,
    params: { description: 'Foil 50m', length_m: 50, width_cm: 29, thickness_mic: 13, density_or_gsm: 2.7, net_weight_kg: 0.41, mandrel_cost: 0.024, box_label_cost: 0.05, carton_cost: 0.61, pieces_per_carton: 18, pieces_per_hour: 420, hourly_factory_cost: 6.7 }
  },
  {
    id: 'prod-3', sku: 'SKU-CLING-001', name: 'Μεμβράνη Τροφίμων PVC 30m', subcategoryId: 'cling-pvc-household', category: 'Stretch', type: 2,
    status: 'active', wasteMode: 'percentage', wasteValue: 3.2, overheadSetOverrideId: null, notes: 'Οικιακή cling',
    materialItemIds: ['PVC-CLING-8'], componentItemIds: ['CORE-30CM', 'BOX-CLING-30M'], productionRatePerHour: 400,
    params: { micron: 8, width_cm: 29, length_m: 30 }
  },
  {
    id: 'prod-4', sku: 'SKU-CLING-002', name: 'Μεμβράνη Τροφίμων PVC 60m', subcategoryId: 'cling-pvc-household', category: 'Stretch', type: 2,
    status: 'active', wasteMode: 'percentage', wasteValue: 3.5, overheadSetOverrideId: null, notes: 'Μεγάλη συσκευασία',
    materialItemIds: ['PVC-CLING-10'], componentItemIds: ['CORE-30CM', 'BOX-CLING-30M'], productionRatePerHour: 355,
    params: { micron: 10, width_cm: 29, length_m: 60 }
  },
  {
    id: 'prod-5', sku: 'SKU-STRETCH-001', name: 'Stretch Film Χειρός 300m Διαφανές', subcategoryId: 'stretch-consumer', category: 'Stretch', type: 2,
    status: 'active', wasteMode: 'percentage', wasteValue: 3, overheadSetOverrideId: null, notes: 'Κύρια σειρά stretch',
    materialItemIds: ['PE-STRETCH-CLEAR'], componentItemIds: ['CORE-45CM', 'BOX-STRETCH-300M'], productionRatePerHour: 360,
    params: { micron: 10, width_cm: 45, length_m: 300 }
  },
  {
    id: 'prod-6', sku: 'SKU-STRETCH-002', name: 'Stretch Film Χειρός 300m Μαύρο', subcategoryId: 'stretch-consumer', category: 'Stretch', type: 2,
    status: 'active', wasteMode: 'percentage', wasteValue: 3.1, overheadSetOverrideId: null, notes: 'Βιομηχανικές αποστολές',
    materialItemIds: ['PE-STRETCH-BLACK'], componentItemIds: ['CORE-45CM', 'BOX-STRETCH-300M'], productionRatePerHour: 355,
    params: { micron: 10, width_cm: 45, length_m: 300 }
  },
  {
    id: 'prod-7', sku: 'SKU-BAKING-001', name: 'Λαδόκολλα 20m', subcategoryId: 'baking-paper', category: 'Trade', type: 6,
    status: 'active', wasteMode: 'fixed', wasteValue: 0.5, overheadSetOverrideId: 'ov-trade', notes: 'Εισαγόμενο τελικό προϊόν',
    materialItemIds: ['PARCHMENT-BAKING'], componentItemIds: ['BOX-FOIL-30M'], params: {}
  },
  {
    id: 'prod-8', sku: 'SKU-FOIL-IND-001', name: 'Αλουμινόχαρτο Επαγγελματικό 150m', subcategoryId: 'foil-professional', category: 'Foil', type: 1,
    status: 'active', wasteMode: 'percentage', wasteValue: 1.8, overheadSetOverrideId: null, notes: 'HORECA',
    materialItemIds: ['ALU-FOIL-13'], componentItemIds: ['CORE-45CM', 'BOX-FOIL-50M'], productionRatePerHour: 230,
    params: { description: 'Foil 150m', length_m: 150, width_cm: 45, thickness_mic: 13, density_or_gsm: 2.7, net_weight_kg: 1.15, mandrel_cost: 0.031, box_label_cost: 0.08, carton_cost: 0.82, pieces_per_carton: 6, pieces_per_hour: 230, hourly_factory_cost: 6.7 }
  }
];

export const overheadSets: OverheadSet[] = [
  { id: 'ov-2026-01', effectiveDate: '2026-01-01', labourAnnual: 485000, factoryAnnual: 298000, operatingAnnual: 212000, machineCount: 6, workingDays: 250, hoursPerDay: 16, utilizationPct: 80 },
  { id: 'ov-trade', effectiveDate: '2026-01-01', labourAnnual: 132000, factoryAnnual: 74000, operatingAnnual: 52000, machineCount: 2, workingDays: 250, hoursPerDay: 8, utilizationPct: 72 }
];

const def = (id: string, code: string, sectionEnum: ExpenseDefinition['sectionEnum'], category: string, nameEl: string, nameEn: string, importableFromInvoice = true): ExpenseDefinition => ({
  id, code, sectionEnum, category, nameEl, nameEn, unit: 'EUR', importableFromInvoice, allocationMethod: 'HOURLY_FACTORY', active: true, createdAt: now, updatedAt: now
});

export const expenseDefinitions: ExpenseDefinition[] = [
  def('ed-1', 'RAW_ALUMINIO', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Αλουμίνιο', 'Aluminium'),
  def('ed-2', 'RAW_PVC_HOME', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Μεμβράνη Οικιακή PVC', 'Household PVC Film'),
  def('ed-3', 'RAW_PE_HOME', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Μεμβράνη Οικιακή PE', 'Household PE Film'),
  def('ed-4', 'RAW_PRO_FILM', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Μεμβράνη Επαγγελματική', 'Professional Film'),
  def('ed-5', 'RAW_FOIL_PAINT', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Βαφή αλουμινοχάρτου', 'Foil Paint'),
  def('ed-6', 'RAW_BAKING', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Λαδόκολλα', 'Baking Paper'),
  def('ed-7', 'RAW_SILIDOR', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Αντικολλητικό / Silidor', 'Silidor'),
  def('ed-8', 'RAW_NONSTICK_SHEETS', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Αντικολλητικά φύλλα', 'Non-stick Sheets'),
  def('ed-9', 'RAW_WHITE_TISSUE', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Χαρτί χ/π λευκό', 'White Tissue Paper'),
  def('ed-10', 'RAW_PLASTIC_TISSUE', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Πλαστικό χ/π', 'Tissue Plastic'),
  def('ed-11', 'RAW_STRETCH_CLEAR', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Stretch Film διαφανό', 'Stretch Film Clear'),
  def('ed-12', 'RAW_STRETCH_BLACK', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Stretch Film μαύρο', 'Stretch Film Black'),
  def('ed-13', 'RAW_STRETCH_BOX', 'RAW_MATERIAL_PRICES', "ΤΙΜΕΣ Α' ΥΛΩΝ", 'Κιβώτιο Stretch Film', 'Stretch Film Box'),
  def('ed-39', 'PARAM_SCRAP_RATE', 'PRODUCTION_PARAMETERS', 'Β. ΠΑΡΑΜΕΤΡΟΙ ΠΑΡΑΓΩΓΗΣ', 'Ποσοστό φύρας', 'Scrap Rate', false),
  def('ed-40', 'PARAM_LINE_UTILIZATION', 'PRODUCTION_PARAMETERS', 'Β. ΠΑΡΑΜΕΤΡΟΙ ΠΑΡΑΓΩΓΗΣ', 'Αξιοποίηση γραμμών', 'Line Utilization', false),
  def('ed-14', 'LABOUR_PROD', 'PRODUCTION_LABOUR', 'Γ. ΕΡΓΑΤΙΚΑ ΠΑΡΑΓΩΓΗΣ', 'Εργατικά παραγωγής', 'Production Labour', false),
  def('ed-15', 'OFFICE_ADMIN', 'OFFICE_ADMIN', 'Δ. ΓΡΑΦΕΙΟ / ΔΙΟΙΚΗΣΗ', 'Γραφείο / Διοίκηση', 'Office / Administration', false),
  def('ed-16', 'OVR_GLUE', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Κόλα', 'Glue'),
  def('ed-17', 'OVR_SPARE_PARTS', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Ανταλλακτικά μηχανών', 'Machine Spare Parts'),
  def('ed-18', 'OVR_POWER', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Ηλεκτρικό ρεύμα παραγωγής', 'Factory Power'),
  def('ed-19', 'OVR_GAS', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Φυσικό αέριο', 'Natural Gas'),
  def('ed-20', 'OVR_REPAIRS', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Συντηρήσεις / Επισκευές', 'Maintenance & Repairs'),
  def('ed-21', 'OVR_QUALITY', 'FACTORY_GENERAL_OVERHEAD', 'Ε. ΓΕΝΙΚΑ ΕΞΟΔΑ ΠΑΡΑΓΩΓΗΣ', 'Ποιοτικός έλεγχος', 'Quality Control'),
  def('ed-22', 'OP_SALES', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Έξοδα πωλήσεων', 'Sales Expenses', false),
  def('ed-23', 'OP_WAREHOUSE', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Αποθήκη', 'Warehouse'),
  def('ed-24', 'OP_BANKING', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Τραπεζικά έξοδα', 'Banking Fees'),
  def('ed-25', 'OP_RENT', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Ενοίκια', 'Rent'),
  def('ed-26', 'OP_INSURANCE', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Ασφάλειες', 'Insurance'),
  def('ed-27', 'OP_PAYROLL_NON_PROD', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Μισθοδοσία μη παραγωγής', 'Non-Production Payroll', false),
  def('ed-28', 'OP_ACCOUNTING', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Λογιστήριο / Σύμβουλοι', 'Accounting / Consultants', false),
  def('ed-29', 'OP_COMMISSION', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Προμήθειες πωλήσεων', 'Sales Commissions', false),
  def('ed-30', 'OP_EXHIBITIONS', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Εκθέσεις', 'Exhibitions'),
  def('ed-31', 'OP_MARKETING', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Marketing', 'Marketing'),
  def('ed-32', 'OP_FUEL', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Καύσιμα διανομής', 'Distribution Fuel'),
  def('ed-33', 'OP_VAN', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Van μεταφορών', 'Delivery Vans'),
  def('ed-34', 'OP_COURIER', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Courier', 'Couriers'),
  def('ed-35', 'OP_LOGISTICS', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Logistics / 3PL', 'Logistics / 3PL'),
  def('ed-36', 'OP_OFFICE_UTIL', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Κοινόχρηστα γραφείου', 'Office Utilities'),
  def('ed-37', 'OP_TEL_NET', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Τηλέφωνο / Internet', 'Phone / Internet'),
  def('ed-38', 'OP_SOFTWARE', 'OPERATING_EXPENSES', 'ΣΤ. ΛΕΙΤΟΥΡΓΙΚΑ ΕΞΟΔΑ', 'Software / Συνδρομές', 'Software / Subscriptions')
];

export const expenseValueVersions: ExpenseValueVersion[] = expenseDefinitions.map((definition, index) => ({
  id: `ev-${index + 1}`,
  expenseDefinitionId: definition.id,
  periodYear: 2026,
  periodMonth: null,
  amount: (
    definition.sectionEnum === 'RAW_MATERIAL_PRICES' ? 42000 :
    definition.sectionEnum === 'PRODUCTION_PARAMETERS' ? 12000 :
    definition.sectionEnum === 'PRODUCTION_LABOUR' ? 485000 :
    definition.sectionEnum === 'OFFICE_ADMIN' ? 86000 :
    definition.sectionEnum === 'FACTORY_GENERAL_OVERHEAD' ? 64000 : 37000
  ) + index * 850,
  currency: 'EUR',
  sourceType: definition.importableFromInvoice ? 'INVOICE_IMPORT' : 'MANUAL',
  isActive: true,
  createdAt: now,
  notes: `Demo dataset 2026 - ${definition.nameEl}`
}));

export const productionParameterVersions: ProductionParameterVersion[] = [
  {
    id: 'pp-1', wastePercent: 2.7, activeMachines: 5, workingDaysPerYear: 250, hoursPerDay: 16,
    utilizationPercent: 0.78, totalMachines: 6, effectiveFrom: '2026-01-01', approvedAt: now, createdAt: now
  }
];

export const expenseImportMatches: ExpenseImportMatch[] = [
  {
    id: 'eim-1',
    sourceBatchId: 'imp-2026-001',
    sourceRowNumber: 2,
    supplierName: 'ΕΛΒΑΛ Αλουμίνιο ΑΕ',
    description: 'ALU-FOIL-11',
    matchedExpenseDefinitionId: 'ed-1',
    confidence: 0.96,
    status: 'approved',
    createdAt: now
  }
];
export const expenseAllocationRules: ExpenseAllocationRule[] = [
  { id: 'ear-1', expenseDefinitionId: 'ed-14', allocationMethod: 'HOURLY_FACTORY', productCategory: 'Foil', ratio: 0.45, active: true, createdAt: now },
  { id: 'ear-2', expenseDefinitionId: 'ed-14', allocationMethod: 'HOURLY_FACTORY', productCategory: 'Stretch', ratio: 0.4, active: true, createdAt: now },
  { id: 'ear-3', expenseDefinitionId: 'ed-14', allocationMethod: 'HOURLY_FACTORY', productCategory: 'Trade', ratio: 0.15, active: true, createdAt: now }
];
export const hourlyCostSnapshots: HourlyCostSnapshot[] = [];
export const finalizedExpenseYears: Set<number> = new Set();

export const quotes: QuoteDocument[] = [
  {
    id: 'quote-doc-1',
    customerName: 'Σκλαβενίτης ΑΕ',
    createdAt: now,
    marginTier: 2,
    lines: [
      { sku: 'SKU-FOIL-001', description: 'Αλουμινόχαρτο 30m x 29cm', quantity: 240, unitCost: 1.12, tierPrice: 1.72, lineTotal: 412.8 }
    ],
    subtotal: 412.8,
    currency: 'EUR'
  }
];

export const customers: Customer[] = [
  { id: 'cust-1', name: 'Σκλαβενίτης ΑΕ', vatNumber: 'EL094010203', email: 'procurement@sklavenitis.gr', phone: '+30-210-1234567', createdAt: now },
  { id: 'cust-2', name: 'Μασούτης ΑΕ', vatNumber: 'EL099887766', email: 'buyers@masoutis.gr', phone: '+30-2310-445566', createdAt: now }
];

export const quoteRecords: QuoteRecord[] = [
  {
    id: 'Q-00001',
    customerId: 'cust-1',
    quoteNumber: 'Q-00001',
    currency: 'EUR',
    status: 'FINALIZED',
    subtotal: 864,
    discountTotal: 43.2,
    netTotal: 820.8,
    paymentTerms: '60 ημέρες',
    validityDate: '2026-12-31',
    notes: 'Παράδοση σε κεντρική αποθήκη Ρέντη',
    createdAt: now,
    updatedAt: now
  }
];

export const quoteLines: QuoteLineRecord[] = [
  {
    id: 'ql-1',
    quoteId: 'Q-00001',
    productId: 'prod-1',
    sku: 'SKU-FOIL-001',
    description: 'Αλουμινόχαρτο 30m x 29cm',
    subcategory: 'foil-household',
    quantity: 480,
    selectedTier: 2,
    selectedUnitPrice: 1.8,
    costReference: 1.22,
    lineSubtotal: 864,
    discountPercent: 5,
    discountAmount: 43.2,
    netLineTotal: 820.8,
    createdAt: now
  }
];

export const quoteLinePriceSnapshots: QuoteLinePriceSnapshot[] = [
  {
    id: 'qlps-1',
    quoteLineId: 'ql-1',
    tier1Price: 2.04,
    tier2Price: 1.8,
    tier3Price: 1.63,
    tier4Price: 1.44,
    costReference: 1.22,
    capturedAt: now
  }
];

export const quoteStatusHistory: QuoteStatusHistoryRecord[] = [
  { id: 'qsh-1', quoteId: 'Q-00001', fromStatus: null, toStatus: 'DRAFT', changedAt: now, changedBy: 'demo-seed' },
  { id: 'qsh-2', quoteId: 'Q-00001', fromStatus: 'DRAFT', toStatus: 'FINALIZED', changedAt: now, changedBy: 'demo-seed' }
];

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

export const importBatches: ImportBatch[] = [
  {
    id: 'imp-2026-001',
    fileName: 'invoice_2026_01_elval.csv',
    sourceFormat: 'ERP_STANDARD_GR',
    status: 'review',
    uploadedAt: now
  }
];

export const importRows: ImportRowRecord[] = [
  {
    id: 'ir-1',
    batchId: 'imp-2026-001',
    sourceRowNumber: 2,
    rawPayload: { Supplier: 'ΕΛΒΑΛ Αλουμίνιο ΑΕ', Date: '2026-01-10', Desc: 'Αλουμίνιο 11mic', Code: 'ALU-FOIL-11', Qty: 12000, Unit: 'kg', Price: 3.42, Total: 41040, Currency: 'EUR', ExpCode: 'RAW_ALUMINIO' },
    normalizedDescription: 'αλουμινιο 11mic',
    ignored: false
  },
  {
    id: 'ir-2',
    batchId: 'imp-2026-001',
    sourceRowNumber: 3,
    rawPayload: { Supplier: 'ΔΕΗ', Date: '2026-01-15', Desc: 'Ρεύμα εργοστασίου', Code: 'PWR-01', Qty: 1, Unit: 'invoice', Price: 18650, Total: 18650, Currency: 'EUR', ExpCode: 'OVR_POWER' },
    normalizedDescription: 'ρευμα εργοστασιου',
    ignored: false
  }
];

export const rowMatchCandidates: RowMatchCandidate[] = [
  { id: 'rmc-1', batchId: 'imp-2026-001', rowId: 'ir-1', candidateType: 'material', candidateRefId: 'ALU-FOIL-11', confidence: 0.98, status: 'exact', unitMismatch: false, supplierAwareRank: 1 },
  { id: 'rmc-2', batchId: 'imp-2026-001', rowId: 'ir-2', candidateType: 'expense', candidateRefId: 'ed-18', confidence: 0.94, status: 'possible', unitMismatch: false, supplierAwareRank: 1 }
];

export const proposedPriceChanges: ProposedPriceChange[] = [
  { rowNumber: 2, itemId: 'ALU-FOIL-11', status: 'exact', oldPrice: 3.38, importedPrice: 3.42, deltaAbs: 0.04, deltaPct: 1.18, unitMismatch: false, ignored: false }
];

export const proposedExpenseUpdates: ProposedExpenseUpdate[] = [
  { id: 'peu-1', batchId: 'imp-2026-001', rowId: 'ir-2', expenseDefinitionId: 'ed-18', periodYear: 2026, periodMonth: 1, amount: 18650, currency: 'EUR', status: 'pending' }
];

export const importMappingTemplates: ImportMappingTemplate[] = [
  {
    id: 'imt-1',
    templateName: 'ERP Standard CSV (Ελλάδα)',
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
  { id: 'mp-1', name: 'Εμπορική Πολιτική 2026', active: true, state: 'live', createdAt: now, updatedAt: now }
];

export const marginProfileLines: MarginProfileLine[] = [
  { id: 'mpl-1', profileId: 'mp-1', category: 'Foil', subcategoryId: 'foil-household', tier1Margin: 45, tier2Margin: 35, tier3Margin: 25, tier4Margin: 15, updatedAt: now },
  { id: 'mpl-2', profileId: 'mp-1', category: 'Foil', subcategoryId: 'foil-professional', tier1Margin: 42, tier2Margin: 33, tier3Margin: 24, tier4Margin: 14, updatedAt: now },
  { id: 'mpl-3', profileId: 'mp-1', category: 'Stretch', subcategoryId: 'stretch-consumer', tier1Margin: 43, tier2Margin: 34, tier3Margin: 25, tier4Margin: 16, updatedAt: now },
  { id: 'mpl-4', profileId: 'mp-1', category: 'Stretch', subcategoryId: 'cling-pvc-household', tier1Margin: 47, tier2Margin: 37, tier3Margin: 27, tier4Margin: 18, updatedAt: now },
  { id: 'mpl-5', profileId: 'mp-1', category: 'Trade', subcategoryId: 'baking-paper', tier1Margin: 40, tier2Margin: 31, tier3Margin: 22, tier4Margin: 14, updatedAt: now }
];

export const priceSnapshots: PriceSnapshot[] = [];
export const draftPriceLists: DraftPriceList[] = [];
