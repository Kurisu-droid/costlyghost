const overheadPerHour = (set) => {
    const availableHours = set.machineCount * set.workingDays * set.hoursPerDay * Math.max(set.utilizationPct, 0) / 100;
    if (availableHours <= 0) {
        return 0;
    }
    return (set.labourAnnual + set.factoryAnnual + set.operatingAnnual) / availableHours;
};
class BaseFormula {
    formulaVersion = 'v1.0';
    validate(product) {
        const errors = [];
        if (product.wastePct < 0)
            errors.push('Waste percentage cannot be negative.');
        return errors;
    }
    finalize(context, processingFactor) {
        const base = context.materialCost + context.packagingCost + context.directPurchaseCost;
        const wasteCost = base * context.product.wastePct / 100;
        const overheadHourly = overheadPerHour(context.overheadSet);
        const rate = context.product.productionRatePerHour ?? 0;
        const overheadCost = rate > 0 ? overheadHourly / rate * processingFactor : 0;
        const totalCost = base + wasteCost + overheadCost;
        return {
            materialCost: context.materialCost,
            packagingCost: context.packagingCost,
            overheadCost,
            wasteCost,
            directPurchaseCost: context.directPurchaseCost,
            totalCost,
            formulaVersion: this.formulaVersion
        };
    }
}
export class Type1FoilFormula extends BaseFormula {
    type = 1;
    calculate(context) { return this.finalize(context, 1.05); }
}
export class Type2StretchFormula extends BaseFormula {
    type = 2;
    calculate(context) { return this.finalize(context, 1.15); }
}
export class Type3BakingFormula extends BaseFormula {
    type = 3;
    calculate(context) { return this.finalize(context, 1.1); }
}
export class Type4NapkinsFormula extends BaseFormula {
    type = 4;
    calculate(context) { return this.finalize(context, 0.95); }
}
export class Type5TissueFormula extends BaseFormula {
    type = 5;
    calculate(context) { return this.finalize(context, 1.0); }
}
export class Type6TradeGoodsFormula extends BaseFormula {
    type = 6;
    calculate(context) { return this.finalize(context, 0.1); }
}
export const formulaRegistry = {
    1: new Type1FoilFormula(),
    2: new Type2StretchFormula(),
    3: new Type3BakingFormula(),
    4: new Type4NapkinsFormula(),
    5: new Type5TissueFormula(),
    6: new Type6TradeGoodsFormula()
};
