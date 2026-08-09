import { useSyncExternalStore } from "react";

export interface FocusTarget {
  /** DOM id of the section to scroll to */
  section?: string;
  /** Tab value to activate (student portal) */
  tab?: string;
  /** Text used to highlight matching rows */
  query?: string;
  ts: number;
}

let current: FocusTarget | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setFocus(target: Omit<FocusTarget, "ts">) {
  current = { ...target, ts: Date.now() };
  listeners.forEach((l) => l());
}

export function useFocus(): FocusTarget | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

/** Case-insensitive contains helper for highlight matching. */
export function matchesFocus(query: string | undefined, ...fields: (string | null | undefined)[]) {
  if (!query) return false;
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}
