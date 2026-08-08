import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Banknote, GraduationCap, Layers } from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { FeeSyncBar } from "@/components/FeeSyncPanel";
import { SectionHeading, StatCard } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Gravity Institute" },
      {
        name: "description",
        content:
          "Executive analytics for Gravity Institute: batch enrollments, grading throughput, fee collection and at-risk students.",
      },
      { property: "og:title", content: "Admin Portal — Gravity Institute" },
      { property: "og:description", content: "Academy-wide KPIs, finance and risk analytics." },
    ],
  }),
  component: AdminPortal,
});

const CHART_COLORS = [
  "oklch(0.28 0.024 258)",
  "oklch(0.68 0.088 74)",
  "oklch(0.6 0.05 210)",
  "oklch(0.78 0.06 82)",
  "oklch(0.5 0.03 258)",
  "oklch(0.72 0.04 150)",
];

function AdminPortal() {
  const { roles } = useAuth();
  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });
  const enrollments = useQuery({
    queryKey: ["all-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollments").select("*");
      if (error) throw error;
      return data;
    },
  });
  const submissions = useQuery({
    queryKey: ["all-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const profiles = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,email");
      if (error) throw error;
      return data;
    },
  });
  const attempts = useQuery({
    queryKey: ["all-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_attempts").select("*");
      if (error) throw error;
      return data;
    },
  });
  const feeRecords = useQuery({
    queryKey: ["fee-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_records")
        .select("*")
        .order("student_name");
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const enrolls = enrollments.data ?? [];
  const subs = submissions.data ?? [];
  const people = profiles.data ?? [];
  const fees = feeRecords.data ?? [];

  const money = (n: number) =>
    `${fees[0]?.currency ?? "PKR"} ${Math.round(n).toLocaleString()}`;

  const feeTotals = useMemo(() => {
    const collected = fees
      .filter((f) => f.status === "paid")
      .reduce((a, f) => a + Number(f.amount || 0), 0);
    const billed = fees.reduce((a, f) => a + Number(f.amount || 0), 0);
    return {
      collected,
      billed,
      outstanding: billed - collected,
      paidCount: fees.filter((f) => f.status === "paid").length,
      overdueCount: fees.filter((f) => f.status === "overdue").length,
      rate: billed ? Math.round((collected / billed) * 100) : 0,
    };
  }, [fees]);

  const perStream = useMemo(() => {
    // Every subject that appears in the syllabus OR in the synced spreadsheet.
    const codes = new Set<string>();
    for (const s of subjects.data ?? []) codes.add(s.code);
    for (const f of fees) {
      const c = (f.subject_code || "").trim().toUpperCase();
      if (c) codes.add(c);
    }

    const rows = [...codes].map((code) => {
      const rowsFor = fees.filter(
        (f) => (f.subject_code || "").trim().toUpperCase() === code,
      );
      const billed = rowsFor.reduce((a, f) => a + Number(f.amount || 0), 0);
      const collected = rowsFor
        .filter((f) => f.status === "paid")
        .reduce((a, f) => a + Number(f.amount || 0), 0);
      const sheetStudents = new Set(
        rowsFor.map((f) => (f.student_email || f.student_name || "").toLowerCase()).filter(Boolean),
      ).size;
      const enrolledStudents = new Set(
        enrolls.filter((e) => e.subject_code === code).map((e) => e.student_id),
      ).size;
      return {
        code,
        name: code,
        students: Math.max(sheetStudents, enrolledStudents),
        billed,
        revenue: collected,
        collected,
        outstanding: billed - collected,
      };
    });

    return rows
      .filter((r) => r.students > 0 || r.billed > 0)
      .sort((a, b) => b.billed - a.billed || a.code.localeCompare(b.code));
  }, [subjects.data, enrolls, fees]);


  const engagement = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        day: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        submissions: subs.filter((s) => s.created_at.slice(0, 10) === key).length,
        quizzes: (attempts.data ?? []).filter((a) => a.created_at.slice(0, 10) === key).length,
      };
    });
    return days;
  }, [subs, attempts.data]);

  const graded = subs.filter((s) => s.status !== "pending");
  const throughput = subs.length ? Math.round((graded.length / subs.length) * 100) : 0;

  const risk = useMemo(() => {
    return people
      .map((p) => {
        const own = subs.filter((s) => s.student_id === p.id);
        const scored = own.filter((s) => s.score != null);
        const avg = scored.length
          ? Math.round(
              scored.reduce(
                (a, s) => a + (Number(s.score) / Number(s.max_score || 100)) * 100,
                0,
              ) / scored.length,
            )
          : null;
        const pending = own.filter((s) => s.status === "pending").length;
        const streams = enrolls.filter((e) => e.student_id === p.id).length;
        return { p, avg, pending, streams, marked: scored.length };
      })
      .filter((r) => r.streams > 0 || r.marked > 0)
      .sort((a, b) => (a.avg ?? 200) - (b.avg ?? 200));
  }, [people, subs, enrolls]);

  const heatSubjects = (subjects.data ?? []).slice(0, 6);

  return (
    <PortalShell title="Academy control room." subtitle="Admin Portal">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Batch enrollments"
          value={enrolls.length}
          accent
          hint="active O/A Level seats"
        />
        <StatCard label="Grading throughput" value={`${throughput}%`} hint="scripts released" />
        <StatCard
          label="Fees settled"
          value={money(feeTotals.collected)}
          hint={`${feeTotals.rate}% of ${money(feeTotals.billed)} billed · ${money(feeTotals.outstanding)} outstanding`}
        />


        <StatCard label="Registered users" value={people.length} hint="all roles" />
      </div>

      <FeeSyncBar isAdmin={roles.includes("admin")} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="plate p-6">
          <SectionHeading
            eyebrow="Engagement"
            title="System-wide activity, last 14 days"
            description="Script submissions against timed quiz attempts."
          />
          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagement} margin={{ left: -22, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.006 95)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={2}
                  stroke="oklch(0.535 0.013 258)"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  allowDecimals={false}
                  stroke="oklch(0.535 0.013 258)"
                />
                <RTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.9 0.006 95)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke={CHART_COLORS[0]}
                  fill="url(#gA)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="quizzes"
                  stroke={CHART_COLORS[1]}
                  fill="url(#gB)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="plate p-6">
          <SectionHeading eyebrow="Intake mix" title="Seats per stream" />
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={perStream.filter((p) => p.students > 0)}
                  dataKey="students"
                  nameKey="code"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {perStream.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.9 0.006 95)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {perStream.map((p, i) => (
              <li key={p.code} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="flex-1 text-muted-foreground">{p.code}</span>
                <span className="font-semibold tabular-nums">{p.students}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="plate p-6">
          <SectionHeading
            eyebrow="Finance"
            title="Fee collection by subject"
            description="Total billed against collected, per subject in the synced sheet."
          />
          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perStream} margin={{ left: -22, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.006 95)" vertical={false} />
                <XAxis
                  dataKey="code"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="oklch(0.535 0.013 258)"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="oklch(0.535 0.013 258)"
                />
                <RTooltip
                  cursor={{ fill: "oklch(0.949 0.005 95)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.9 0.006 95)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="billed"
                  name="Billed"
                  radius={[6, 6, 0, 0]}
                  fill={CHART_COLORS[4]}
                  fillOpacity={0.35}
                />
                <Bar
                  dataKey="collected"
                  name="Collected"
                  radius={[6, 6, 0, 0]}
                  fill={CHART_COLORS[1]}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4 text-center">
            {[
              [Banknote, "Collected", `${feeTotals.paidCount} invoices`],
              [Layers, "Streams live", String(perStream.filter((p) => p.students).length)],
              [GraduationCap, "Scripts marked", String(graded.length)],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof Banknote;
              return (
                <div key={label as string}>
                  <I className="mx-auto size-4 text-muted-foreground" />
                  <p className="mt-1.5 text-sm font-semibold">{value as string}</p>
                  <p className="text-[11px] text-muted-foreground">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="plate p-6">
          <SectionHeading
            eyebrow="Coverage heatmap"
            title="Marked scripts per stream"
            description="Darker cells mean more examiner activity in that paper."
          />
          <div className="mt-6 space-y-2">
            {heatSubjects.map((s) => {
              const cells = [1, 2, 3, 4].map((paper) => {
                const n = subs.filter(
                  (x) => x.subject_code === s.code && x.paper_code.includes(`/${paper}`),
                ).length;
                const base = subs.filter((x) => x.subject_code === s.code).length;
                return { paper, n, base };
              });
              const total = subs.filter((x) => x.subject_code === s.code).length;
              return (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-medium">{s.code}</span>
                  <div className="flex flex-1 gap-1.5">
                    {cells.map((c) => {
                      const intensity = c.base ? Math.min(c.n / Math.max(c.base, 1), 1) : 0;
                      return (
                        <div
                          key={c.paper}
                          title={`Paper ${c.paper}: ${c.n} scripts`}
                          className="h-8 flex-1 rounded-md ring-1 ring-inset ring-border transition-transform hover:scale-[1.04]"
                          style={{
                            background:
                              intensity === 0
                                ? "oklch(0.955 0.004 95)"
                                : `color-mix(in oklab, oklch(0.68 0.088 74) ${20 + intensity * 70}%, white)`,
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="w-8 text-right text-xs font-semibold tabular-nums">{total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 plate p-6">
        <SectionHeading
          eyebrow="Risk register"
          title="Students needing intervention"
          description="Ranked by lowest released average, then unmarked backlog."
        />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="hairline text-left">
                {["Student", "Streams", "Marked", "Average", "Backlog", "Flag"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {risk.map(({ p, avg, pending, streams, marked }) => {
                const danger = avg != null && avg < 55;
                const watch = avg != null && avg >= 55 && avg < 70;
                return (
                  <tr key={p.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3.5">
                      <span className="block font-medium">{p.full_name || p.email}</span>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">{streams}</td>
                    <td className="px-4 py-3.5 tabular-nums">{marked}</td>
                    <td
                      className={cn(
                        "px-4 py-3.5 font-semibold tabular-nums",
                        danger && "text-destructive",
                      )}
                    >
                      {avg == null ? "—" : `${avg}%`}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">{pending}</td>
                    <td className="px-4 py-3.5">
                      {danger ? (
                        <StatusBadge tone="risk">
                          <AlertTriangle className="size-3" /> At risk
                        </StatusBadge>
                      ) : watch ? (
                        <StatusBadge tone="pending">Monitor</StatusBadge>
                      ) : avg == null ? (
                        <StatusBadge tone="neutral">No data</StatusBadge>
                      ) : (
                        <StatusBadge tone="graded">On track</StatusBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!risk.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No enrolment activity yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="plate mt-8 p-6">
        <SectionHeading
          eyebrow="Student payment status"
          title="Fee ledger from the spreadsheet"
          description={`${fees.length} rows · ${money(feeTotals.outstanding)} outstanding · ${feeTotals.overdueCount} overdue.`}
        />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="hairline text-left">
                {["Student", "Subject", "Term", "Amount", "Paid on", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {fees.map((f) => (
                <tr key={f.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3.5">
                    <span className="block font-medium">{f.student_name || f.student_email}</span>
                    <span className="text-xs text-muted-foreground">{f.student_email}</span>
                  </td>
                  <td className="px-4 py-3.5">{f.subject_code || "—"}</td>
                  <td className="px-4 py-3.5">{f.term || "—"}</td>
                  <td className="px-4 py-3.5 tabular-nums">
                    {f.currency} {Number(f.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">{f.paid_on ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    {f.status === "paid" ? (
                      <StatusBadge tone="graded">Paid</StatusBadge>
                    ) : f.status === "overdue" ? (
                      <StatusBadge tone="risk">Overdue</StatusBadge>
                    ) : f.status === "partial" ? (
                      <StatusBadge tone="pending">Partial</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Pending</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
              {!fees.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No fee rows yet — connect a spreadsheet above and press sync.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
