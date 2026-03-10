import { MarginRule } from '../../types/domain.js';

export interface TierPrice {
  tier: 1 | 2 | 3 | 4 | 5;
  marginPct: number;
  price: number;
}

export class PricingService {
  constructor(private readonly marginRules: MarginRule[]) {}

  buildTierPrices(category: string, cost: number): TierPrice[] {
    const rules = this.marginRules.filter((r) => r.category === category).sort((a, b) => a.tier - b.tier);
    return rules.map((rule) => ({
      tier: rule.tier,
      marginPct: rule.marginPct,
      price: this.priceFromMargin(cost, rule.marginPct)
    }));
  }

  priceFromMargin(cost: number, marginPct: number): number {
    if (cost <= 0) return 0;
    if (marginPct >= 100) return Number.POSITIVE_INFINITY;
    return Number((cost / (1 - marginPct / 100)).toFixed(4));
  }
}
