import { Container } from "@/components/ui/Container";

export function ShopResultsSkeleton() {
  return (
    <div className="animate-pulse">
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
        <div className="mb-4 h-4 w-24 rounded bg-cream-100"></div>
        
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
