import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
  ListChecks,
  RefreshCw,
  Search,
  Settings,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MCQ_SUBJECTS } from "@/components/McqPractice";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { setFocus } from "@/lib/focus";

export function CommandBarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass flex items-center gap-2 rounded-full py-1.5 pr-2 pl-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
    >
      <Search className="size-3.5" />
      <span className="hidden lg:inline">Search or jump to…</span>
      <kbd className="rounded-md border bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] tracking-wide">
        ⌘K
      </kbd>
    </button>
  );
}

export function CommandBar({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isStaff = roles.includes("teacher") || roles.includes("admin");
  const [query, setQuery] = useState("");

  const people = useQuery({
    queryKey: ["all-profiles"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,email");
      if (error) throw error;
      return data;
    },
  });

  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const fees = useQuery({
    queryKey: ["fee_records"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_records")
        .select("*")
        .order("synced_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const subjectList = useMemo(() => {
    const map = new Map<string, { code: string; name: string; level: string }>();
    for (const s of MCQ_SUBJECTS) map.set(s.code, s);
    for (const s of subjects.data ?? [])
      map.set(s.code, { code: s.code, name: s.name, level: s.level });
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [subjects.data]);

  function go(to: string, focus?: { section?: string; tab?: string; query?: string }) {
    onOpenChange(false);
    setQuery("");
    if (focus) setFocus(focus);
    void navigate({ to });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search students, subjects, fee records or actions…"
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem
            value="sync fee sheet spreadsheet refresh"
            onSelect={() => go("/admin", { section: "fee-sync" })}
          >
            <RefreshCw className="size-3.5" /> Sync fee sheet
          </CommandItem>
          <CommandItem
            value="view risk register at risk students"
            onSelect={() => go("/admin", { section: "risk-register" })}
          >
            <AlertTriangle className="size-3.5" /> View risk register
          </CommandItem>
          <CommandItem
            value="student payment status fee ledger"
            onSelect={() => go("/admin", { section: "fee-ledger" })}
          >
            <Banknote className="size-3.5" /> Open fee ledger
          </CommandItem>
          <CommandItem
            value="switch to mcq practice mode quizzes"
            onSelect={() => go("/student", { tab: "mcq" })}
          >
            <ListChecks className="size-3.5" /> Switch to MCQ practice mode
          </CommandItem>
          <CommandItem
            value="open settings spreadsheet connection"
            onSelect={() => go("/admin", { section: "fee-sync" })}
          >
            <Settings className="size-3.5" /> Open settings
          </CommandItem>
        </CommandGroup>

        {isStaff ? (
          <CommandGroup heading="Students">
            {(people.data ?? []).slice(0, 200).map((p) => (
              <CommandItem
                key={p.id}
                value={`student ${p.full_name ?? ""} ${p.email}`}
                onSelect={() =>
                  go("/admin", {
                    section: "risk-register",
                    query: p.full_name || p.email,
                  })
                }
              >
                <User className="size-3.5" />
                <span className="flex-1 truncate">{p.full_name || p.email}</span>
                <span className="text-xs text-muted-foreground">{p.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Subjects & papers">
          {subjectList.map((s) => (
            <CommandItem
              key={s.code}
              value={`subject ${s.code} ${s.name} ${s.level} mcq paper`}
              onSelect={() => go("/student", { tab: "mcq", query: s.code })}
            >
              <ListChecks className="size-3.5" />
              <span className="flex-1 truncate">
                {s.code} · {s.name}
              </span>
              <span className="text-xs text-muted-foreground">{s.level}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {isStaff ? (
          <CommandGroup heading="Fee records">
            {(fees.data ?? []).slice(0, 200).map((f) => (
              <CommandItem
                key={f.id}
                value={`fee ${f.student_name} ${f.student_email} ${f.subject_code} ${f.term} ${f.status} ${f.status === "paid" ? "settled" : "pending fees outstanding"}`}
                onSelect={() =>
                  go("/admin", {
                    section: "fee-ledger",
                    query: f.student_name || f.student_email,
                  })
                }
              >
                <Banknote className="size-3.5" />
                <span className="flex-1 truncate">{f.student_name || f.student_email}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {f.subject_code || "—"} · {f.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
