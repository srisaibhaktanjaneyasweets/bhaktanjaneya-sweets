import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Product } from "@/lib/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

export function FeaturedShowcase({
  eyebrow,
  title,
  subtitle,
  products,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className={cn("py-12", className)}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          align="center"
        />

        <ProductGrid products={products} />

        {viewAllHref && (
          <div className="mt-8 flex justify-center">
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-2 rounded-full border border-maroon-800/30 bg-white px-6 py-2.5 text-sm font-semibold text-maroon-800 shadow-soft transition hover:border-maroon-800 hover:bg-maroon-800 hover:text-cream-50"
            >
              {viewAllLabel}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
