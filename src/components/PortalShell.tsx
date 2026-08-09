import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LogOut, Lock, ShieldCheck, Users } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { CommandBar, CommandBarTrigger, useCommandBar } from "@/components/CommandBar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PORTALS: { role: AppRole; to: string; label: string; icon: typeof Users }[] = [
  { role: "student", to: "/student", label: "Student", icon: GraduationCap },
  { role: "teacher", to: "/teacher", label: "Teacher", icon: Users },
  { role: "admin", to: "/admin", label: "Admin", icon: ShieldCheck },
];

function allowed(roles: AppRole[], target: AppRole) {
  if (roles.includes("admin")) return true;
  if (roles.includes("teacher")) return target === "teacher" || target === "student";
  return target === "student";
}

export function RoleSwitcher() {
  const { roles } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="glass flex items-center gap-1 rounded-full p-1">
      {PORTALS.map(({ role, to, label, icon: Icon }) => {
        const active = path.startsWith(to);
        const can = allowed(roles, role);
        const btn = (
          <button
            key={role}
            type="button"
            onClick={() => {
              if (!can) {
                toast.error(`Your account doesn't have ${label} Portal access.`);
                return;
              }
              void navigate({ to });
            }}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300",
              active
                ? "bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_oklch(0.255_0.019_258/0.6)]"
                : can
                  ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  : "cursor-not-allowed text-muted-foreground/45",
            )}
          >
            {can ? <Icon className="size-3.5" /> : <Lock className="size-3.5" />}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
        return can ? (
          btn
        ) : (
          <Tooltip key={role}>
            <TooltipTrigger asChild>{btn}</TooltipTrigger>
            <TooltipContent>Requires {label.toLowerCase()} privileges</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function PortalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { profile, primaryRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { open, setOpen } = useCommandBar();

  return (
    <div className="min-h-screen bg-background">
      <CommandBar open={open} onOpenChange={setOpen} />
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 lg:px-8">
          <Link to="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <CommandBarTrigger onClick={() => setOpen(true)} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight md:block">
              <p className="text-[13px] font-semibold">{profile?.full_name || profile?.email}</p>
              <p className="text-[11px] tracking-wide text-muted-foreground capitalize">
                {primaryRole}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                void navigate({ to: "/auth", search: { mode: "login" as const }, replace: true });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8">
        <div className="rise">
          <p className="eyebrow">{subtitle}</p>
          <h1 className="mt-2 text-[34px] leading-[1.1] font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        <div className="mt-9">{children}</div>
      </main>
    </div>
  );
}
