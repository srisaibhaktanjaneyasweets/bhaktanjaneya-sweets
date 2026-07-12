import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import {
  categoryFromRow,
  categoryToRow,
  offerFromRow,
  offerToRow,
  orderFromRow,
  orderToRow,
  postFromRow,
  postToRow,
  productFromRow,
  productToRow,
  tagFromRow,
  tagToRow,
} from "@/lib/supabase/mappers";

type Resource = "products" | "categories" | "tags" | "offers" | "orders" | "posts";

const ALLOWED_RESOURCES: readonly Resource[] = [
  "products",
  "categories",
  "tags",
  "offers",
  "orders",
  "posts",
];

function isAllowed(resource: string): resource is Resource {
  return (ALLOWED_RESOURCES as readonly string[]).includes(resource);
}

function payloadFor(resource: Resource, body: Record<string, unknown>) {
  if (resource === "products") return productToRow(body as never);
  if (resource === "categories") return categoryToRow(body as never);
  if (resource === "tags") return tagToRow(body as never);
  if (resource === "offers") return offerToRow(body as never);
  if (resource === "orders") return orderToRow(body as never);
  if (resource === "posts") return postToRow(body as never);
  return body;
}

function formatRow(resource: Resource, row: Record<string, unknown>) {
  if (resource === "products") return productFromRow(row);
  if (resource === "categories") return categoryFromRow(row);
  if (resource === "tags") return tagFromRow(row);
  if (resource === "offers") return offerFromRow(row);
  if (resource === "orders") return orderFromRow(row);
  if (resource === "posts") return postFromRow(row);
  return row;
}

function validateOrderPatch(resource: Resource, body: Record<string, unknown>) {
  if (resource === "orders" && body.status === "shipped") {
    const company = typeof body.deliveryCompany === "string" ? body.deliveryCompany.trim() : "";
    const tracking = typeof body.deliveryTrackingId === "string" ? body.deliveryTrackingId.trim() : "";
    if (!company || !tracking) {
      return "Delivery company and tracking ID are required when marking an order as shipped.";
    }
  }
  return null;
}

async function updateResource(
  resource: Resource,
  id: string,
  body: Record<string, unknown>,
) {
  const validationError = validateOrderPatch(resource, body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (!isConfigured) {
    return NextResponse.json(body);
  }

  const payload = payloadFor(resource, body);
  const { data, error } = await supabaseAdmin
    .from(resource)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(formatRow(resource, data as Record<string, unknown>));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Record<string, string>> | Record<string, string> }) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Record<string, unknown>;
  const p = (await params) as Record<string, string>;
  if (!isAllowed(p.resource)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return updateResource(p.resource, p.id, body);
}

export async function PATCH(req: NextRequest, context: { params: Promise<Record<string, string>> | Record<string, string> }) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const p = (await context.params) as Record<string, string>;
  if (!isAllowed(p.resource)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return updateResource(p.resource, p.id, body);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Record<string, string>> | Record<string, string> }) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
  const p = (await params) as Record<string, string>;
  if (!isAllowed(p.resource)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isConfigured) {
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await supabaseAdmin.from(p.resource).delete().eq("id", p.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
