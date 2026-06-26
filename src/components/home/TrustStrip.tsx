import { Leaf, Flame, Sparkles, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const items = [
  { icon: Leaf, title: "100% Pure Veg", text: "No additives, ever", accent: "pista" },
  { icon: Flame, title: "Pure Desi Ghee", text: "Rich & authentic", accent: "gold" },
  { icon: Sparkles, title: "Freshly Made", text: "Small-batch daily", accent: "pista" },
  { icon: Truck, title: "Fast Delivery", text: "Across India", accent: "gold" },
] as const;

const accentClasses = {
  gold: "bg-gold-400/15 text-gold-600 ring-gold-400/30",
  pista: "bg-pista-100 text-pista-600 ring-pista-400/40",
} as const;

export function TrustStrip() {
  return (
    <section className="border-y border-cream-200 bg-white">
      <Container>
        <div className="grid grid-cols-2 gap-6 py-7 md:grid-cols-4">
          {items.map(({ icon: Icon, title, text, accent }) => (
            <div key={title} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                  accentClasses[accent],
                )}
              >
                <Icon size={22} />
              </span>
              <div>
                <p className="text-sm font-semibold text-maroon-900">{title}</p>
                <p className="text-xs text-ink-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
