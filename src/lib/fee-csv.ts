/** Minimal RFC-4180 CSV parser (handles quotes, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else field += c ?? "";
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export type FeeRow = {
  row_key: string;
  student_name: string;
  student_email: string;
  subject_code: string;
  amount: number;
  currency: string;
  status: string;
  term: string;
  due_date: string | null;
  paid_on: string | null;
  invoice_ref: string;
};

const ALIASES: Record<keyof Omit<FeeRow, "row_key">, string[]> = {
  student_name: ["student name", "student", "name", "full name"],
  student_email: ["student email", "email", "e-mail", "student e-mail"],
  subject_code: ["subject code", "subject", "code", "stream"],
  amount: ["amount", "fee", "fee amount", "amount due", "total"],
  currency: ["currency", "ccy"],
  status: ["status", "payment status", "paid"],
  term: ["term", "session", "batch"],
  due_date: ["due date", "due"],
  paid_on: ["paid on", "paid date", "payment date", "date paid"],
  invoice_ref: ["invoice ref", "invoice", "invoice no", "reference", "ref"],
};

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeStatus(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (!v) return "pending";
  if (["paid", "settled", "yes", "true", "complete", "completed", "cleared"].includes(v))
    return "paid";
  if (["partial", "part", "partially paid", "installment"].includes(v)) return "partial";
  if (["overdue", "late", "defaulted"].includes(v)) return "overdue";
  return "pending";
}

function toDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  if (iso) return iso;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function toAmount(raw: string): number {
  const n = Number(raw.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Map a parsed CSV grid into fee rows using flexible header names. */
export function mapFeeRows(grid: string[][]): { rows: FeeRow[]; headers: string[] } {
  if (!grid.length) return { rows: [], headers: [] };
  const headers = (grid[0] ?? []).map(normalizeHeader);
  const indexOf = (key: keyof typeof ALIASES) => {
    for (const alias of ALIASES[key]) {
      const i = headers.indexOf(alias);
      if (i !== -1) return i;
    }
    return -1;
  };
  const cols = {
    student_name: indexOf("student_name"),
    student_email: indexOf("student_email"),
    subject_code: indexOf("subject_code"),
    amount: indexOf("amount"),
    currency: indexOf("currency"),
    status: indexOf("status"),
    term: indexOf("term"),
    due_date: indexOf("due_date"),
    paid_on: indexOf("paid_on"),
    invoice_ref: indexOf("invoice_ref"),
  };

  const at = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const seen = new Set<string>();
  const rows: FeeRow[] = [];

  grid.slice(1).forEach((r, idx) => {
    const email = at(r, cols.student_email).toLowerCase();
    const name = at(r, cols.student_name);
    const subject = at(r, cols.subject_code).toUpperCase();
    const invoice = at(r, cols.invoice_ref);
    if (!email && !name && !invoice) return;

    let key = invoice || `${email || name}|${subject}|${at(r, cols.term)}`;
    if (seen.has(key)) key = `${key}#${idx}`;
    seen.add(key);

    rows.push({
      row_key: key,
      student_name: name,
      student_email: email,
      subject_code: subject,
      amount: toAmount(at(r, cols.amount)),
      currency: at(r, cols.currency).toUpperCase() || "PKR",
      status: normalizeStatus(at(r, cols.status)),
      term: at(r, cols.term),
      due_date: toDate(at(r, cols.due_date)),
      paid_on: toDate(at(r, cols.paid_on)),
      invoice_ref: invoice,
    });
  });

  return { rows, headers };
}

/**
 * Accepts a Google Sheets share link, a published CSV link, or any direct
 * CSV/webhook URL, and returns a URL that responds with CSV.
 */
export function toCsvUrl(input: string): string {
  const url = input.trim();
  const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch && !url.includes("output=csv") && !url.includes("/pub?")) {
    const id = sheetMatch[1];
    const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }
  return url;
}
