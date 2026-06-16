import { Truck, BadgePercent, MessageCircle } from "lucide-react";
import { config } from "@/lib/config";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const items = [
  {
    icon: Truck,
    text: `Free shipping on orders over ${formatINR(config.freeShippingThreshold)}`,
  },
  { icon: BadgePercent, text: "Use code BAS10 for 10% off your first order" },
  { icon: MessageCircle, text: `Order on WhatsApp: ${config.contact.phone}` },
];

export function AnnouncementBar() {
  return (
    <div className="bg-maroon-900 text-cream-100">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-8 px-4 py-2 text-xs sm:text-[13px]">
        {items.map(({ icon: Icon, text }, i) => (
          <span
            key={text}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap",
              i > 0 && "hidden lg:inline-flex",
            )}
          >
            <Icon size={14} className="shrink-0 text-saffron-400" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
