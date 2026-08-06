import { cn } from "@/lib/utils";

type Tone = "pending" | "graded" | "returned" | "paid" | "unpaid" | "risk" | "neutral" | "gold";

const TONES: Record<Tone, string> = {
  pending: "bg-warning/12 text-warning-foreground ring-warning/30",
  graded: "bg-success/12 text-success ring-success/30",
  returned: "bg-primary/8 text-foreground ring-border",
  paid: "bg-success/12 text-success ring-success/30",
  unpaid: "bg-destructive/10 text-destructive ring-destructive/25",
  risk: "bg-destructive/10 text-destructive ring-destructive/25",
  neutral: "bg-muted text-muted-foreground ring-border",
  gold: "bg-gold-soft text-accent-foreground ring-gold/35",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  if (status === "graded") return "graded";
  if (status === "returned") return "returned";
  if (status === "pending") return "pending";
  return "neutral";
}
