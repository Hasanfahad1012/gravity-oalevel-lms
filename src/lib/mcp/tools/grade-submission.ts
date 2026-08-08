import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "grade_submission",
  title: "Grade a submission",
  description:
    "Record a mark and examiner feedback on a past-paper submission. Requires teacher or admin permissions.",
  inputSchema: {
    submission_id: z.string().uuid().describe("The submission id to grade."),
    score: z.number().min(0).describe("Marks awarded."),
    examiner_feedback: z.string().trim().min(1).describe("Examiner-style annotations for the student."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ submission_id, score, examiner_feedback }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("submissions")
      .update({
        score,
        examiner_feedback,
        status: "graded",
        graded_by: ctx.getUserId() ?? null,
      })
      .eq("id", submission_id)
      .select("id,title,paper_code,status,score,max_score,examiner_feedback");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0)
      return {
        content: [
          { type: "text", text: "No submission was updated — it may not exist or you may lack permission." },
        ],
        isError: true,
      };
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { submission: data[0] },
    };
  },
});
