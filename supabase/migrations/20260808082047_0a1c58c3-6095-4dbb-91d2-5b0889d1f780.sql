CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.fee_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_url text,
  last_synced_at timestamptz,
  last_row_count integer NOT NULL DEFAULT 0,
  last_error text,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_settings TO authenticated;
GRANT ALL ON public.fee_settings TO service_role;
ALTER TABLE public.fee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view fee settings" ON public.fee_settings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins can insert fee settings" ON public.fee_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update fee settings" ON public.fee_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_key text NOT NULL UNIQUE,
  student_name text NOT NULL DEFAULT '',
  student_email text NOT NULL DEFAULT '',
  subject_code text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PKR',
  status text NOT NULL DEFAULT 'pending',
  term text NOT NULL DEFAULT '',
  due_date date,
  paid_on date,
  invoice_ref text NOT NULL DEFAULT '',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fee_records_subject_code_idx ON public.fee_records (subject_code);
CREATE INDEX fee_records_status_idx ON public.fee_records (status);
CREATE INDEX fee_records_student_email_idx ON public.fee_records (student_email);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_records TO authenticated;
GRANT ALL ON public.fee_records TO service_role;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view fee records" ON public.fee_records
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Students can view their own fee records" ON public.fee_records
  FOR SELECT TO authenticated
  USING (lower(student_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
CREATE POLICY "Admins can write fee records" ON public.fee_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_fee_settings_updated_at BEFORE UPDATE ON public.fee_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fee_records_updated_at BEFORE UPDATE ON public.fee_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.fee_settings (singleton) VALUES (true);