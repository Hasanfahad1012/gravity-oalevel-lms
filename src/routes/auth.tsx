import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Gravity Institute" },
      {
        name: "description",
        content:
          "Access your Gravity Institute student, teacher or admin portal for Cambridge O and A Level study.",
      },
      { property: "og:title", content: "Sign in — Gravity Institute" },
      {
        property: "og:description",
        content: "Access your Gravity Institute portal.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("login" as const),
    next:
      typeof search["next"] === "string" && search["next"].startsWith("/") && !search["next"].startsWith("//")
        ? (search["next"] as string)
        : undefined,
  }),
  component: AuthPage,
});

const ROLES: { value: AppRole; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Courses, papers & quizzes" },
  { value: "teacher", label: "Teacher", hint: "Grading queue & classes" },
  { value: "admin", label: "Admin", hint: "Academy-wide control" },
];

function AuthPage() {
  const { mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const { session, primaryRole, loading } = useAuth();

  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("student");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      if (next) {
        window.location.href = next;
        return;
      }
      void navigate({
        to: primaryRole === "admin" ? "/admin" : primaryRole === "teacher" ? "/teacher" : "/student",
        replace: true,
      });
    }
  }, [loading, session, primaryRole, navigate, next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Welcome to Gravity Institute");
        } else {
          toast.success("Account created", {
            description: "Check your inbox to confirm your email, then sign in.",
          });
          setIsSignup(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to Gravity Institute");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="ink-panel relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 size-[34rem] rounded-full bg-gold/15 blur-[120px]"
        />
        <Link to="/" className="relative">
          <Wordmark tone="light" />
        </Link>
        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-55">
            Session 2026
          </p>
          <p className="mt-5 font-[family-name:var(--font-display)] text-3xl leading-[1.15] font-semibold tracking-tight">
            “Marks are not awarded for effort. They are awarded for structure.”
          </p>
          <p className="mt-5 text-sm opacity-60">
            Every submission at Gravity is marked against the published Cambridge scheme, with
            examiner annotations attached line by line.
          </p>
        </div>
        <p className="relative text-xs opacity-45">
          Accounting 7707 · Economics 9708 · Business 9609 · Mathematics 9709
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-[26rem]">
          <div className="lg:hidden">
            <Link to="/">
              <Wordmark />
            </Link>
          </div>

          <p className="eyebrow mt-8 lg:mt-0">{isSignup ? "Join the academy" : "Welcome back"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {isSignup ? "Create your account" : "Sign in to Gravity"}
          </h1>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isSignup ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ayesha Khan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Portal access</Label>
                  <div className="grid gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-300",
                          role === r.value
                            ? "border-gold/50 bg-gold-soft/60 shadow-[0_8px_24px_-16px_oklch(0.68_0.088_74)]"
                            : "hover:border-foreground/15 hover:bg-muted/60",
                        )}
                      >
                        <span>
                          <span className="block text-sm font-semibold">{r.label}</span>
                          <span className="block text-xs text-muted-foreground">{r.hint}</span>
                        </span>
                        <span
                          className={cn(
                            "size-4 rounded-full border-2 transition-colors",
                            role === r.value ? "border-gold bg-gold" : "border-border",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@academy.edu"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"} <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already enrolled?" : "New to Gravity?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignup((v) => !v)}
              className="font-semibold text-foreground underline underline-offset-4 hover:text-gold"
            >
              {isSignup ? "Sign in instead" : "Create an account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
