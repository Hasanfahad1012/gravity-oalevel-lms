import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle, Timer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Question {
  q: string;
  options: string[];
  a: number;
}

export interface QuizRow {
  id: string;
  title: string;
  topic: string;
  subject_code: string;
  duration_minutes: number;
  questions_json: unknown;
}

export function QuizRunner({ quiz, onFinished }: { quiz: QuizRow; onFinished: () => void }) {
  const { user } = useAuth();
  const questions = useMemo(() => (quiz.questions_json as Question[]) ?? [], [quiz]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(quiz.duration_minutes * 60);

  useEffect(() => {
    if (!open || done) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open, done]);

  const score = answers.reduce((acc, a, i) => acc + (a === questions[i]?.a ? 1 : 0), 0);

  useEffect(() => {
    if (!done || !open || !user) return;
    void supabase
      .from("quiz_attempts")
      .insert({ quiz_id: quiz.id, student_id: user.id, score, total: questions.length })
      .then(({ error }) => {
        if (error) toast.error(error.message);
        else onFinished();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function start() {
    setIdx(0);
    setAnswers([]);
    setDone(false);
    setSeconds(quiz.duration_minutes * 60);
    setOpen(true);
  }

  function choose(option: number) {
    const next = [...answers];
    next[idx] = option;
    setAnswers(next);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const current = questions[idx];

  return (
    <>
      <Button size="sm" onClick={start} disabled={!questions.length}>
        <PlayCircle className="size-3.5" /> Start
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4 pr-6">
              <span>{quiz.title}</span>
              {!done ? (
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset",
                    seconds < 60
                      ? "bg-destructive/10 text-destructive ring-destructive/25"
                      : "bg-muted text-muted-foreground ring-border",
                  )}
                >
                  <Timer className="size-3.5" />
                  {mm}:{ss}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          {!done && current ? (
            <div>
              <Progress value={((idx + 1) / questions.length) * 100} className="h-1" />
              <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Question {idx + 1} of {questions.length}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed font-medium">{current.q}</p>
              <div className="mt-5 space-y-2">
                {current.options.map((opt, i) => (
                  <button
                    key={opt}
                    onClick={() => choose(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200",
                      answers[idx] === i
                        ? "border-gold/60 bg-gold-soft/60 font-medium"
                        : "hover:border-foreground/15 hover:bg-muted/60",
                    )}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === 0}
                  onClick={() => setIdx((i) => i - 1)}
                >
                  Back
                </Button>
                {idx === questions.length - 1 ? (
                  <Button size="sm" onClick={() => setDone(true)} disabled={answers[idx] == null}>
                    Submit quiz
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIdx((i) => i + 1)}
                    disabled={answers[idx] == null}
                  >
                    Next question
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="rounded-2xl border bg-muted/50 p-6 text-center">
                <p className="eyebrow">Result</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tabular-nums">
                  {score}
                  <span className="text-xl text-muted-foreground">/{questions.length}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {Math.round((score / Math.max(questions.length, 1)) * 100)}% ·{" "}
                  {quiz.subject_code} {quiz.topic}
                </p>
              </div>
              <ul className="mt-5 max-h-64 space-y-2 overflow-y-auto pr-1">
                {questions.map((q, i) => {
                  const ok = answers[i] === q.a;
                  return (
                    <li key={q.q} className="flex items-start gap-3 rounded-lg border p-3">
                      {ok ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      )}
                      <span>
                        <span className="block text-xs font-medium">{q.q}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Correct: {q.options[q.a]}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
