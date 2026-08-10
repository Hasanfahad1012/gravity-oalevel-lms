import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ListChecks, Trash2, Upload } from "lucide-react";
import { SectionHeading } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MCQ_SUBJECTS } from "@/components/McqPractice";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"] as const;
const SESSIONS = ["May/June", "Oct/Nov", "Feb/March"];
const VARIANTS = ["11", "12", "13", "21", "22"];

interface McqRow {
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

const blank = {
  subject_code: "9702",
  year: String(new Date().getFullYear()),
  session: "May/June",
  paper_variant: "11",
  question_number: "1",
  topic_tag: "",
  question: "",
  options: ["", "", "", ""],
  correct: "A",
  explanation: "",
};

export function McqCreator() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...blank });
  const [publish, setPublish] = useState(true);
  const [saving, setSaving] = useState(false);

  const questions = useQuery({
    queryKey: ["mcq-authored", form.subject_code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcq_questions")
        .select("*")
        .eq("subject_code", form.subject_code)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as McqRow[];
    },
  });

  function setOption(i: number, v: string) {
    const next = [...form.options];
    next[i] = v;
    setForm({ ...form, options: next });
  }

  async function submit() {
    if (!form.question.trim()) {
      toast.error("Add the question text.");
      return;
    }
    if (form.options.some((o) => !o.trim())) {
      toast.error("Fill in all four options.");
      return;
    }
    if (!publish) {
      toast.error("Turn on “Publish to Student MCQ Practice Hub” to save this question.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("mcq_questions").insert({
      subject_code: form.subject_code,
      year: Number(form.year) || new Date().getFullYear(),
      session: form.session,
      paper_variant: form.paper_variant,
      question_number: Number(form.question_number) || 1,
      question_text_or_image_url: form.question.trim(),
      options: form.options.map((o, i) => `${LETTERS[i]}. ${o.trim().replace(/^[A-D]\.\s*/, "")}`),
      correct_answer: form.correct,
      explanation_text_or_image: form.explanation.trim(),
      topic_tag: form.topic_tag.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Question published to the MCQ Practice Hub");
    setForm({
      ...form,
      question: "",
      options: ["", "", "", ""],
      explanation: "",
      question_number: String((Number(form.question_number) || 1) + 1),
    });
    void qc.invalidateQueries({ queryKey: ["mcq-authored"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("mcq_questions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Question removed");
    void qc.invalidateQueries({ queryKey: ["mcq-authored"] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="plate p-6">
        <SectionHeading
          eyebrow="Question writer"
          title="Create a custom MCQ"
          description="Published questions appear instantly in the student MCQ practice hub under the chosen paper."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Select
              value={form.subject_code}
              onValueChange={(v) => setForm({ ...form, subject_code: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {MCQ_SUBJECTS.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.code} · {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-year">Year</Label>
            <Input
              id="q-year"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Session</Label>
            <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Paper variant</Label>
            <Select
              value={form.paper_variant}
              onValueChange={(v) => setForm({ ...form, paper_variant: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIANTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    Paper {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-num">Question number</Label>
            <Input
              id="q-num"
              type="number"
              value={form.question_number}
              onChange={(e) => setForm({ ...form, question_number: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-topic">Topic tag</Label>
            <Input
              id="q-topic"
              value={form.topic_tag}
              onChange={(e) => setForm({ ...form, topic_tag: e.target.value })}
              placeholder="Kinematics"
            />
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label htmlFor="q-text">Question text or image URL</Label>
          <Textarea
            id="q-text"
            rows={4}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="A car accelerates uniformly from rest… (or paste an image URL)"
          />
        </div>

        <div className="mt-5 space-y-2.5">
          <Label>Options & answer key</Label>
          {LETTERS.map((letter, i) => (
            <div key={letter} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, correct: letter })}
                aria-label={`Mark ${letter} correct`}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                  form.correct === letter
                    ? "border-success bg-success/12 text-success"
                    : "hover:bg-muted",
                )}
              >
                {form.correct === letter ? <CheckCircle2 className="size-4" /> : letter}
              </button>
              <Input
                value={form.options[i]}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${letter}`}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Tap a letter to set the correct answer — currently <strong>{form.correct}</strong>.
          </p>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label htmlFor="q-exp">Mark scheme explanation</Label>
          <Textarea
            id="q-exp"
            rows={4}
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            placeholder="Use v = u + at with u = 0, so a = v/t = 12/4 = 3 m s⁻²."
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
          <div>
            <p className="text-sm font-semibold">Publish to Student MCQ Practice Hub</p>
            <p className="text-xs text-muted-foreground">
              Makes the question available in practice and timed modes.
            </p>
          </div>
          <Switch checked={publish} onCheckedChange={setPublish} />
        </div>

        <Button className="mt-5 w-full" onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Save question
        </Button>
      </div>

      <div className="plate h-fit p-6 lg:sticky lg:top-24">
        <SectionHeading eyebrow="Recent" title={`${form.subject_code} question bank`} />
        <ul className="mt-5 space-y-2.5">
          {(questions.data ?? []).map((q) => (
            <li key={q.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium">
                  Q{q.question_number}. {q.question_text_or_image_url}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone="gold">{q.correct_answer}</StatusBadge>
                  <span className="text-[11px] text-muted-foreground">
                    {q.session} {q.year} · P{q.paper_variant}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete question"
                onClick={() => void remove(q.id)}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </li>
          ))}
          {!(questions.data ?? []).length ? (
            <li className="py-12 text-center text-sm text-muted-foreground">
              <ListChecks className="mx-auto size-5" />
              <p className="mt-3">No questions for this subject yet.</p>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
