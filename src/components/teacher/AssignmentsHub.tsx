import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { SectionHeading } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MCQ_SUBJECTS } from "@/components/McqPractice";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const ALLOWED = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];

export interface AssignmentRow {
  id: string;
  teacher_id: string;
  subject_code: string;
  title: string;
  description: string;
  batch: string;
  total_marks: number;
  due_date: string | null;
  file_url: string | null;
  file_name: string;
  created_at: string;
}

const blank = {
  title: "",
  subject_code: "9702",
  batch: "",
  due_date: "",
  total_marks: "100",
  description: "",
};

export function AssignmentsHub({ onViewScripts }: { onViewScripts: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ ...blank });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AssignmentRow[];
    },
  });

  function pick(f: File | null | undefined) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.includes(ext)) {
      toast.error("Only PDF, DOCX, PNG or JPG files are accepted.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("File is larger than 20MB.");
      return;
    }
    setFile(f);
  }

  function reset() {
    setForm({ ...blank });
    setFile(null);
    setEditingId(null);
  }

  async function submit() {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Give the assignment a title.");
      return;
    }
    setSaving(true);
    try {
      let filePath: string | null = null;
      let fileName = "";
      if (file) {
        const path = `assignments/${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("teaching-resources")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        filePath = path;
        fileName = file.name;
      }

      const payload = {
        subject_code: form.subject_code,
        title: form.title.trim(),
        description: form.description.trim(),
        batch: form.batch.trim(),
        total_marks: Number(form.total_marks) || 0,
        due_date: form.due_date || null,
        ...(filePath ? { file_url: filePath, file_name: fileName } : {}),
      };

      if (editingId) {
        const { error } = await supabase.from("assignments").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Assignment updated");
      } else {
        const { error } = await supabase
          .from("assignments")
          .insert({ ...payload, teacher_id: user.id });
        if (error) throw error;
        toast.success("Assignment published");
      }
      reset();
      void qc.invalidateQueries({ queryKey: ["assignments"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save assignment");
    } finally {
      setSaving(false);
    }
  }

  function edit(a: AssignmentRow) {
    setEditingId(a.id);
    setFile(null);
    setForm({
      title: a.title,
      subject_code: a.subject_code || "9702",
      batch: a.batch,
      due_date: a.due_date ?? "",
      total_marks: String(a.total_marks ?? 100),
      description: a.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(a: AssignmentRow) {
    const { error } = await supabase.from("assignments").delete().eq("id", a.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (a.file_url) void supabase.storage.from("teaching-resources").remove([a.file_url]);
    toast.success("Assignment removed");
    if (editingId === a.id) reset();
    void qc.invalidateQueries({ queryKey: ["assignments"] });
  }

  async function openFile(path: string) {
    const { data, error } = await supabase.storage
      .from("teaching-resources")
      .createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const list = assignments.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <div className="plate h-fit p-6 lg:sticky lg:top-24">
        <SectionHeading
          eyebrow={editingId ? "Editing" : "New task"}
          title={editingId ? "Update assignment" : "Publish an assignment"}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-6 cursor-pointer rounded-xl border border-dashed px-5 py-8 text-center transition-colors",
            dragging ? "border-gold bg-gold-soft/50" : "hover:bg-muted/50",
          )}
        >
          <UploadCloud className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            {file ? file.name : "Drag & drop a file, or browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, PNG or JPG · up to 20MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>
        {file ? (
          <button
            type="button"
            onClick={() => setFile(null)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" /> Remove selected file
          </button>
        ) : null}

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Title</Label>
            <Input
              id="a-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="P1 MCQ drill — Kinematics"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <Label htmlFor="a-batch">Class / batch</Label>
              <Input
                id="a-batch"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                placeholder="AS-2026 Morning"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-due">Due date</Label>
              <Input
                id="a-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-marks">Total marks</Label>
              <Input
                id="a-marks"
                type="number"
                value={form.total_marks}
                onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="a-desc">Description</Label>
            <Textarea
              id="a-desc"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Attempt all 40 questions under exam conditions. Show working for calculation items."
            />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {editingId ? "Save changes" : "Publish assignment"}
            </Button>
            {editingId ? (
              <Button variant="ghost" onClick={reset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="plate p-6">
        <SectionHeading
          eyebrow="Published"
          title="Assignments & PDFs"
          description="Everything currently visible to your students."
        />
        <ul className="mt-6 divide-y">
          {list.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start gap-4 py-4">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-[200px] flex-1">
                <p className="text-sm font-semibold">{a.title || "Untitled"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.subject_code}
                  {a.batch ? ` · ${a.batch}` : ""} · {a.total_marks} marks
                  {a.due_date ? ` · due ${new Date(a.due_date).toLocaleDateString()}` : ""}
                </p>
                {a.description ? (
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                    {a.description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {a.due_date && new Date(a.due_date) < new Date() ? (
                  <StatusBadge tone="risk">Closed</StatusBadge>
                ) : (
                  <StatusBadge tone="gold">Open</StatusBadge>
                )}
                {a.file_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void openFile(a.file_url as string)}
                  >
                    <Download className="size-3.5" /> File
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" onClick={onViewScripts}>
                  Scripts
                </Button>
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => edit(a)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => void remove(a)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
          {!list.length ? (
            <li className="py-14 text-center text-sm text-muted-foreground">
              <CalendarDays className="mx-auto size-5" />
              <p className="mt-3">No assignments published yet.</p>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
