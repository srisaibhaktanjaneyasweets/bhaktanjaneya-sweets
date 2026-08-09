import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { ShopControls } from "@/components/shop/ShopControls";
import { getCategories } from "@/lib/api/categories";
import { ShopResults } from "./ShopResults";
import { ShopResultsSkeleton } from "./ShopResultsSkeleton";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop All Sweets & Namkeen",
  description:
    "Browse the full range of Bhaktanjaneya Sweets — pure ghee sweets and crunchy namkeen, made fresh and delivered across India.",
};

export default async function ShopPage(props: { searchParams: Promise<any> }) {
  const sp = await props.searchParams;
  const categories = await getCategories();

  return (
    <div className="pb-10 pt-4">
      <Container>
        <ShopControls categories={categories} />
      </Container>

      <Suspense key={JSON.stringify(sp)} fallback={<ShopResultsSkeleton />}>
        <ShopResults searchParams={sp} />
      </Suspense>
    </div>
  );
}
