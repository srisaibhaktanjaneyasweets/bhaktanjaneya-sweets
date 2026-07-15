import { getCategories } from "@/lib/api/categories";
import { Container } from "@/components/ui/Container";
import { CategoryRail } from "@/components/layout/CategoryRail";

export const dynamic = "force-dynamic";

export async function CategoryNav() {
  const categories = await getCategories();
  if (!categories.length) return null;

  return (
    <section className="border-b border-cream-300/60 bg-cream-50 py-2 sm:py-3">
      <Container>
        <CategoryRail categories={categories} />
      </Container>
    </section>
  );
}
