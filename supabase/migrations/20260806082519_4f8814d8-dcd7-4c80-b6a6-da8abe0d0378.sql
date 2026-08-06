-- ROLES
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('teacher','admin'));
$$;

CREATE POLICY "profiles readable by self and staff" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles updatable by self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles admin update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles readable by self and staff" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "roles managed by admin" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, COALESCE(NEW.email,''), COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    requested := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  EXCEPTION WHEN others THEN
    requested := 'student';
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, requested)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SUBJECTS
CREATE TABLE public.subjects (
  code text PRIMARY KEY,
  name text NOT NULL,
  stream text NOT NULL,
  level text NOT NULL,
  papers int NOT NULL DEFAULT 4,
  blurb text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO authenticated, anon;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects public read" ON public.subjects FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "subjects admin write" ON public.subjects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ENROLLMENTS
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code text NOT NULL REFERENCES public.subjects(code) ON DELETE CASCADE,
  term_fee_paid boolean NOT NULL DEFAULT false,
  fee_amount numeric NOT NULL DEFAULT 0,
  progress int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments read" ON public.enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "enrollments self insert" ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "enrollments admin write" ON public.enrollments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "enrollments delete" ON public.enrollments FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- SUBMISSIONS
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code text REFERENCES public.subjects(code) ON DELETE SET NULL,
  paper_code text NOT NULL,
  title text NOT NULL DEFAULT '',
  file_url text,
  score numeric,
  max_score numeric NOT NULL DEFAULT 100,
  examiner_feedback text,
  status text NOT NULL DEFAULT 'pending',
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions read" ON public.submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "submissions student insert" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "submissions staff grade" ON public.submissions FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "submissions admin delete" ON public.submissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- QUIZZES
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text NOT NULL REFERENCES public.subjects(code) ON DELETE CASCADE,
  title text NOT NULL,
  topic text NOT NULL DEFAULT '',
  duration_minutes int NOT NULL DEFAULT 15,
  questions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes read" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "quizzes staff write" ON public.quizzes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts read" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "attempts self insert" ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- SEED
INSERT INTO public.subjects (code, name, stream, level, papers, blurb) VALUES
('7707','Accounting','Commerce','O Level',2,'Double entry, control accounts, final accounts and ratio analysis.'),
('9708','Economics','Commerce','A Level',4,'Micro, macro, market failure and international economics.'),
('9609','Business','Commerce','A Level',3,'Strategy, marketing, HR, operations and finance case studies.'),
('9709','Mathematics','Sciences','A Level',6,'Pure 1 & 3, Mechanics and Probability & Statistics.'),
('0580','Mathematics','Sciences','O Level',4,'Core and extended IGCSE mathematics.'),
('9706','Accounting','Commerce','A Level',4,'Financial and cost accounting for AS & A2.');

INSERT INTO public.quizzes (subject_code, title, topic, duration_minutes, questions_json) VALUES
('7707','Control Accounts Rapid Fire','Control Accounts',10,'[
 {"q":"A sales ledger control account debit balance represents:","options":["Amount owed to suppliers","Amount owed by customers","Cash at bank","Capital introduced"],"a":1},
 {"q":"Which entry appears on the credit side of a purchases ledger control account?","options":["Credit purchases","Discount received","Returns outwards","Payments to suppliers"],"a":0},
 {"q":"A contra entry between the two control accounts is recorded as:","options":["Dr PLCA, Cr SLCA","Dr SLCA, Cr PLCA","Dr Bank, Cr SLCA","Dr PLCA, Cr Bank"],"a":0},
 {"q":"Bad debts written off are entered in the SLCA on the:","options":["Debit side","Credit side","Both sides","Neither side"],"a":1}
]'::jsonb),
('9708','Elasticity & Market Failure','Price Elasticity',15,'[
 {"q":"PED for a good with many close substitutes is likely to be:","options":["Perfectly inelastic","Inelastic","Elastic","Unitary"],"a":2},
 {"q":"A negative externality in consumption means MSB is:","options":["Above MPB","Below MPB","Equal to MPB","Zero"],"a":1},
 {"q":"An indirect tax on a demerit good aims to:","options":["Raise MPC to MSC","Lower supply arbitrarily","Increase consumer surplus","Subsidise producers"],"a":0},
 {"q":"Income elasticity of demand for an inferior good is:","options":["Positive","Negative","Zero","Infinite"],"a":1}
]'::jsonb),
('9609','Marketing Strategy Drill','Marketing',12,'[
 {"q":"Ansoff''s matrix strategy for new products in existing markets:","options":["Market penetration","Product development","Market development","Diversification"],"a":1},
 {"q":"A high market share, low growth product in the BCG matrix is a:","options":["Star","Cash cow","Question mark","Dog"],"a":1},
 {"q":"Price skimming is most appropriate when:","options":["Demand is highly elastic","The product is innovative","Competition is intense","Costs are rising"],"a":1}
]'::jsonb),
('9709','Pure 1: Differentiation','Differentiation',15,'[
 {"q":"d/dx of 3x^4 is:","options":["12x^3","3x^3","12x^4","4x^3"],"a":0},
 {"q":"The gradient of y = x^2 at x = 3 is:","options":["3","6","9","12"],"a":1},
 {"q":"A stationary point occurs where:","options":["y = 0","dy/dx = 0","d2y/dx2 = 0","x = 0"],"a":1},
 {"q":"d/dx of sin(2x) is:","options":["cos(2x)","2cos(2x)","-2cos(2x)","2sin(2x)"],"a":1}
]'::jsonb);