import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_enrollments",
  title: "List enrollments",
  description:
    "List subject enrollments visible to the signed-in user (students see their own; staff see the academy).",
  inputSchema: {
    subject_code: z.string().trim().min(1).nullable().describe("Optional subject code filter, e.g. '9709'."),
    limit: z.number().int().min(1).max(200).nullable().describe("Maximum rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ subject_code, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("enrollments")
      .select("id,student_id,subject_code,progress,term_fee_paid,fee_amount,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (subject_code) query = query.eq("subject_code", subject_code);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { enrollments: data ?? [] },
        };
  },
});
