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
  student_name: ["student name", "student", "name", "full name", "student full name"],
  student_email: ["student email", "email", "e mail", "student e mail", "mail"],
  subject_code: ["subject code", "subject", "course", "stream", "code", "class"],
  amount: [
    "amount",
    "fee",
    "fee amount",
    "total fee",
    "billed amount",
    "pkr",
    "amount due",
    "total",
    "fees",
  ],
  currency: ["currency", "ccy"],
  status: ["status", "payment status", "fee status", "state", "paid"],
  term: ["term", "batch", "session", "month"],
  due_date: ["due date", "due"],
  paid_on: ["paid on", "payment date", "date", "paid date", "date paid"],
  invoice_ref: ["invoice ref", "invoice", "invoice no", "reference", "ref"],
};

function normalizeHeader(h: string) {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PAID_WORDS = [
  "paid",
  "settled",
  "cleared",
  "completed",
  "complete",
  "done",
  "yes",
  "true",
  "1",
  "y",
  "fully paid",
  "payment received",
  "received",
];

function normalizeStatus(raw: string, paidOn: string | null): string {
  const v = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!v) return paidOn ? "paid" : "pending";
  if (PAID_WORDS.includes(v)) return "paid";
  if (["partial", "part", "partially paid", "installment", "instalment", "half"].includes(v))
    return "partial";
  if (["overdue", "late", "defaulted", "default"].includes(v)) return "overdue";
  if (["unpaid", "pending", "due", "no", "false", "0", "not paid"].includes(v)) return "pending";
  return paidOn ? "paid" : "pending";
}

function toDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  // d/m/y or m/d/y with - . or /
  const parts = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (parts) {
    let [, a, b, y] = parts as unknown as [string, string, string, string];
    let day = Number(a);
    let month = Number(b);
    if (day > 12 && month <= 12) {
      // already d/m
    } else if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    let year = Number(y);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** "PKR 15,000", "Rs. 15000/-", "$1,250.50" → number */
function toAmount(raw: string): number {
  let v = raw.trim().toLowerCase();
  if (!v) return 0;
  v = v
    .replace(/pkr|rs\.?|usd|gbp|eur|aed|inr|\$|£|€|₨|₹/g, "")
    .replace(/\/-|\/=/g, "")
    .replace(/[\s'`]/g, "");
  const negative = /^\(.*\)$/.test(v) || v.startsWith("-");
  v = v.replace(/[()]/g, "");
  // Treat commas as thousand separators unless used as a decimal comma.
  if (/,\d{1,2}$/.test(v) && !/\.\d/.test(v)) v = v.replace(/,/g, ".");
  else v = v.replace(/,/g, "");
  const match = v.match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  const n = Number(match[0]);
  if (!Number.isFinite(n)) return 0;
  return negative ? -Math.abs(n) : n;
}

/** Guess currency from a raw amount cell when no currency column exists. */
function currencyFromAmount(raw: string): string | null {
  const v = raw.toLowerCase();
  if (/\$|usd/.test(v)) return "USD";
  if (/£|gbp/.test(v)) return "GBP";
  if (/€|eur/.test(v)) return "EUR";
  if (/pkr|rs\.?|₨/.test(v)) return "PKR";
  if (/₹|inr/.test(v)) return "INR";
  return null;
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

    const rawAmount = at(r, cols.amount);
    const paidOn = toDate(at(r, cols.paid_on));

    rows.push({
      row_key: key,
      student_name: name,
      student_email: email,
      subject_code: subject,
      amount: toAmount(rawAmount),
      currency:
        at(r, cols.currency).toUpperCase() || currencyFromAmount(rawAmount) || "PKR",
      status: normalizeStatus(at(r, cols.status), paidOn),
      term: at(r, cols.term),
      due_date: toDate(at(r, cols.due_date)),
      paid_on: paidOn,
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
  return csvUrlCandidates(input)[0] ?? input.trim();
}

/**
 * Ordered list of URLs to try. Google serves published sheets from several
 * endpoints; a plain /edit share link 401s unless one of these is used.
 */
export function csvUrlCandidates(input: string): string[] {
  const url = input.trim();
  const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/);
  if (!sheetMatch) return [url];

  const id = sheetMatch[1];
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";

  if (url.includes("output=csv") || url.includes("format=csv")) return [url];

  // /d/e/<id>/... links are "publish to web" ids and use the pub endpoint.
  if (/\/spreadsheets\/d\/e\//.test(url)) {
    return [
      `https://docs.google.com/spreadsheets/d/e/${id}/pub?gid=${gid}&single=true&output=csv`,
      `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv`,
    ];
  }

  return [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${id}/pub?gid=${gid}&single=true&output=csv`,
  ];
}
