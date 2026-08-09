import { NextResponse, NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { submitToIndexNow } from "@/lib/indexnow";
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

  const updatedBody = { ...body };
  if (resource === "orders") {
    if (updatedBody.status === "confirmed") {
      updatedBody.paymentStatus = "paid";
    } else if (updatedBody.status === "cancelled") {
      updatedBody.paymentStatus = "failed";
    }
  }

  const payload = payloadFor(resource, updatedBody);
  const { data, error } = await supabaseAdmin
    .from(resource)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const responseData = formatRow(resource, data as Record<string, unknown>);

  // Trigger IndexNow notification dynamically
  if (resource === "products" && responseData && typeof responseData === "object" && "slug" in responseData) {
    submitToIndexNow([`/product/${responseData.slug}`, "/", "/shop"]);
  } else if (resource === "categories" && responseData && typeof responseData === "object" && "slug" in responseData) {
    submitToIndexNow([`/collections/${responseData.slug}`, "/shop"]);
  } else if (resource === "posts" && responseData && typeof responseData === "object" && "slug" in responseData) {
    submitToIndexNow([`/blog/${responseData.slug}`, "/blog"]);
  } else {
    submitToIndexNow(["/"]);
  }

  // Revalidate entire site cache so updated items show up immediately
  revalidatePath("/", "layout");

  return NextResponse.json(responseData);
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

  // Trigger IndexNow notification dynamically on deletion
  if (p.resource === "products") {
    submitToIndexNow(["/", "/shop"]);
  } else if (p.resource === "categories") {
    submitToIndexNow(["/shop"]);
  } else if (p.resource === "posts") {
    submitToIndexNow(["/blog"]);
  } else {
    submitToIndexNow(["/"]);
  }

  // Revalidate entire site cache so deleted items are removed immediately
  revalidatePath("/", "layout");

  return new NextResponse(null, { status: 204 });
}
