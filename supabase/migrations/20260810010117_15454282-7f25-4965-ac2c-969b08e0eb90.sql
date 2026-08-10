CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  batch text NOT NULL DEFAULT '',
  total_marks numeric NOT NULL DEFAULT 100,
  due_date date,
  file_url text,
  file_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments read" ON public.assignments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "assignments staff insert" ON public.assignments
  FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.is_staff(auth.uid()));
CREATE POLICY "assignments owner update" ON public.assignments
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "assignments owner delete" ON public.assignments
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  video_url text,
  notes_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lectures TO authenticated;
GRANT ALL ON public.lectures TO service_role;

ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectures read" ON public.lectures
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lectures staff insert" ON public.lectures
  FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.is_staff(auth.uid()));
CREATE POLICY "lectures owner update" ON public.lectures
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "lectures owner delete" ON public.lectures
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON public.lectures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();