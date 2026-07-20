export interface ShippingTier {
  id: string;
  minSubtotal: number;
  maxSubtotal: number | null; // null means no upper limit
  fee: number;
}

export interface ShippingSettings {
  minOrderValue: number;
  freeShippingThreshold: number;
  defaultFee: number;
  tiers: ShippingTier[];
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  minOrderValue: 0,
  freeShippingThreshold: 799,
  defaultFee: 50,
  tiers: [
    { id: "tier-1", minSubtotal: 0, maxSubtotal: 499, fee: 50 },
    { id: "tier-2", minSubtotal: 499, maxSubtotal: 799, fee: 30 },
    { id: "tier-3", minSubtotal: 799, maxSubtotal: null, fee: 0 },
  ],
};

/** Calculate the shipping fee based on cart subtotal and active shipping settings. */
export function calculateShippingFee(
  subtotal: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
  offerFreeShipping = false,
): number {
  if (offerFreeShipping || subtotal >= settings.freeShippingThreshold) {
    return 0;
  }

  // Find matching tier if defined
  if (settings.tiers && settings.tiers.length > 0) {
    const matched = settings.tiers.find((tier) => {
      const minMet = subtotal >= tier.minSubtotal;
      const maxMet = tier.maxSubtotal === null || subtotal < tier.maxSubtotal;
      return minMet && maxMet;
    });

    if (matched !== undefined) {
      return matched.fee;
    }
  }

  return settings.defaultFee;
}

/** Get remaining amount required to unlock free shipping. */
export function getFreeShippingRemaining(
  subtotal: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
): number {
  return Math.max(0, settings.freeShippingThreshold - subtotal);
}

/** Check if minimum order value is satisfied. */
export function checkMinOrderRequirement(
  subtotal: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
): { satisfied: boolean; remaining: number } {
  const satisfied = subtotal >= settings.minOrderValue;
  const remaining = satisfied ? 0 : settings.minOrderValue - subtotal;
  return { satisfied, remaining };
}
