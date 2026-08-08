import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getFeeSettings, saveFeeSheetUrl, syncFeeSheet } from "@/lib/fees.functions";

function relative(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function FeeSyncBar({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getFeeSettings);
  const runSync = useServerFn(syncFeeSheet);
  const saveUrl = useServerFn(saveFeeSheetUrl);

  const settings = useQuery({
    queryKey: ["fee-settings"],
    queryFn: () => fetchSettings(),
    refetchInterval: 60_000,
  });

  const [urlDraft, setUrlDraft] = useState("");
  const [open, setOpen] = useState(false);

  const sync = useMutation({
    mutationFn: () => runSync(),
    onSuccess: (res) => {
      toast.success(`Synced ${res.rowCount} fee rows from the spreadsheet.`);
      void qc.invalidateQueries({ queryKey: ["fee-records"] });
      void qc.invalidateQueries({ queryKey: ["fee-settings"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      void qc.invalidateQueries({ queryKey: ["fee-settings"] });
    },
  });

  const save = useMutation({
    mutationFn: (sheetUrl: string) => saveUrl({ data: { sheetUrl } }),
    onSuccess: async () => {
      toast.success("Spreadsheet link saved.");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["fee-settings"] });
      sync.mutate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = settings.data;
  const connected = Boolean(s?.sheet_url);

  return (
    <div className="plate mt-8 flex flex-wrap items-center gap-4 p-5">
      <div className="min-w-[240px] flex-1">
        <p className="eyebrow">Live fee feed</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {connected ? (
            <>
              Connected to a spreadsheet · last synced{" "}
              <span className="font-medium text-foreground">{relative(s?.last_synced_at ?? null)}</span>
              {s?.last_row_count ? ` · ${s.last_row_count} rows` : ""}
            </>
          ) : (
            "No spreadsheet connected yet — paste a Google Sheets or CSV link to go live."
          )}
        </p>
        {s?.last_error ? (
          <p className="mt-1.5 text-xs text-destructive">{s.last_error}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SetupGuide />
        {isAdmin ? (
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (v) setUrlDraft(s?.sheet_url ?? "");
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Link2 className="size-4" /> {connected ? "Change link" : "Connect sheet"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Spreadsheet link</DialogTitle>
                <DialogDescription>
                  Paste a Google Sheets share link, a “Publish to web” CSV link, or any webhook URL
                  that returns CSV.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={save.isPending} onClick={() => save.mutate(urlDraft)}>
                  {save.isPending ? "Saving…" : "Save & sync"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
        <Button
          size="sm"
          disabled={!isAdmin || !connected || sync.isPending}
          onClick={() => sync.mutate()}
        >
          <RefreshCw className={sync.isPending ? "size-4 animate-spin" : "size-4"} />
          {sync.isPending ? "Syncing…" : "Sync Excel / Refresh data"}
        </Button>
      </div>
    </div>
  );
}

function SetupGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BookOpen className="size-4" /> Setup guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect your fee spreadsheet</DialogTitle>
          <DialogDescription>
            Takes about two minutes. No technical knowledge needed.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 text-sm">
          {[
            {
              t: "Prepare the sheet",
              d: "Put the fee data in the first tab with a header row. Recognised column names: Student Name, Student Email, Subject Code, Amount, Currency, Status, Term, Due Date, Paid On, Invoice Ref. Extra columns are ignored.",
            },
            {
              t: "Use Paid / Pending / Partial / Overdue in the Status column",
              d: "“Yes”, “Settled” and “Cleared” also count as paid. Anything unrecognised is treated as pending.",
            },
            {
              t: "Publish the sheet",
              d: "In Google Sheets: File → Share → Publish to web → choose the tab → Comma-separated values (.csv) → Publish. Copy the link. A normal “anyone with the link can view” share link also works.",
            },
            {
              t: "Paste it here",
              d: "Click “Connect sheet” above, paste the link and press Save & sync. Excel users can upload the file to Google Drive and open it as a Sheet, or point this at any webhook (Make.com, Zapier, Apps Script) that returns CSV.",
            },
            {
              t: "Keep it fresh",
              d: "Press “Sync Excel / Refresh data” after edits. The dashboard also re-checks automatically while it is open, and rows removed from the sheet are removed here.",
            },
          ].map((step, i) => (
            <li key={step.t} className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{step.t}</p>
                <p className="mt-1 text-muted-foreground">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
          Example header row:
          <br />
          <code>Student Name, Student Email, Subject Code, Amount, Currency, Status, Term, Due Date, Paid On, Invoice Ref</code>
        </div>
      </DialogContent>
    </Dialog>
  );
}
