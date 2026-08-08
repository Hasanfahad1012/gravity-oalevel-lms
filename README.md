# Gravity O/A Portal

Build a production-grade, highly sophisticated Learning Management System (LMS) web application customized specifically for Cambridge O/A Level academies (featuring subjects like Accounting 7707, Economics 9708, Business 9609, and Mathematics). 

The design must look like an elite, premium EdTech platform (think Stripe meets Masterclass or Linear): ultra-clean typography, generous white space, subtle glassmorphism borders, sophisticated neutral tones, micro-interactions, and completely human-designed UI layouts. Avoid generic template looks.

Core Architectural Requirements:

1. Global Navigation & Three-Way Role Switcher:

   - Provide a seamless role-switching header/switcher allowing instant toggling between three distinct portals:

     a) Student Portal

     b) Teacher Portal

     c) Admin Portal (with full academy control & analytics)

2. Student Portal:

   - Syllabus-Aligned Course Structure: Categorized strictly by O/A Level streams with modules broken down into "Topic Chapters", "Topical Past Papers", and "Mark Scheme Walkthroughs".

   - Assignments Section: View pending past-paper tasks and upload work for feedback.

   - Quizzes Section: Interactive multi-question topical quizzes with timers and instant scoring.

3. Teacher Portal:

   - Assignment & Essay Grading Queue: Interface to review student submissions, input marks, and leave detailed examiner-style annotations.

   - Class Management: Track student progress across specific O/A level sub-topics.

4. Admin Portal & Deep Insights:

   - Executive Analytics Dashboard: High-level KPI cards tracking total active O/A Level batch enrollments, teacher grading throughput, and system-wide engagement charts.

   - Financial / Enrollment Overview: Management metrics for student intakes per subject stream.

   - Student Performance Heatmap / Risk Table: Identifying students falling behind on specific papers or subjects.

5. UI/UX Polish:

   - Use Tailwind CSS with custom styling hooks, crisp status badges, polished tooltips, and smooth state transitions to ensure it looks completely custom-coded and professional.

Connect this project to Supabase for backend database storage, user authentication, and Role-Based Access Control (RBAC).

Please implement the following architecture:

1. AUTHENTICATION & RBAC ROLES

- Enable email/password authentication using Supabase Auth.

- Create a `profiles` table linked to `auth.users` containing: `id`, `email`, `full_name`, `role` (enum: 'student', 'teacher', 'admin'), and `created_at`.

- Set up a Supabase database trigger that automatically inserts a row into `profiles` whenever a new user signs up.

- Restrict access dynamically based on role:

  - Students can only view their own enrollments, submitted assignments, quiz results, and syllabus materials.

  - Teachers can view all students in their assigned subjects, submit marks/annotations in the grading queue, and update class mastery data.

  - Admins have full read/write access across all tables, financial metrics, and executive charts.

- Implement Row Level Security (RLS) policies on all tables to enforce these role permissions.

2. DATABASE TABLES & SCHEMA

- Create a `subjects` table (code e.g., '9709', name, stream).

- Create a `submissions` table (`id`, `student_id`, `paper_code`, `file_url`, `score`, `examiner_feedback`, `status`).

- Create an `enrollments` table (`id`, `student_id`, `subject_code`, `term_fee_paid`).

- Create a `quizzes` table (`id`, `subject_code`, `title`, `duration_minutes`, `questions_json`).

3. FILE STORAGE

- Set up a public/authenticated Supabase Storage bucket named `past-paper-submissions` for PDF/image uploads with RLS restricting students to upload only to their own folder (`/students/{user_id}/`).

4. UI INTEGRATION

- Connect the header role switcher to the real user profile state fetched from Supabase.

- Add Login/Signup modals or pages so users can sign in as a Student, Teacher, or Admin.


name the lms Gravity Institute as shown in pic

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/af112f15-c47e-4677-9b5f-e192f6b511b0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
