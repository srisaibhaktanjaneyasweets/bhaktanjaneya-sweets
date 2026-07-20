import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star size={size} className="fill-gold-500 text-gold-500" />
      <span className="font-medium text-ink-900">{value.toFixed(1)}</span>
      {count != null && <span className="font-semibold text-ink-700">({count})</span>}
    </span>
  );
}
