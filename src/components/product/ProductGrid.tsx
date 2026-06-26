import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        // auto-rows-fr keeps every row the same height so cards never render
        // randomly shorter when a product has fewer variants / no rating.
        "grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
