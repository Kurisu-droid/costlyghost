export class PricingService {
    marginRules;
    constructor(marginRules) {
        this.marginRules = marginRules;
    }
    buildTierPrices(category, cost) {
        const rules = this.marginRules.filter((r) => r.category === category).sort((a, b) => a.tier - b.tier);
        return rules.map((rule) => ({
            tier: rule.tier,
            marginPct: rule.marginPct,
            price: this.priceFromMargin(cost, rule.marginPct)
        }));
    }
    priceFromMargin(cost, marginPct) {
        if (cost <= 0)
            return 0;
        if (marginPct >= 100)
            return Number.POSITIVE_INFINITY;
        return Number((cost / (1 - marginPct / 100)).toFixed(4));
    }
}
