import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_submissions",
  title: "List past-paper submissions",
  description:
    "List past-paper submissions visible to the signed-in user, optionally filtered by grading status.",
  inputSchema: {
    status: z
      .enum(["pending", "grading", "graded", "returned"])
      .nullable()
      .describe("Optional grading status filter."),
    limit: z.number().int().min(1).max(200).nullable().describe("Maximum rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("submissions")
      .select(
        "id,student_id,title,paper_code,subject_code,status,score,max_score,examiner_feedback,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { submissions: data ?? [] },
        };
  },
});
