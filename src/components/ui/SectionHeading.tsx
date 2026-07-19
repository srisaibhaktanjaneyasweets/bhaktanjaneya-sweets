import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  const heading = (
    <div className={cn("min-w-0 flex-1", centered && "flex flex-col items-center text-center")}>
      {eyebrow && (
        <div className={cn("flex items-center gap-2.5", centered && "justify-center")}>
          {centered && (
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold-400 sm:w-12" />
          )}
          <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
            {eyebrow}
          </span>
          {centered && (
            <>
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold-500" />
              <span className="h-px w-8 bg-gradient-to-r from-gold-400 to-transparent sm:w-12" />
            </>
          )}
        </div>
      )}
      <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-maroon-900 sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className={cn("mt-2 max-w-prose text-sm text-ink-500 sm:text-base", centered && "mx-auto")}>
          {subtitle}
        </p>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="relative mb-8 flex flex-col items-center">
        {heading}
        {action && (
          <div className="mt-5 sm:absolute sm:bottom-0 sm:right-0 sm:mt-0">
            {action}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      {heading}
      {action}
    </div>
  );
}
