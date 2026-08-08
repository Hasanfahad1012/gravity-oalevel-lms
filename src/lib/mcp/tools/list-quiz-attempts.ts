import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_quiz_attempts",
  title: "List quiz attempts",
  description: "List topical quiz attempts and scores visible to the signed-in user.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).nullable().describe("Maximum rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id,quiz_id,student_id,score,total,created_at,quizzes(title,subject_code,topic)")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { attempts: data ?? [] },
        };
  },
});
