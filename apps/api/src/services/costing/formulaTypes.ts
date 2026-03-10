import { CostBreakdown, OverheadSet, ProductSpec } from '../../types/domain.js';

export interface FormulaContext {
  product: ProductSpec;
  materialCost: number;
  packagingCost: number;
  directPurchaseCost: number;
  overheadSet: OverheadSet;
  activeRawMaterialPricePerKg: number;
}

export interface FormulaService {
  type: 1 | 2 | 3 | 4 | 5 | 6;
  formulaVersion: string;
  validate(product: ProductSpec): string[];
  calculate(context: FormulaContext): Omit<CostBreakdown, 'sku' | 'calculationTimestamp' | 'warnings' | 'inputSnapshot'>;
}

const overheadPerHourFromSet = (set: OverheadSet): number => {
  const availableHours = set.machineCount * set.workingDays * set.hoursPerDay * Math.max(set.utilizationPct, 0) / 100;
  if (availableHours <= 0) return 0;
  return (set.labourAnnual + set.factoryAnnual + set.operatingAnnual) / availableHours;
};

const num = (value: unknown): number => Number(value ?? 0);

abstract class BaseFormula implements FormulaService {
  abstract type: 1 | 2 | 3 | 4 | 5 | 6;
  formulaVersion = 'v2.0';

  validate(product: ProductSpec): string[] {
    const errors: string[] = [];
    if (product.wasteValue < 0) errors.push('Waste value cannot be negative.');
    if (!['percentage', 'fixed'].includes(product.wasteMode)) errors.push('Waste mode must be percentage or fixed.');
    return errors;
  }

  protected baseWaste(product: ProductSpec, baseCost: number): number {
    return product.wasteMode === 'percentage' ? (baseCost * product.wasteValue) / 100 : product.wasteValue;
  }

  protected overheadPerPiece(product: ProductSpec, overheadSet: OverheadSet, fallbackRate = 1): number {
    const hourlyFactoryCost = num(product.params.hourly_factory_cost) || overheadPerHourFromSet(overheadSet);
    const piecesPerHour = num(product.params.pieces_per_hour) || product.productionRatePerHour || fallbackRate;
    if (piecesPerHour <= 0) return 0;
    return hourlyFactoryCost / piecesPerHour;
  }

  abstract calculate(context: FormulaContext): Omit<CostBreakdown, 'sku' | 'calculationTimestamp' | 'warnings' | 'inputSnapshot'>;
}

export class Type1FoilFormulaService extends BaseFormula {
  type: 1 = 1;
  formulaVersion = 'type1-v1.0';

  validate(product: ProductSpec): string[] {
    const errors = super.validate(product);
    const required = [
      'length_m', 'width_cm', 'thickness_mic', 'density_or_gsm', 'mandrel_cost', 'box_label_cost',
      'carton_cost', 'pieces_per_carton', 'pieces_per_hour'
    ];
    required.forEach((field) => {
      if (product.params[field] === undefined || product.params[field] === null || Number(product.params[field]) <= 0) {
        errors.push(`Missing required Type 1 field: ${field}`);
      }
    });
    return errors;
  }

  calculate(context: FormulaContext): Omit<CostBreakdown, 'sku' | 'calculationTimestamp' | 'warnings' | 'inputSnapshot'> {
    const p = context.product.params;
    const lengthM = num(p.length_m);
    const widthM = num(p.width_cm) / 100;
    const thicknessM = num(p.thickness_mic) * 1e-6;
    const densityOrGsm = num(p.density_or_gsm);

    const netWeightKg = num(p.net_weight_kg) > 0
      ? num(p.net_weight_kg)
      : densityOrGsm > 50
        ? (lengthM * widthM * densityOrGsm) / 1000
        : lengthM * widthM * thicknessM * densityOrGsm;

    const rawMaterialCost = netWeightKg * context.activeRawMaterialPricePerKg;
    const packagingCostMandrel = num(p.mandrel_cost);
    const packagingCostBoxLabel = num(p.box_label_cost);
    const packagingCostCarton = num(p.pieces_per_carton) > 0 ? num(p.carton_cost) / num(p.pieces_per_carton) : 0;
    const packagingCostTotal = packagingCostMandrel + packagingCostBoxLabel + packagingCostCarton;

    const overheadPerPiece = this.overheadPerPiece(context.product, context.overheadSet, 1);
    const totalCost = rawMaterialCost + packagingCostTotal + overheadPerPiece;
    const wasteCost = this.baseWaste(context.product, totalCost);
    const totalCostWithWaste = totalCost + wasteCost;

    return {
      materialCost: rawMaterialCost,
      packagingCost: packagingCostTotal,
      overheadCost: overheadPerPiece,
      wasteCost,
      directPurchaseCost: 0,
      totalCost: totalCostWithWaste,
      formulaVersion: this.formulaVersion,
      raw_material_cost: rawMaterialCost,
      packaging_cost_mandrel: packagingCostMandrel,
      packaging_cost_box_label: packagingCostBoxLabel,
      packaging_cost_carton: packagingCostCarton,
      packaging_cost_total: packagingCostTotal,
      overhead_per_piece: overheadPerPiece,
      total_cost: totalCost,
      total_cost_with_waste: totalCostWithWaste
    };
  }
}

abstract class WorkbookPendingFormulaBase extends BaseFormula {
  protected pendingResult(context: FormulaContext, typeName: string): Omit<CostBreakdown, 'sku' | 'calculationTimestamp' | 'warnings' | 'inputSnapshot'> {
    // WORKBOOK INSERTION POINT: replace baseline with workbook-approved equations for this product type.
    const base = context.materialCost + context.packagingCost + context.directPurchaseCost;
    const overhead = this.overheadPerPiece(context.product, context.overheadSet, 1);
    const waste = this.baseWaste(context.product, base + overhead);
    const total = base + overhead + waste;
    return {
      materialCost: context.materialCost,
      packagingCost: context.packagingCost,
      overheadCost: overhead,
      wasteCost: waste,
      directPurchaseCost: context.directPurchaseCost,
      totalCost: total,
      formulaVersion: `${typeName}-pending-workbook`
    };
  }
}

export class Type2StretchFormulaService extends WorkbookPendingFormulaBase { type: 2 = 2; calculate(context: FormulaContext) { return this.pendingResult(context, 'type2'); } }
export class Type3BakingPaperFormulaService extends WorkbookPendingFormulaBase { type: 3 = 3; calculate(context: FormulaContext) { return this.pendingResult(context, 'type3'); } }
export class Type4NapkinFormulaService extends WorkbookPendingFormulaBase { type: 4 = 4; calculate(context: FormulaContext) { return this.pendingResult(context, 'type4'); } }
export class Type5TissueFormulaService extends WorkbookPendingFormulaBase { type: 5 = 5; calculate(context: FormulaContext) { return this.pendingResult(context, 'type5'); } }
export class Type6TradeGoodsFormulaService extends WorkbookPendingFormulaBase { type: 6 = 6; calculate(context: FormulaContext) { return this.pendingResult(context, 'type6'); } }

export const formulaRegistry: Record<number, FormulaService> = {
  1: new Type1FoilFormulaService(),
  2: new Type2StretchFormulaService(),
  3: new Type3BakingPaperFormulaService(),
  4: new Type4NapkinFormulaService(),
  5: new Type5TissueFormulaService(),
  6: new Type6TradeGoodsFormulaService()
};
