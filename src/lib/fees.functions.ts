import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { csvUrlCandidates, mapFeeRows, parseCsv } from "@/lib/fee-csv";

type Settings = {
  sheet_url: string | null;
  last_synced_at: string | null;
  last_row_count: number;
  last_error: string | null;
};

async function ensureAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Only admins can manage the fee spreadsheet connection.");
}

export const getFeeSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fee_settings")
      .select("sheet_url,last_synced_at,last_row_count,last_error")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? {
      sheet_url: null,
      last_synced_at: null,
      last_row_count: 0,
      last_error: null,
    }) as Settings;
  });

export const saveFeeSheetUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sheetUrl: string }) => {
    const url = (input?.sheetUrl ?? "").trim();
    if (url && !/^https:\/\//i.test(url)) throw new Error("The link must start with https://");
    if (url.length > 2000) throw new Error("That link is too long.");
    return { sheetUrl: url };
  })
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase
      .from("fee_settings")
      .update({ sheet_url: data.sheetUrl || null, last_error: null })
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncFeeSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);

    const { data: settings, error: settingsError } = await context.supabase
      .from("fee_settings")
      .select("sheet_url")
      .limit(1)
      .maybeSingle();
    if (settingsError) throw new Error(settingsError.message);

    const sheetUrl: string | null = settings?.sheet_url ?? null;
    if (!sheetUrl) throw new Error("No spreadsheet link is configured yet.");

    const recordFailure = async (message: string) => {
      await context.supabase
        .from("fee_settings")
        .update({ last_error: message })
        .eq("singleton", true);
      throw new Error(message);
    };

    let text = "";
    let lastProblem = "";
    for (const candidate of csvUrlCandidates(sheetUrl)) {
      try {
        const res = await fetch(candidate, {
          headers: { Accept: "text/csv,application/json,text/plain,*/*" },
          redirect: "follow",
        });
        if (!res.ok) {
          lastProblem = `returned ${res.status}`;
          continue;
        }
        const body = await res.text();
        if (body.trimStart().startsWith("<")) {
          lastProblem = "returned a sign-in page instead of CSV";
          continue;
        }
        text = body;
        break;
      } catch (e) {
        lastProblem = (e as Error).message || "network error";
      }
    }

    if (!text) {
      return await recordFailure(
        `Google would not share this sheet publicly (${lastProblem}). Open the sheet, then either: File → Share → Publish to web → pick the tab → Comma-separated values (.csv) → Publish and paste that link, or Share → General access → “Anyone with the link” → Viewer.`,
      );
    }

    const { rows } = mapFeeRows(parseCsv(text));
    if (!rows.length) {
      return await recordFailure(
        "No fee rows were found. The sheet needs a header row with columns such as Student Name, Email, Subject Code, Amount and Status.",
      );
    }

    const syncedAt = new Date().toISOString();
    const { error: upsertError } = await context.supabase
      .from("fee_records")
      .upsert(
        rows.map((r) => ({ ...r, synced_at: syncedAt })),
        { onConflict: "row_key" },
      );
    if (upsertError) return await recordFailure(upsertError.message);

    // Drop rows that no longer exist in the sheet.
    const { error: deleteError } = await context.supabase
      .from("fee_records")
      .delete()
      .lt("synced_at", syncedAt);
    if (deleteError) return await recordFailure(deleteError.message);

    const { error: metaError } = await context.supabase
      .from("fee_settings")
      .update({ last_synced_at: syncedAt, last_row_count: rows.length, last_error: null })
      .eq("singleton", true);
    if (metaError) throw new Error(metaError.message);

    return { rowCount: rows.length, syncedAt };
  });
