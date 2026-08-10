import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  FileUp,
  ListChecks,
  Loader2,
  PenLine,
  Search,
  Users,
  Video,
} from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeading, StatCard } from "@/components/Primitives";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { AssignmentsHub } from "@/components/teacher/AssignmentsHub";
import { LecturesHub } from "@/components/teacher/LecturesHub";
import { McqCreator } from "@/components/teacher/McqCreator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useFocus } from "@/lib/focus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Portal — Gravity Institute" },
      {
        name: "description",
        content:
          "Grade Cambridge past-paper submissions with examiner annotations and track class mastery by topic.",
      },
      { property: "og:title", content: "Teacher Portal — Gravity Institute" },
      { property: "og:description", content: "Grading queue and class mastery tracking." },
    ],
  }),
  component: TeacherPortal,
});

interface Submission {
  id: string;
  student_id: string;
  subject_code: string | null;
  paper_code: string;
  title: string;
  file_url: string | null;
  score: number | null;
  max_score: number;
  examiner_feedback: string | null;
  status: string;
  created_at: string;
}

function TeacherPortal() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const submissions = useQuery({
    queryKey: ["all-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
  });

  const students = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,email");
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

  const nameOf = (id: string) => {
    const p = (students.data ?? []).find((s) => s.id === id);
    return p?.full_name || p?.email || "Student";
  };

  const [selected, setSelected] = useState<Submission | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("queue");
  const focus = useFocus();

  useEffect(() => {
    if (focus?.tab) setTab(focus.tab);
  }, [focus]);

  const queue = (submissions.data ?? []).filter(
    (s) =>
      s.status === "pending" &&
      (!filter ||
        nameOf(s.student_id).toLowerCase().includes(filter.toLowerCase()) ||
        s.paper_code.toLowerCase().includes(filter.toLowerCase())),
  );
  const gradedList = (submissions.data ?? []).filter((s) => s.status !== "pending");

  const gradedByMe = gradedList.length;
  const avgMark = useMemo(() => {
    const scored = gradedList.filter((s) => s.score != null);
    if (!scored.length) return "—";
    return `${Math.round(
      scored.reduce((a, s) => a + (Number(s.score) / Number(s.max_score || 100)) * 100, 0) /
        scored.length,
    )}%`;
  }, [gradedList]);

  function open(s: Submission) {
    setSelected(s);
    setScore(s.score != null ? String(s.score) : "");
    setFeedback(s.examiner_feedback ?? "");
  }

  async function save() {
    if (!selected || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("submissions")
      .update({
        score: score === "" ? null : Number(score),
        examiner_feedback: feedback,
        status: "graded",
        graded_by: user.id,
      })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marks released to the student");
    setSelected(null);
    void qc.invalidateQueries({ queryKey: ["all-submissions"] });
  }

  const firstName = (profile?.full_name || "").split(" ")[0] || "Teacher";

  return (
    <PortalShell title={`Grading desk, ${firstName}.`} subtitle="Teacher Portal">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="In queue" value={queue.length} accent hint="awaiting marks" />
        <StatCard label="Marked" value={gradedByMe} hint="this session" />
        <StatCard label="Cohort average" value={avgMark} hint="marked scripts" />
        <StatCard label="Students" value={(students.data ?? []).length} hint="on roll" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-10">
        <TabsList className="h-11 flex-wrap rounded-full bg-muted/70 p-1">
          <TabsTrigger value="queue" className="rounded-full px-5">
            <PenLine className="size-3.5" /> Grading queue
          </TabsTrigger>
          <TabsTrigger value="classes" className="rounded-full px-5">
            <Users className="size-3.5" /> Class management
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-full px-5">
            <FileUp className="size-3.5" /> Assignments &amp; PDFs
          </TabsTrigger>
          <TabsTrigger value="lectures" className="rounded-full px-5">
            <Video className="size-3.5" /> Lectures &amp; Videos
          </TabsTrigger>
          <TabsTrigger value="mcqs" className="rounded-full px-5">
            <ListChecks className="size-3.5" /> Quizzes &amp; MCQs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="plate p-6">
              <SectionHeading
                eyebrow="Queue"
                title="Submissions awaiting marks"
                action={
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Student or paper"
                      className="h-9 w-52 pl-8"
                    />
                  </div>
                }
              />
              <ul className="mt-6 divide-y">
                {queue.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => open(s)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-lg px-3 py-3.5 text-left transition-colors",
                        selected?.id === s.id ? "bg-gold-soft/60" : "hover:bg-muted/60",
                      )}
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{nameOf(s.student_id)}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.title || s.paper_code} · {s.subject_code} ·{" "}
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                      </span>
                      <StatusBadge tone={statusTone(s.status)}>{s.status}</StatusBadge>
                    </button>
                  </li>
                ))}
                {!queue.length ? (
                  <li className="py-12 text-center text-sm text-muted-foreground">
                    Queue is clear. Nothing awaiting marks.
                  </li>
                ) : null}
              </ul>

              {gradedList.length ? (
                <div className="mt-8 border-t pt-6">
                  <p className="eyebrow">Recently released</p>
                  <ul className="mt-3 space-y-2">
                    {gradedList.slice(0, 5).map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm"
                      >
                        <span className="font-medium">{nameOf(s.student_id)}</span>
                        <span className="text-xs text-muted-foreground">{s.paper_code}</span>
                        <span className="font-semibold tabular-nums">
                          {s.score ?? "—"}/{s.max_score}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="plate h-fit p-6 lg:sticky lg:top-24">
              {selected ? (
                <div className="space-y-5">
                  <div>
                    <p className="eyebrow">Marking</p>
                    <h3 className="mt-1.5 text-lg font-semibold">{nameOf(selected.student_id)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selected.title || "Untitled"} · {selected.paper_code}
                    </p>
                  </div>

                  {selected.file_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        const { data, error } = await supabase.storage
                          .from("past-paper-submissions")
                          .createSignedUrl(selected.file_url!, 300);
                        if (error || !data) {
                          toast.error("Could not open script");
                          return;
                        }
                        window.open(data.signedUrl, "_blank", "noopener");
                      }}
                    >
                      <FileText className="size-3.5" /> Open submitted script
                    </Button>
                  ) : (
                    <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                      No file attached to this submission.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="score">Mark awarded</Label>
                      <Input
                        id="score"
                        type="number"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Out of</Label>
                      <Input value={selected.max_score} readOnly className="bg-muted/60" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fb">Examiner annotation</Label>
                    <Textarea
                      id="fb"
                      rows={7}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="AO1 secure. AO3 evaluation lacks a supported judgement — reference the data in the stem before concluding..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={save} disabled={saving}>
                      {saving ? <Loader2 className="size-4 animate-spin" /> : null} Release marks
                    </Button>
                    <Button variant="ghost" onClick={() => setSelected(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <PenLine className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Select a submission</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Marks and annotations appear to the student instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="mt-8 space-y-6">
          <SectionHeading
            eyebrow="Class management"
            title="Progress by student and sub-topic"
            description="Mastery is derived from released marks across each student's enrolled streams."
          />
          <div className="plate overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="hairline text-left">
                  <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Streams
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Scripts marked
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Mastery
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(students.data ?? []).map((st) => {
                  const mine = gradedList.filter((s) => s.student_id === st.id && s.score != null);
                  const pct = mine.length
                    ? Math.round(
                        mine.reduce(
                          (a, s) => a + (Number(s.score) / Number(s.max_score || 100)) * 100,
                          0,
                        ) / mine.length,
                      )
                    : 0;
                  const streams = (enrollments.data ?? [])
                    .filter((e) => e.student_id === st.id)
                    .map((e) => e.subject_code);
                  return (
                    <tr key={st.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-6 py-4">
                        <span className="block font-medium">{st.full_name || st.email}</span>
                        <span className="text-xs text-muted-foreground">{st.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex flex-wrap gap-1.5">
                          {streams.length ? (
                            streams.map((c) => (
                              <StatusBadge key={c} tone="gold">
                                {c}
                              </StatusBadge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 tabular-nums">{mine.length}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Progress value={pct} className="h-1.5 w-28" />
                          <span className="w-10 text-xs font-semibold tabular-nums">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </PortalShell>
  );
}
