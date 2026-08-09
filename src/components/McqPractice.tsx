import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  PlayCircle,
  RotateCcw,
  Timer,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "@/components/Primitives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"] as const;
type Letter = (typeof LETTERS)[number];

const MCQ_SUBJECTS = [
  { code: "9702", name: "Physics (P1)", level: "A Level" },
  { code: "9701", name: "Chemistry (P1)", level: "A Level" },
  { code: "9700", name: "Biology (P1)", level: "A Level" },
  { code: "9708", name: "Economics (P1 AS / P3 A2)", level: "A Level" },
  { code: "9706", name: "Accounting (P1)", level: "A Level" },
  { code: "0620", name: "Chemistry — IGCSE (P1/2)", level: "O Level" },
  { code: "5070", name: "Chemistry — O Level (P1/2)", level: "O Level" },
  { code: "0625", name: "Physics — IGCSE (P1/2)", level: "O Level" },
  { code: "5054", name: "Physics — O Level (P1/2)", level: "O Level" },
  { code: "0610", name: "Biology — IGCSE (P1/2)", level: "O Level" },
  { code: "5090", name: "Biology — O Level (P1/2)", level: "O Level" },
  { code: "0455", name: "Economics — IGCSE (P1)", level: "O Level" },
  { code: "2281", name: "Economics — O Level (P1)", level: "O Level" },
  { code: "0452", name: "Accounting — IGCSE (P1)", level: "O Level" },
  { code: "7707", name: "Accounting — O Level (P1)", level: "O Level" },
  { code: "0653", name: "Combined Science — IGCSE (P1/2)", level: "O Level" },
  { code: "5129", name: "Combined Science — O Level (P1/2)", level: "O Level" },
  { code: "0654", name: "Co-ordinated Sciences (P1/2)", level: "O Level" },
  { code: "0680", name: "Environmental Management — IGCSE", level: "O Level" },
  { code: "5014", name: "Environmental Management — O Level", level: "O Level" },
  { code: "5180", name: "Marine Science", level: "O Level" },
  { code: "0454", name: "Enterprise", level: "O Level" },
  { code: "0580", name: "Mathematics", level: "O Level" },
];

const YEARS = Array.from({ length: 12 }, (_, i) => 2015 + i);


interface Row {
  id: string;
  subject_code: string;
  year: number;
  session: string;
  paper_variant: string;
  question_number: number;
  question_text_or_image_url: string;
  options: unknown;
  correct_answer: string;
  explanation_text_or_image: string;
  topic_tag: string;
}

function isImage(v: string) {
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(v.trim());
}

function grade(pct: number) {
  if (pct >= 90) return "A*";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 40) return "E";
  return "U";
}

function clock(total: number) {
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function McqPractice() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [level, setLevel] = useState("all");
  const [subject, setSubject] = useState("9702");
  const [fromYear, setFromYear] = useState("2015");
  const [toYear, setToYear] = useState("2025");
  const [mode, setMode] = useState<"practice" | "timed">("practice");

  const visibleSubjects = MCQ_SUBJECTS.filter((s) => level === "all" || s.level === level);

  const bank = useQuery({
    queryKey: ["mcq", subject, fromYear, toYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcq_questions")
        .select("*")
        .eq("subject_code", subject)
        .gte("year", Number(fromYear))
        .lte("year", Number(toYear))
        .order("year")
        .order("paper_variant")
        .order("question_number");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [running, setRunning] = useState(false);
  const [questions, setQuestions] = useState<Row[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Letter>>({});
  const [struck, setStruck] = useState<Record<string, Letter[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number; seconds: number } | null>(
    null,
  );
  const submittedRef = useRef(false);

  const current = questions[idx];
  const currentOptions = useMemo(
    () => (Array.isArray(current?.options) ? (current.options as string[]) : []),
    [current],
  );

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      if (mode === "timed") {
        setRemaining((r) => {
          if (r <= 1) return 0;
          return r - 1;
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [running, mode]);

  useEffect(() => {
    if (running && mode === "timed" && remaining === 0 && !submittedRef.current) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, mode]);

  const save = useMutation({
    mutationFn: async (payload: { score: number; total: number; seconds: number }) => {
      if (!user) return;
      const { error } = await supabase.from("quiz_attempts").insert({
        student_id: user.id,
        subject_code: subject,
        mode,
        score: payload.score,
        total: payload.total,
        time_taken_seconds: payload.seconds,
        answers,
      });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["my-attempts", user?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function start() {
    const pool = bank.data ?? [];
    if (!pool.length) {
      toast.error("No questions in the bank for that filter yet.");
      return;
    }
    submittedRef.current = false;
    setQuestions(pool);
    setIdx(0);
    setAnswers({});
    setStruck({});
    setFlagged({});
    setElapsed(0);
    setRemaining(pool.length * 75);
    setResult(null);
    setRunning(true);
  }

  function choose(q: Row, letter: Letter) {
    if (mode === "practice" && answers[q.id]) return;
    setAnswers((a) => ({ ...a, [q.id]: letter }));
  }

  function toggleStrike(q: Row, letter: Letter) {
    setStruck((s) => {
      const list = s[q.id] ?? [];
      return {
        ...s,
        [q.id]: list.includes(letter) ? list.filter((l) => l !== letter) : [...list, letter],
      };
    });
  }

  function submit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const score = questions.reduce(
      (acc, q) => acc + (answers[q.id] === (q.correct_answer as Letter) ? 1 : 0),
      0,
    );
    const payload = { score, total: questions.length, seconds: elapsed };
    setResult(payload);
    setRunning(false);
    save.mutate(payload);
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Past paper MCQs"
        title="Quizzes & MCQ practice"
        description="Topical and yearly Cambridge multiple-choice questions with official mark scheme explanations."
      />

      {/* ---------- FILTERS ---------- */}
      <div className="plate grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Filter label="Level">
          <Select
            value={level}
            onValueChange={(v) => {
              setLevel(v);
              const first = MCQ_SUBJECTS.find((s) => v === "all" || s.level === v);
              if (first && v !== "all") setSubject(first.code);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="O Level">O Level</SelectItem>
              <SelectItem value="A Level">A Level</SelectItem>
            </SelectContent>
          </Select>
        </Filter>

        <Filter label="Subject">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleSubjects.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.code} · {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Filter>

        <Filter label="From year">
          <Select value={fromYear} onValueChange={setFromYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Filter>

        <Filter label="To year">
          <Select value={toYear} onValueChange={setToYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Filter>

        <Filter label="Mode">
          <div className="flex h-9 items-center gap-1 rounded-md bg-muted/70 p-1">
            {(["practice", "timed"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-sm px-2 py-1 text-xs font-semibold capitalize transition-colors",
                  mode === m ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                {m === "practice" ? "Practice" : "Timed exam"}
              </button>
            ))}
          </div>
        </Filter>
      </div>

      <div className="plate flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-semibold">
            {bank.isLoading ? "Loading bank…" : `${bank.data?.length ?? 0} questions available`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {subject} · {fromYear}–{toYear} ·{" "}
            {mode === "timed" ? "75 s per question, timer runs down" : "instant mark scheme"}
          </p>
        </div>
        <Button onClick={start} disabled={bank.isLoading || !(bank.data ?? []).length}>
          {bank.isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <PlayCircle className="size-3.5" />
          )}
          Start {mode === "timed" ? "timed paper" : "practice"}
        </Button>
      </div>

      {/* ---------- RUNNER ---------- */}
      <Dialog
        open={running}
        onOpenChange={(o) => {
          if (!o) setRunning(false);
        }}
      >
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <span className="text-base">
                {subject} · {current?.session} {current?.year} · Paper {current?.paper_variant}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset",
                  mode === "timed" && remaining < 60
                    ? "bg-destructive/10 text-destructive ring-destructive/25"
                    : "bg-muted text-muted-foreground ring-border",
                )}
              >
                <Timer className="size-3.5" />
                {mode === "timed" ? clock(remaining) : clock(elapsed)}
              </span>
            </DialogTitle>
          </DialogHeader>

          {current ? (
            <div className="mt-2">
              <Progress value={((idx + 1) / questions.length) * 100} className="h-1" />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Question {idx + 1} of {questions.length}
                  {current.topic_tag ? ` · ${current.topic_tag}` : ""}
                </p>
                <Button
                  variant={flagged[current.id] ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFlagged((f) => ({ ...f, [current.id]: !f[current.id] }))}
                >
                  <Flag className="size-3.5" /> {flagged[current.id] ? "Flagged" : "Flag"}
                </Button>
              </div>

              {isImage(current.question_text_or_image_url) ? (
                <img
                  src={current.question_text_or_image_url}
                  alt={`Question ${current.question_number} of ${subject} ${current.year}`}
                  className="mt-3 w-full rounded-xl border"
                  loading="lazy"
                />
              ) : (
                <p className="mt-3 text-[15px] leading-relaxed font-medium">
                  {current.question_text_or_image_url}
                </p>
              )}

              <div className="mt-5 space-y-2">
                {currentOptions.map((opt, i) => {
                  const letter = LETTERS[i] as Letter;
                  const picked = answers[current.id] === letter;
                  const isStruck = (struck[current.id] ?? []).includes(letter);
                  const revealed = mode === "practice" && !!answers[current.id];
                  const correct = current.correct_answer === letter;
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <button
                        onClick={() => choose(current, letter)}
                        className={cn(
                          "flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200",
                          isStruck && "opacity-45",
                          revealed && correct && "border-success/50 bg-success/10",
                          revealed && picked && !correct && "border-destructive/50 bg-destructive/10",
                          !revealed && picked && "border-gold/60 bg-gold-soft/60 font-medium",
                          !revealed && !picked && "hover:border-foreground/15 hover:bg-muted/60",
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">
                          {letter}
                        </span>
                        <span className={cn("flex-1", isStruck && "line-through")}>{opt}</span>
                        {revealed && correct ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : null}
                        {revealed && picked && !correct ? (
                          <XCircle className="size-4 text-destructive" />
                        ) : null}
                      </button>
                      <button
                        onClick={() => toggleStrike(current, letter)}
                        title="Strike through this option"
                        aria-label={`Strike through option ${letter}`}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
                          isStruck ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span className="line-through">S</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {mode === "practice" && answers[current.id] ? (
                <div className="mt-5 rounded-xl border bg-muted/50 p-4">
                  <p className="eyebrow">Mark scheme</p>
                  <p className="mt-1.5 text-sm font-semibold">
                    Correct answer: {current.correct_answer}
                  </p>
                  {isImage(current.explanation_text_or_image) ? (
                    <img
                      src={current.explanation_text_or_image}
                      alt="Mark scheme explanation"
                      className="mt-2 w-full rounded-lg border"
                      loading="lazy"
                    />
                  ) : (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {current.explanation_text_or_image}
                    </p>
                  )}
                </div>
              ) : null}

              {/* question grid */}
              <div className="mt-6 flex flex-wrap gap-1.5">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setIdx(i)}
                    className={cn(
                      "size-7 rounded-md border text-[11px] font-semibold tabular-nums transition-colors",
                      i === idx && "ring-2 ring-primary ring-offset-1",
                      flagged[q.id]
                        ? "border-gold/60 bg-gold-soft"
                        : answers[q.id]
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === 0}
                  onClick={() => setIdx((i) => i - 1)}
                >
                  <ChevronLeft className="size-3.5" /> Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  {answeredCount}/{questions.length} answered
                </span>
                {idx === questions.length - 1 ? (
                  <Button size="sm" onClick={submit}>
                    Submit paper
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIdx((i) => i + 1)}>
                    Next <ChevronRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ---------- RESULTS ---------- */}
      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paper results — {subject}</DialogTitle>
          </DialogHeader>
          {result ? (
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Score" value={`${result.score}/${result.total}`} />
                <Metric
                  label="Percentage"
                  value={`${Math.round((result.score / Math.max(result.total, 1)) * 100)}%`}
                />
                <Metric label="Time" value={clock(result.seconds)} />
                <Metric
                  label="Grade est."
                  value={grade((result.score / Math.max(result.total, 1)) * 100)}
                  accent
                />
              </div>

              <p className="eyebrow mt-6">Question breakdown</p>
              <ul className="mt-2 space-y-2">
                {questions.map((q, i) => {
                  const opts = Array.isArray(q.options) ? (q.options as string[]) : [];
                  const chosen = answers[q.id];
                  const ok = chosen === q.correct_answer;
                  return (
                    <li key={q.id} className="rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        {ok ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        ) : (
                          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">
                            Q{i + 1}. {q.question_text_or_image_url}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Your answer: {chosen ? `${chosen} — ${opts[LETTERS.indexOf(chosen)]}` : "not answered"}
                          </p>
                          {!ok ? (
                            <>
                              <p className="mt-0.5 text-xs font-medium text-success">
                                Mark scheme: {q.correct_answer} —{" "}
                                {opts[LETTERS.indexOf(q.correct_answer as Letter)]}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {q.explanation_text_or_image}
                              </p>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setResult(null);
                    start();
                  }}
                >
                  <RotateCcw className="size-3.5" /> Retry paper
                </Button>
                <Button className="flex-1" onClick={() => setResult(null)}>
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-center",
        accent ? "border-gold/50 bg-gold-soft/50" : "bg-muted/40",
      )}
    >
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
