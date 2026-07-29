export interface ShippingSettings {
  minOrderValue: number;
  freeShippingThreshold: number;
  stateCharges: Record<string, number>;
  stateFreeThresholds?: Record<string, number>;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  minOrderValue: 0,
  freeShippingThreshold: 799,
  stateCharges: {
    "Andhra Pradesh": 0,
    "Telangana": 0,
  },
  stateFreeThresholds: {},
};

/** Parse the weight in kg from a variant label string. */
export function parseWeightKg(label: string): number {
  const clean = label.toLowerCase();
  
  // Match kg: e.g. "1 kg", "1.5 kg", "1kg"
  const kgMatch = clean.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    return parseFloat(kgMatch[1]);
  }
  
  // Match grams: e.g. "250 g", "500 grms", "250gm", "250g"
  const gMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:grms|gms|gm|g)\b/);
  if (gMatch) {
    return parseFloat(gMatch[1]) / 1000;
  }
  
  // If it contains pieces, e.g. "5 pieces" or "10 pcs"
  const pcsMatch = clean.match(/(\d+)\s*(?:pieces|pcs|pc|piece)/);
  if (pcsMatch) {
    return 0.5; // Default fallback to 0.5 kg for pieces/box
  }
  
  return 0.5; // Default fallback weight
}

/** Calculate the shipping fee based on cart subtotal, shipping settings, state, and cart items weight. */
export function calculateShippingFee(
  subtotal: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
  offerFreeShipping = false,
  state?: string | null,
  items?: { variantLabel: string; quantity: number }[],
): number {
  if (offerFreeShipping) {
    return 0;
  }

  // Determine the active free shipping threshold for this state
  let activeFreeThreshold = settings.freeShippingThreshold;
  if (state && settings.stateFreeThresholds) {
    const normalizedState = state.trim().toLowerCase();
    const thresholdKey = Object.keys(settings.stateFreeThresholds).find(
      (s) => s.toLowerCase() === normalizedState
    );
    if (thresholdKey !== undefined) {
      activeFreeThreshold = settings.stateFreeThresholds[thresholdKey];
    }
  }

  if (subtotal >= activeFreeThreshold) {
    return 0;
  }

  // Calculate dynamic shipping fee if state and items are provided
  if (state && items && items.length > 0) {
    const normalizedState = state.trim().toLowerCase();
    
    // Determine charge per kg for this state
    let chargePerKg = 150;
    
    if (settings.stateCharges) {
      const stateKey = Object.keys(settings.stateCharges).find(
        (s) => s.toLowerCase() === normalizedState
      );
      if (stateKey !== undefined) {
        chargePerKg = settings.stateCharges[stateKey];
      } else if (normalizedState === "andhra pradesh" || normalizedState === "ap") {
        chargePerKg = settings.stateCharges["Andhra Pradesh"] ?? 0;
      } else if (normalizedState === "telangana") {
        chargePerKg = settings.stateCharges["Telangana"] ?? 0;
      }
    } else {
      if (normalizedState === "andhra pradesh" || normalizedState === "ap" || normalizedState === "telangana") {
        chargePerKg = 0;
      }
    }

    let totalWeightKg = 0;
    for (const item of items) {
      totalWeightKg += parseWeightKg(item.variantLabel) * item.quantity;
    }

    return Math.round(totalWeightKg * chargePerKg);
  }

  // Fallback to 0 if no state/items are provided
  return 0;
}

/** Get remaining amount required to unlock free shipping. */
export function getFreeShippingRemaining(
  subtotal: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS,
  state?: string | null,
): number {
  let activeFreeThreshold = settings.freeShippingThreshold;
  if (state && settings.stateFreeThresholds) {
    const normalizedState = state.trim().toLowerCase();
    const thresholdKey = Object.keys(settings.stateFreeThresholds).find(
      (s) => s.toLowerCase() === normalizedState
    );
    if (thresholdKey !== undefined) {
      activeFreeThreshold = settings.stateFreeThresholds[thresholdKey];
    }
  }
  return Math.max(0, activeFreeThreshold - subtotal);
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
