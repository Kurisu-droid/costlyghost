export const suppliers = [
    { id: 'sup-1', name: 'Αλουμίνιο ΑΕ', country: 'GR', currency: 'EUR', active: true },
    { id: 'sup-2', name: 'PackTrade SRL', country: 'RO', currency: 'EUR', active: true }
];
export const prices = [
    { id: 'p1', itemType: 'material', itemId: 'ALU-FOIL-11', supplierId: 'sup-1', unit: 'kg', currency: 'EUR', unitPrice: 3.4, validFrom: '2026-01-01', active: true },
    { id: 'p2', itemType: 'material', itemId: 'PE-STRETCH', supplierId: 'sup-2', unit: 'kg', currency: 'EUR', unitPrice: 2.1, validFrom: '2026-01-01', active: true },
    { id: 'p3', itemType: 'component', itemId: 'BOX-TRAY-A', supplierId: 'sup-2', unit: 'pcs', currency: 'EUR', unitPrice: 0.18, validFrom: '2026-01-01', active: true }
];
export const products = [
    { sku: 'SKU-FOIL-001', name: 'Foil 30m', category: 'Foil', type: 1, wastePct: 2, materialItemIds: ['ALU-FOIL-11'], componentItemIds: ['BOX-TRAY-A'], productionRatePerHour: 450, params: { widthMm: 290, lengthM: 30 } },
    { sku: 'SKU-STRETCH-001', name: 'Stretch 300m', category: 'Stretch', type: 2, wastePct: 3, materialItemIds: ['PE-STRETCH'], componentItemIds: ['BOX-TRAY-A'], productionRatePerHour: 380, params: { micron: 10 } },
    { sku: 'SKU-TRAY-001', name: 'Trade Tray', category: 'Trade', type: 6, wastePct: 0, materialItemIds: ['BOX-TRAY-A'], componentItemIds: [], params: {} }
];
export const overhead = {
    id: 'ov-2026-01',
    effectiveDate: '2026-01-01',
    labourAnnual: 450000,
    factoryAnnual: 270000,
    operatingAnnual: 185000,
    machineCount: 6,
    workingDays: 250,
    hoursPerDay: 16,
    utilizationPct: 78
};
export const marginRules = [
    { category: 'Foil', tier: 1, marginPct: 20 },
    { category: 'Foil', tier: 2, marginPct: 23 },
    { category: 'Foil', tier: 3, marginPct: 26 },
    { category: 'Foil', tier: 4, marginPct: 30 },
    { category: 'Foil', tier: 5, marginPct: 35 },
    { category: 'Stretch', tier: 1, marginPct: 19 },
    { category: 'Stretch', tier: 2, marginPct: 22 },
    { category: 'Stretch', tier: 3, marginPct: 25 },
    { category: 'Stretch', tier: 4, marginPct: 28 },
    { category: 'Stretch', tier: 5, marginPct: 32 }
];
