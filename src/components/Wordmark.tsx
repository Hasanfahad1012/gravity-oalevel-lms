import logo from "@/assets/gravity-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo.url}
        alt="Gravity Institute globe and graduation cap emblem"
        className="size-9 rounded-lg object-cover ring-1 ring-border"
      />
      <span className="leading-none">
        <span
          className={cn(
            "block font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight",
            tone === "light" ? "text-primary-foreground" : "text-foreground",
          )}
        >
          Gravity Institute
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[10px] font-medium tracking-[0.18em] uppercase",
            tone === "light" ? "text-primary-foreground/60" : "text-muted-foreground",
          )}
        >
          The centre of success
        </span>
      </span>
    </span>
  );
}
