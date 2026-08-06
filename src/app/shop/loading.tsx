import { Container } from "@/components/layout/Container";
import { Filter, Search } from "lucide-react";

export default function ShopLoading() {
  return (
    <div className="pb-16 pt-8 animate-pulse">
      <section className="mb-10 text-maroon-900 md:mb-12">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-maroon-800 via-maroon-900 to-maroon-950 px-6 py-12 shadow-sm sm:px-12 sm:py-16">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative">
              <div className="h-4 w-24 rounded bg-white/20 sm:h-5"></div>
              <div className="mt-4 h-8 w-64 rounded bg-white/20 sm:h-12 sm:w-96"></div>
              <div className="mt-4 h-4 w-3/4 max-w-xl rounded bg-white/10 sm:h-5"></div>
              <div className="mt-2 h-4 w-2/4 max-w-xl rounded bg-white/10 sm:h-5"></div>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        {/* Skeleton for ShopControls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex flex-1 max-w-sm items-center">
            <div className="absolute left-3 text-cream-300">
              <Search size={18} />
            </div>
            <div className="h-10 w-full rounded-full bg-cream-100"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 rounded-full bg-cream-100"></div>
            <div className="flex h-10 items-center gap-2 rounded-full border border-cream-200 bg-white px-4">
              <Filter size={16} className="text-ink-400" />
              <div className="h-4 w-16 rounded bg-cream-100"></div>
            </div>
          </div>
        </div>

        <div className="mb-4 h-4 w-24 rounded bg-cream-100"></div>
        
        {/* Skeleton for ProductGrid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8 xl:gap-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-square w-full rounded-2xl bg-cream-100"></div>
              <div className="mt-4 h-5 w-3/4 rounded bg-cream-100"></div>
              <div className="mt-2 h-4 w-1/2 rounded bg-cream-50"></div>
              <div className="mt-3 flex items-center justify-between">
                <div className="h-6 w-16 rounded bg-cream-100"></div>
                <div className="h-8 w-20 rounded-full bg-cream-100"></div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
