import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileUp,
  ListChecks,
  Loader2,
  PlayCircle,
  Timer,
  Upload,
} from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeading, StatCard } from "@/components/Primitives";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { FALLBACK_MODULE, SYLLABUS } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import { useFocus } from "@/lib/focus";
import { QuizRunner } from "@/components/QuizRunner";
import { McqPractice } from "@/components/McqPractice";
import { FloatingWhatsAppButton } from "@/components/FloatingWhatsAppButton";

export const Route = createFileRoute("/_authenticated/student")({
  head: () => ({
    meta: [
      { title: "Student Portal — Gravity Institute" },
      {
        name: "description",
        content:
          "Your Cambridge course chapters, topical past papers, assignment uploads and timed quizzes.",
      },
      { property: "og:title", content: "Student Portal — Gravity Institute" },
      { property: "og:description", content: "Cambridge courses, papers and quizzes." },
    ],
  }),
  component: StudentPortal,
});

function StudentPortal() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const enrollments = useQuery({
    queryKey: ["enrollments", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", uid!);
      if (error) throw error;
      return data;
    },
  });

  const submissions = useQuery({
    queryKey: ["my-submissions", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const quizzes = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quizzes").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });

  const attempts = useQuery({
    queryKey: ["my-attempts", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("student_id", uid!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const enroll = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from("enrollments")
        .insert({ student_id: uid!, subject_code: code });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enrolled — your chapters are unlocked");
      void qc.invalidateQueries({ queryKey: ["enrollments", uid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enrolledCodes = new Set((enrollments.data ?? []).map((e) => e.subject_code));
  const enrolledSubjects = (subjects.data ?? []).filter((s) => enrolledCodes.has(s.code));

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [tab, setTab] = useState("courses");
  const focus = useFocus();
  useEffect(() => {
    if (focus?.tab) setTab(focus.tab);
  }, [focus]);
  const activeSubject = enrolledSubjects.find((s) => s.code === activeCode) ?? enrolledSubjects[0];
  const modul = activeSubject ? (SYLLABUS[activeSubject.code] ?? FALLBACK_MODULE) : FALLBACK_MODULE;

  const graded = (submissions.data ?? []).filter((s) => s.status !== "pending");
  const average = useMemo(() => {
    const scored = graded.filter((s) => s.score != null);
    if (!scored.length) return "—";
    const pct =
      scored.reduce((a, s) => a + (Number(s.score) / Number(s.max_score || 100)) * 100, 0) /
      scored.length;
    return `${Math.round(pct)}%`;
  }, [graded]);

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";

  return (
    <PortalShell title={`Good to see you, ${firstName}.`} subtitle="Student Portal">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active courses" value={enrolledSubjects.length} hint="this term" />
        <StatCard
          label="Papers pending"
          value={(submissions.data ?? []).filter((s) => s.status === "pending").length}
          hint="awaiting marking"
        />
        <StatCard label="Average score" value={average} accent hint="across marked papers" />
        <StatCard label="Quizzes taken" value={(attempts.data ?? []).length} hint="all time" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-10">
        <TabsList className="h-11 rounded-full bg-muted/70 p-1">
          <TabsTrigger value="courses" className="rounded-full px-5">
            <BookOpen className="size-3.5" /> Courses
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-full px-5">
            <ClipboardList className="size-3.5" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-full px-5">
            <Timer className="size-3.5" /> Quizzes
          </TabsTrigger>
          <TabsTrigger value="mcq" className="rounded-full px-5">
            <ListChecks className="size-3.5" /> MCQ practice
          </TabsTrigger>
        </TabsList>

        {/* ---------- COURSES ---------- */}
        <TabsContent value="courses" className="mt-8 space-y-10">
          {enrolledSubjects.length === 0 ? (
            <div className="plate p-10 text-center">
              <h3 className="text-lg font-semibold">You are not enrolled in a stream yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Pick a subject below to unlock its topic chapters, topical past papers and mark
                scheme walkthroughs.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <nav className="plate h-fit p-2">
                {enrolledSubjects.map((s) => {
                  const on = activeSubject?.code === s.code;
                  return (
                    <button
                      key={s.code}
                      onClick={() => setActiveCode(s.code)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3.5 py-3 text-left transition-colors",
                        on ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{s.name}</span>
                        <span
                          className={cn(
                            "block text-[11px]",
                            on ? "text-primary-foreground/60" : "text-muted-foreground",
                          )}
                        >
                          {s.code} · {s.level}
                        </span>
                      </span>
                      <ChevronRight className="size-4 opacity-50" />
                    </button>
                  );
                })}
              </nav>

              <div className="space-y-8">
                <div className="plate p-6">
                  <SectionHeading
                    eyebrow="Topic chapters"
                    title={`${activeSubject?.name} ${activeSubject?.code}`}
                    description={activeSubject?.blurb}
                  />
                  <ul className="mt-6 divide-y">
                    {modul.chapters.map((c, i) => (
                      <li
                        key={c.title}
                        className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-muted/40"
                      >
                        <span className="w-6 shrink-0 text-center font-[family-name:var(--font-display)] text-xs font-semibold text-muted-foreground tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{c.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.papers} · {c.minutes} min
                          </span>
                        </span>
                        <PlayCircle className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="plate p-6">
                    <p className="eyebrow">Topical past papers</p>
                    <ul className="mt-4 space-y-3">
                      {modul.topicalPapers.map((p) => (
                        <li key={p.label} className="rounded-lg border p-3.5">
                          <p className="text-sm font-medium">{p.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {p.session} · {p.marks} marks
                          </p>
                        </li>
                      ))}
                      {modul.topicalPapers.length === 0 ? (
                        <li className="text-sm text-muted-foreground">Coming soon.</li>
                      ) : null}
                    </ul>
                  </div>
                  <div className="plate p-6">
                    <p className="eyebrow">Mark scheme walkthroughs</p>
                    <ul className="mt-4 space-y-3">
                      {modul.walkthroughs.map((w) => (
                        <li
                          key={w.label}
                          className="flex items-start gap-3 rounded-lg border p-3.5"
                        >
                          <PlayCircle className="mt-0.5 size-4 shrink-0 text-gold" />
                          <span>
                            <span className="block text-sm font-medium">{w.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {w.examiner} · {w.minutes} min
                            </span>
                          </span>
                        </li>
                      ))}
                      {modul.walkthroughs.length === 0 ? (
                        <li className="text-sm text-muted-foreground">Coming soon.</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <SectionHeading
              eyebrow="Catalogue"
              title="Add another stream"
              description="Enrolment unlocks the full chapter list and topical bank immediately."
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(subjects.data ?? []).map((s) => {
                const on = enrolledCodes.has(s.code);
                return (
                  <div key={s.code} className="lift plate flex flex-col p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gold">{s.code}</span>
                      <StatusBadge tone={on ? "graded" : "neutral"}>
                        {on ? "Enrolled" : s.level}
                      </StatusBadge>
                    </div>
                    <h4 className="mt-3 font-semibold">{s.name}</h4>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {s.blurb}
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      variant={on ? "outline" : "default"}
                      disabled={on || enroll.isPending}
                      onClick={() => enroll.mutate(s.code)}
                    >
                      {on ? (
                        <>
                          <CheckCircle2 className="size-3.5" /> In your plan
                        </>
                      ) : (
                        "Enrol"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ---------- ASSIGNMENTS ---------- */}
        <TabsContent value="assignments" className="mt-8">
          <AssignmentsPanel
            submissions={submissions.data ?? []}
            subjects={(subjects.data ?? []).map((s) => ({ code: s.code, name: s.name }))}
            onDone={() => void qc.invalidateQueries({ queryKey: ["my-submissions", uid] })}
          />
        </TabsContent>

        {/* ---------- QUIZZES ---------- */}
        <TabsContent value="quizzes" className="mt-8 space-y-6">
          <SectionHeading
            eyebrow="Topical quizzes"
            title="Timed, auto-marked practice"
            description="Each quiz runs against a countdown and scores instantly with per-question review."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(quizzes.data ?? []).map((q) => {
              const best = (attempts.data ?? [])
                .filter((a) => a.quiz_id === q.id)
                .sort((a, b) => b.score - a.score)[0];
              return (
                <div key={q.id} className="lift plate flex flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gold">{q.subject_code}</span>
                    {best ? (
                      <StatusBadge tone="graded">
                        Best {best.score}/{best.total}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Not attempted</StatusBadge>
                    )}
                  </div>
                  <h4 className="mt-3 font-semibold">{q.title}</h4>
                  <p className="mt-1 flex-1 text-xs text-muted-foreground">
                    {q.topic} · {(q.questions_json as unknown[]).length} questions
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Timer className="size-3.5" /> {q.duration_minutes} min
                    </span>
                    <QuizRunner
                      quiz={q}
                      onFinished={() => void qc.invalidateQueries({ queryKey: ["my-attempts", uid] })}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {(attempts.data ?? []).length ? (
            <div className="plate p-6">
              <p className="eyebrow">Recent attempts</p>
              <ul className="mt-4 divide-y">
                {(attempts.data ?? []).slice(0, 6).map((a) => {
                  const quiz = (quizzes.data ?? []).find((q) => q.id === a.quiz_id);
                  const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
                  return (
                    <li key={a.id} className="flex items-center gap-4 py-3">
                      <span className="flex-1 text-sm font-medium">
                        {quiz?.title ??
                          `${a.subject_code || "MCQ"} · ${a.mode === "timed" ? "Timed paper" : "Practice"}`}
                      </span>
                      <Progress value={pct} className="hidden h-1.5 w-40 sm:block" />
                      <span className="w-16 text-right text-sm font-semibold tabular-nums">
                        {a.score}/{a.total}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </TabsContent>

        {/* ---------- MCQ PRACTICE ---------- */}
        <TabsContent value="mcq" className="mt-8">
          <McqPractice />
        </TabsContent>
      </Tabs>
    </PortalShell>
  );
}

interface SubmissionRow {
  id: string;
  paper_code: string;
  title: string;
  subject_code: string | null;
  status: string;
  score: number | null;
  max_score: number;
  examiner_feedback: string | null;
  file_url: string | null;
  created_at: string;
}

function AssignmentsPanel({
  submissions,
  subjects,
  onDone,
}: {
  submissions: SubmissionRow[];
  subjects: { code: string; name: string }[];
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [paper, setPaper] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState(subjects[0]?.code ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const file = fileRef.current?.files?.[0];
    setBusy(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        const path = `students/${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error } = await supabase.storage
          .from("past-paper-submissions")
          .upload(path, file, { upsert: false });
        if (error) throw error;
        fileUrl = path;
      }
      const { error: insErr } = await supabase.from("submissions").insert({
        student_id: user.id,
        subject_code: code || null,
        paper_code: paper,
        title,
        file_url: fileUrl,
        status: "pending",
      });
      if (insErr) throw insErr;
      toast.success("Submitted for marking");
      setOpen(false);
      setPaper("");
      setTitle("");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const pending = submissions.filter((s) => s.status === "pending");
  const marked = submissions.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Assignments"
        title="Past-paper tasks"
        description="Upload written work as PDF or a photo of your script. Marking turnaround is 48 hours."
        action={
          <Button onClick={() => setOpen(true)}>
            <FileUp className="size-4" /> Submit work
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="plate p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Awaiting marking</p>
            <StatusBadge tone="pending">{pending.length}</StatusBadge>
          </div>
          <ul className="mt-4 space-y-3">
            {pending.map((s) => (
              <li key={s.id} className="rounded-xl border p-4">
                <p className="text-sm font-semibold">{s.title || s.paper_code}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.subject_code} · {s.paper_code} · submitted{" "}
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
            {!pending.length ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nothing pending. Well played.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="plate p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Examiner feedback</p>
            <StatusBadge tone="graded">{marked.length}</StatusBadge>
          </div>
          <ul className="mt-4 space-y-3">
            {marked.map((s) => (
              <li key={s.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{s.title || s.paper_code}</p>
                  <span className="font-[family-name:var(--font-display)] text-sm font-semibold tabular-nums">
                    {s.score ?? "—"}/{s.max_score}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.subject_code} · {s.paper_code}
                </p>
                {s.examiner_feedback ? (
                  <p className="mt-3 rounded-lg bg-muted/70 p-3 text-xs leading-relaxed">
                    {s.examiner_feedback}
                  </p>
                ) : null}
              </li>
            ))}
            {!marked.length ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Marked work will appear here.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit past-paper work</DialogTitle>
          </DialogHeader>
          <form onSubmit={upload} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sub-title">Task title</Label>
              <Input
                id="sub-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Control accounts — Q4"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sub-subject">Subject</Label>
                <select
                  id="sub-subject"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-paper">Paper code</Label>
                <Input
                  id="sub-paper"
                  value={paper}
                  onChange={(e) => setPaper(e.target.value)}
                  placeholder="9708/22/M/J/24"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-file">Script (PDF or image)</Label>
              <Input id="sub-file" type="file" ref={fileRef} accept=".pdf,image/*" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Send for marking
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { statusTone };
