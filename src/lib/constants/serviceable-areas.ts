// Cities where online courier delivery is currently available, grouped by state.
// Used on the storefront (delivery-location gate + checkout) and enforced again
// server-side in the orders API so an order can never be placed for an
// unserviceable city.

export const SERVICEABLE_AREAS: Record<string, readonly string[]> = {
  Telangana: [
    "Hyderabad",
    "Secunderabad",
    "Warangal",
    "Hanamkonda",
    "Karimnagar",
    "Nizamabad",
    "Khammam",
    "Mahabubnagar",
    "Siddipet",
    "Suryapet",
    "Nalgonda",
    "Adilabad",
    "Ramagundam",
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Rajahmundry",
    "Kakinada",
    "Guntur",
    "Nellore",
    "Tirupati",
    "Kurnool",
    "Anantapur",
    "Kadapa",
    "Eluru",
    "Ongole",
    "Srikakulam",
    "Vizianagaram",
    "Machilipatnam",
    "Tenali",
    "Bhimavaram",
    "Tadepalligudem",
    "Narasaraopet",
    "Chittoor",
  ],
};

/** States we deliver to, in display order. */
export const SERVICEABLE_STATES = Object.keys(SERVICEABLE_AREAS);

const normalize = (value: string) => value.trim().toLowerCase();

/** Cities for a state (case-insensitive match), or an empty list. */
export function citiesForState(state?: string | null): readonly string[] {
  if (!state) return [];
  const key = SERVICEABLE_STATES.find((s) => normalize(s) === normalize(state));
  return key ? SERVICEABLE_AREAS[key] : [];
}

/** True when the state is one we deliver to. */
export function isServiceableState(state?: string | null): boolean {
  return !!state && SERVICEABLE_STATES.some((s) => normalize(s) === normalize(state));
}

/** True when both the state and city are covered by courier delivery. */
export function isServiceableCity(
  state?: string | null,
  city?: string | null,
): boolean {
  if (!state || !city) return false;
  return citiesForState(state).some((c) => normalize(c) === normalize(city));
}
