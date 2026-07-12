import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import {
  categoryFromRow,
  categoryToRow,
  customerFromRow,
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

type Resource =
  | "products"
  | "categories"
  | "tags"
  | "offers"
  | "orders"
  | "customers"
  | "posts";

const ALLOWED_RESOURCES: readonly Resource[] = [
  "products",
  "categories",
  "tags",
  "offers",
  "orders",
  "customers",
  "posts",
];

function isAllowed(resource: string): resource is Resource {
  return (ALLOWED_RESOURCES as readonly string[]).includes(resource);
}

const SLUGGED_RESOURCES: readonly Resource[] = ["categories", "tags", "products", "posts"];

function formatRows(resource: Resource, rows: Record<string, unknown>[]) {
  if (resource === "products") return rows.map(productFromRow);
  if (resource === "categories") return rows.map(categoryFromRow);
  if (resource === "tags") return rows.map(tagFromRow);
  if (resource === "offers") return rows.map(offerFromRow);
  if (resource === "orders") return rows.map(orderFromRow);
  if (resource === "posts") return rows.map(postFromRow);
  return rows;
}

function formatRow(resource: Resource, row: Record<string, unknown>) {
  return formatRows(resource, [row])[0];
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

export async function GET(req: NextRequest, { params }: { params: Promise<Record<string, string>> | Record<string, string> }) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  const p = (await params) as Record<string, string>;
  if (!isAllowed(p.resource)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const resource = p.resource;

  if (!isConfigured) return NextResponse.json([]);

  const query = supabaseAdmin.from(resource).select("*");
  const { data, error } = resource === "orders" ? await query.order("created_at", { ascending: false }) : await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (resource === "customers") {
    const { data: orders } = await supabaseAdmin.from("orders").select("customer_phone");
    const counts = new Map<string, number>();
    (orders ?? []).forEach((row) => {
      const phone = (row as { customer_phone?: string }).customer_phone;
      if (!phone) return;
      counts.set(phone, (counts.get(phone) ?? 0) + 1);
    });
    const customers = (data ?? []).map((row) => customerFromRow(row as Record<string, unknown>, counts.get((row as { phone?: string }).phone ?? "") ?? 0));
    return NextResponse.json(customers);
  }

  return NextResponse.json(formatRows(resource, (data ?? []) as Record<string, unknown>[]));
}

export async function POST(req: NextRequest, { params }: { params: Promise<Record<string, string>> | Record<string, string> }) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
  const p = (await params) as Record<string, string>;
  if (!isAllowed(p.resource)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const resource = p.resource;
  const body = (await req.json()) as Record<string, unknown>;
  const table = resource;
  
  const normalizeSlug = (value: unknown) => {
    if (typeof value !== "string") return "";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@/lib/utils").betterSlugify(value).trim();
  };

  let payload = payloadFor(resource, body);

  if (!isConfigured) {
    return NextResponse.json(body, { status: 201 });
  }

  if (SLUGGED_RESOURCES.includes(resource)) {
    const incomingSlug = normalizeSlug((body as { slug?: unknown })?.slug);

    if (!incomingSlug) return NextResponse.json({ error: "Slug is required." }, { status: 400 });

    payload = { ...payload, slug: incomingSlug };

    const { data: existing, error: slugCheckError } = await supabaseAdmin
      .from(table)
      .select("id")
      .eq("slug", incomingSlug)
      .limit(1);

    if (slugCheckError) {
      return NextResponse.json({ error: slugCheckError.message }, { status: 500 });
    }

    if ((existing ?? []).length > 0) {
      return NextResponse.json({ error: "Slug already exists. Please choose a different name/slug." }, { status: 409 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(formatRow(resource, data as Record<string, unknown>), { status: 201 });
}
