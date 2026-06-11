import type { Order } from "@/lib/types";
import { apiPost } from "./client";

export async function createOrder(order: Order): Promise<Order> {
  return apiPost<Order>("/orders", order);
}
