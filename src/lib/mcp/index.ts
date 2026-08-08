import { auth, defineMcp, type AnyToolDefinition } from "@lovable.dev/mcp-js";
import listSubjectsTool from "./tools/list-subjects";
import listEnrollmentsTool from "./tools/list-enrollments";
import listSubmissionsTool from "./tools/list-submissions";
import listQuizAttemptsTool from "./tools/list-quiz-attempts";
import gradeSubmissionTool from "./tools/grade-submission";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "gravity-o-a-portal",
  title: "Gravity O/A Portal",
  version: "0.1.0",
  instructions:
    "Tools for Gravity Institute, a Cambridge O/A Level academy LMS. Read subjects, enrollments, past-paper submissions and quiz attempts, and grade submissions. All data access runs as the signed-in user: students see only their own records, teachers and admins see the academy.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listSubjectsTool,
    listEnrollmentsTool,
    listSubmissionsTool,
    listQuizAttemptsTool,
    gradeSubmissionTool,
  ] as AnyToolDefinition[],
});
