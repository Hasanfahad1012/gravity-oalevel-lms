import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Film, Loader2, PlayCircle, Plus, Trash2, UploadCloud, X } from "lucide-react";
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

interface LectureRow {
  id: string;
  teacher_id: string;
  subject_code: string;
  topic: string;
  title: string;
  notes: string;
  video_url: string | null;
  notes_url: string | null;
  created_at: string;
}

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

const blank = { title: "", subject_code: "9702", topic: "", notes: "", video_url: "" };

export function LecturesHub() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ ...blank });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [playing, setPlaying] = useState<LectureRow | null>(null);

  const lectures = useQuery({
    queryKey: ["lectures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lectures")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LectureRow[];
    },
  });

  const list = lectures.data ?? [];
  const subjects = useMemo(
    () => Array.from(new Set(list.map((l) => l.subject_code).filter(Boolean))).sort(),
    [list],
  );
  const visible = list.filter((l) => filter === "all" || l.subject_code === filter);

  function pick(f: File | null | undefined) {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("Choose a video file, or paste a YouTube/Vimeo link instead.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Recording is larger than 20MB — host it on YouTube/Vimeo and paste the link.");
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Give the lecture a title.");
      return;
    }
    if (!form.video_url.trim() && !file) {
      toast.error("Add a video link or upload a recording.");
      return;
    }
    setSaving(true);
    try {
      let video = form.video_url.trim();
      if (file) {
        const path = `lectures/${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("teaching-resources")
          .upload(path, file);
        if (upErr) throw upErr;
        video = `storage:${path}`;
      }
      const { error } = await supabase.from("lectures").insert({
        teacher_id: user.id,
        subject_code: form.subject_code,
        topic: form.topic.trim(),
        title: form.title.trim(),
        notes: form.notes.trim(),
        video_url: video,
      });
      if (error) throw error;
      toast.success("Lecture shared with students");
      setForm({ ...blank });
      setFile(null);
      void qc.invalidateQueries({ queryKey: ["lectures"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save lecture");
    } finally {
      setSaving(false);
    }
  }

  async function play(l: LectureRow) {
    const url = l.video_url ?? "";
    if (url.startsWith("storage:")) {
      const { data, error } = await supabase.storage
        .from("teaching-resources")
        .createSignedUrl(url.slice(8), 600);
      if (error || !data) {
        toast.error("Could not open recording");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener");
      return;
    }
    setPlaying(l);
  }

  async function remove(l: LectureRow) {
    const { error } = await supabase.from("lectures").delete().eq("id", l.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (l.video_url?.startsWith("storage:")) {
      void supabase.storage.from("teaching-resources").remove([l.video_url.slice(8)]);
    }
    toast.success("Lecture removed");
    void qc.invalidateQueries({ queryKey: ["lectures"] });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="plate h-fit p-6">
          <SectionHeading eyebrow="New lecture" title="Share a recording" />

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="l-title">Lecture title</Label>
              <Input
                id="l-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Elasticity of demand — worked examples"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject tag</Label>
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
                <Label htmlFor="l-topic">Topic name</Label>
                <Input
                  id="l-topic"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="Price elasticity"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="l-url">Video URL (YouTube / Vimeo)</Label>
              <Input
                id="l-url"
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://youtu.be/..."
                disabled={!!file}
              />
            </div>

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
                "cursor-pointer rounded-xl border border-dashed px-5 py-6 text-center transition-colors",
                dragging ? "border-gold bg-gold-soft/50" : "hover:bg-muted/50",
              )}
            >
              <UploadCloud className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {file ? file.name : "…or upload a recording"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">MP4 / WebM · up to 20MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>
            {file ? (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" /> Remove selected recording
              </button>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="l-notes">Summary / notes</Label>
              <Textarea
                id="l-notes"
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Covers PED formula, determinants and the total revenue test."
              />
            </div>

            <Button className="w-full" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Publish lecture
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <SectionHeading
            eyebrow="Gallery"
            title="Lectures & videos"
            action={
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {visible.map((l) => (
              <article key={l.id} className="lift plate overflow-hidden">
                <button
                  onClick={() => void play(l)}
                  className="flex aspect-video w-full items-center justify-center bg-muted/70 transition-colors hover:bg-muted"
                >
                  <PlayCircle className="size-9 text-muted-foreground" />
                </button>
                <div className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="gold">{l.subject_code}</StatusBadge>
                    {l.topic ? (
                      <span className="text-xs text-muted-foreground">{l.topic}</span>
                    ) : null}
                  </div>
                  <h3 className="text-sm font-semibold">{l.title}</h3>
                  {l.notes ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {l.notes}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete lecture"
                      onClick={() => void remove(l)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {!visible.length ? (
              <div className="plate col-span-full py-14 text-center text-sm text-muted-foreground">
                <Film className="mx-auto size-5" />
                <p className="mt-3">No lectures in this subject yet.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {playing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-6"
          onClick={() => setPlaying(null)}
        >
          <div
            className="plate w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm font-semibold">{playing.title}</p>
              <Button variant="ghost" size="icon" onClick={() => setPlaying(null)}>
                <X className="size-4" />
              </Button>
            </div>
            {embedUrl(playing.video_url ?? "") ? (
              <iframe
                title={playing.title}
                src={embedUrl(playing.video_url ?? "") as string}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="p-8 text-center text-sm">
                <a
                  className="underline"
                  href={playing.video_url ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open lecture link
                </a>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
