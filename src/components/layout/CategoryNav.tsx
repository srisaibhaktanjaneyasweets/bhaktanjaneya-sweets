import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/api/categories";
import { Container } from "@/components/ui/Container";

export const dynamic = "force-dynamic";

export async function CategoryNav() {
  const categories = await getCategories();
  if (!categories.length) return null;

  return (
    <section className="border-b border-cream-300/60 bg-cream-50 py-6 sm:py-8">
      <Container>
        <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-6 sm:gap-x-14 md:gap-x-20">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${category.slug}`}
              className="group flex w-[88px] flex-col items-center sm:w-[104px]"
            >
              <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full border border-maroon-800/15 bg-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03] sm:h-[104px] sm:w-[104px]">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="104px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-cream-100 font-serif text-2xl font-semibold text-maroon-800">
                    {category.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="mt-3 text-center font-serif text-sm font-medium leading-tight text-maroon-900 sm:text-base">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
