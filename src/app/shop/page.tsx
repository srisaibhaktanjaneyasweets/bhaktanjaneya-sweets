import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { ShopControls } from "@/components/shop/ShopControls";
import { getCategories } from "@/lib/api/categories";
import { ShopResults } from "./ShopResults";
import { ShopResultsSkeleton } from "./ShopResultsSkeleton";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop Rajahmundry & Tapeswaram Sweets Online",
  description:
    "Shop pure ghee sweets and namkeen online from Bhaktanjaneya Sweets. Order Tapeswaram Kaja, Putharekulu, dry fruit sweets, and festive specials with India-wide delivery.",
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
