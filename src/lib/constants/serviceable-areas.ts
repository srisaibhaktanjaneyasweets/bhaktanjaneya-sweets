// Cities where online courier delivery is currently available, grouped by state.
// Used on the storefront (delivery-location gate + checkout) and enforced again
// server-side in the orders API so an order can never be placed for an
// unserviceable city.

export const DEFAULT_SERVICEABLE_AREAS: Record<string, readonly string[]> = {
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

export const SERVICEABLE_AREAS = DEFAULT_SERVICEABLE_AREAS;
export const SERVICEABLE_STATES = Object.keys(DEFAULT_SERVICEABLE_AREAS);

const normalize = (value: string) => value.trim().toLowerCase();

/** Get array of state names from dynamic areas map or fallback. */
export function getServiceableStates(
  areasMap?: Record<string, readonly string[]> | null,
): readonly string[] {
  const map =
    areasMap && Object.keys(areasMap).length > 0
      ? areasMap
      : DEFAULT_SERVICEABLE_AREAS;
  return Object.keys(map);
}

/** Cities for a state (case-insensitive match), or an empty list. */
export function citiesForState(
  state?: string | null,
  areasMap?: Record<string, readonly string[]> | null,
): readonly string[] {
  if (!state) return [];
  const map =
    areasMap && Object.keys(areasMap).length > 0
      ? areasMap
      : DEFAULT_SERVICEABLE_AREAS;
  const states = Object.keys(map);
  const key = states.find((s) => normalize(s) === normalize(state));
  return key ? map[key] : [];
}

/** True when the state is one we deliver to. */
export function isServiceableState(
  state?: string | null,
  areasMap?: Record<string, readonly string[]> | null,
): boolean {
  if (!state) return false;
  const map =
    areasMap && Object.keys(areasMap).length > 0
      ? areasMap
      : DEFAULT_SERVICEABLE_AREAS;
  const states = Object.keys(map);
  return states.some((s) => normalize(s) === normalize(state));
}

/** True when both the state and city are covered by courier delivery. */
export function isServiceableCity(
  state?: string | null,
  city?: string | null,
  areasMap?: Record<string, readonly string[]> | null,
): boolean {
  if (!state || !city) return false;
  return citiesForState(state, areasMap).some((c) => normalize(c) === normalize(city));
}
