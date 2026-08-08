import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_subjects",
  title: "List subjects",
  description: "List the Cambridge O/A Level subjects offered by Gravity Institute.",
  inputSchema: {
    stream: z.string().trim().min(1).nullable().describe("Optional stream filter, e.g. 'O Level' or 'A Level'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ stream }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase.from("subjects").select("code,name,stream,level,papers,blurb").order("code");
    if (stream) query = query.eq("stream", stream);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { subjects: data ?? [] },
        };
  },
});
