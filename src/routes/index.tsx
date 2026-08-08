import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, FileText, LineChart, Timer } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gravity Institute — Cambridge O/A Level Academy" },
      {
        name: "description",
        content:
          "Syllabus-aligned Cambridge courses in Accounting 7707, Economics 9708, Business 9609 and Mathematics 9709, with examiner-style grading and academy analytics.",
      },
      { property: "og:title", content: "Gravity Institute — The centre of success" },
      {
        property: "og:description",
        content:
          "Topic chapters, topical past papers and mark scheme walkthroughs for Cambridge O and A Level students.",
      },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  {
    icon: FileText,
    title: "Topical past papers",
    body: "Every chapter ships with a curated question bank sliced by session, so practice always mirrors the real paper.",
  },
  {
    icon: CheckCircle2,
    title: "Examiner-style marking",
    body: "Upload written work and receive annotated feedback against the official mark scheme, not a generic score.",
  },
  {
    icon: LineChart,
    title: "Academy-grade analytics",
    body: "Heads of department see grading throughput, batch intake and at-risk students before results day.",
  },
];

function Landing() {
  const { session, primaryRole } = useAuth();
  const { data: subjects } = useQuery({
    queryKey: ["public-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("code,name,stream,level,papers,blurb")
        .order("level")
        .order("code");
      if (error) throw error;
      return data;
    },
  });

  const portalHref =
    primaryRole === "admin" ? "/admin" : primaryRole === "teacher" ? "/teacher" : "/student";

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Wordmark />
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground md:flex">
            <a href="#subjects" className="transition-colors hover:text-foreground">
              Subjects
            </a>
            <a href="#method" className="transition-colors hover:text-foreground">
              Method
            </a>
          </nav>
          {session ? (
            <Button asChild size="sm">
              <Link to={portalHref}>
                Enter portal <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "login" as const }}>Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Join the academy
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-18rem] left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]"
        />
        <div className="relative mx-auto max-w-[1240px] px-5 pt-24 pb-20 lg:px-8">
          <div className="rise max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-accent-foreground uppercase ring-1 ring-gold/25">
              Cambridge O &amp; A Level
            </span>
            <h1 className="mt-6 text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
              The centre of success for
              <span className="block text-muted-foreground">
                serious Cambridge candidates.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              Gravity Institute runs Accounting 7707, Economics 9708, Business 9609 and
              Mathematics 9709 as one continuous system — chapter teaching, topical past papers,
              examiner marking and live performance analytics.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your account <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#subjects">Browse the syllabus</a>
              </Button>
            </div>
          </div>

          <dl className="mt-20 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
            {[
              ["1,480+", "Papers marked this session"],
              ["A* / A", "62% of the 2025 A Level cohort"],
              ["11 yrs", "Cambridge examiner experience"],
            ].map(([v, l]) => (
              <div key={l} className="bg-card px-6 py-7">
                <dt className="font-[family-name:var(--font-display)] text-3xl font-semibold">
                  {v}
                </dt>
                <dd className="mt-1.5 text-[13px] text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="subjects" className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8">
        <p className="eyebrow">Streams</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">
          Every course mapped to the current Cambridge syllabus.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(subjects ?? []).map((s) => (
            <article key={s.code} className="lift plate flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-gold">
                  {s.code}
                </span>
                <span className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {s.level}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{s.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {s.blurb}
              </p>
              <div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                <Timer className="size-3.5" />
                {s.papers} papers · {s.stream}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="method" className="border-y bg-card">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-3 lg:px-8">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <div className="flex size-10 items-center justify-center rounded-xl bg-gold-soft text-accent-foreground ring-1 ring-gold/25">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8">
        <div className="ink-panel relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-gold/20 blur-[90px]"
          />
          <h2 className="relative text-3xl font-semibold tracking-tight text-balance">
            Three portals. One academy.
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm leading-relaxed opacity-70">
            Students learn, teachers mark, administrators steer — all on the same record of truth.
          </p>
          <div className="relative mt-8">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ mode: "login" as const }}>Sign in to Gravity</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="hairline border-t">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-8 lg:px-8">
          <Wordmark />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Gravity Institute. Cambridge Assessment International
            Education is not affiliated with this academy.
          </p>
        </div>
      </footer>
    </div>
  );
}
