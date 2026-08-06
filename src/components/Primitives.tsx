import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  action?: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-2 text-2xl font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "lift plate relative overflow-hidden p-5",
        accent && "ring-1 ring-gold/25",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-12 size-36 rounded-full bg-gold/8 blur-2xl"
      />
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta ? <span className="font-semibold text-success">{delta}</span> : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
