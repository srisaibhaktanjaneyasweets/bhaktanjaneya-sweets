import type { Offer } from "@/lib/types";
import { apiGet } from "./client";

export async function getActiveOffers(): Promise<Offer[]> {
  return apiGet<Offer[]>("/offers?active=true");
}
