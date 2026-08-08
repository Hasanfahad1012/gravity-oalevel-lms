CREATE TABLE public.mcq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text NOT NULL,
  year integer NOT NULL,
  session text NOT NULL DEFAULT 'May/June',
  paper_variant text NOT NULL DEFAULT '11',
  question_number integer NOT NULL DEFAULT 1,
  question_text_or_image_url text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL DEFAULT 'A',
  explanation_text_or_image text NOT NULL DEFAULT '',
  topic_tag text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcq_questions TO authenticated;
GRANT ALL ON public.mcq_questions TO service_role;

ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mcq read" ON public.mcq_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mcq staff write" ON public.mcq_questions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX mcq_questions_filter_idx ON public.mcq_questions (subject_code, year, paper_variant);

ALTER TABLE public.quiz_attempts
  ALTER COLUMN quiz_id DROP NOT NULL,
  ADD COLUMN subject_code text NOT NULL DEFAULT '',
  ADD COLUMN mode text NOT NULL DEFAULT 'practice',
  ADD COLUMN time_taken_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN answers jsonb NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO public.mcq_questions (subject_code, year, session, paper_variant, question_number, question_text_or_image_url, options, correct_answer, explanation_text_or_image, topic_tag) VALUES
('9702', 2023, 'May/June', '12', 1, 'Which of the following is a base quantity in the SI system?', '["Force","Current","Energy","Pressure"]', 'B', 'Electric current (ampere) is one of the seven SI base quantities. Force, energy and pressure are all derived quantities.', 'Physical quantities & units'),
('9702', 2023, 'May/June', '12', 2, 'A car accelerates uniformly from rest to 20 m/s in 8.0 s. What is its acceleration?', '["1.6 m/s²","2.5 m/s²","4.0 m/s²","160 m/s²"]', 'B', 'a = Δv / Δt = (20 − 0) / 8.0 = 2.5 m/s².', 'Kinematics'),
('9702', 2022, 'Oct/Nov', '11', 3, 'The resistance of a wire is doubled when its length is doubled at constant cross-section. This follows from:', '["R = V/I","R = ρL/A","P = I²R","V = IR"]', 'B', 'Resistivity relation R = ρL/A shows R ∝ L for fixed ρ and A.', 'Current electricity'),
('9702', 2022, 'Oct/Nov', '11', 4, 'Which quantity is a vector?', '["Speed","Distance","Momentum","Mass"]', 'C', 'Momentum has both magnitude and direction, so it is a vector. The others are scalars.', 'Scalars & vectors'),
('9708', 2023, 'May/June', '12', 1, 'The basic economic problem arises because:', '["Governments tax too much","Wants are unlimited but resources are scarce","Prices always rise","Firms seek profit"]', 'B', 'Scarcity relative to unlimited wants forces choice and creates opportunity cost.', 'Basic economic ideas'),
('9708', 2023, 'May/June', '12', 2, 'A rightward shift of the demand curve for coffee could be caused by:', '["A fall in the price of coffee","A rise in the price of tea, a substitute","A rise in coffee production costs","An increase in coffee supply"]', 'B', 'A higher price for a substitute (tea) raises demand for coffee at every price, shifting demand right. A change in coffee''s own price is a movement along the curve.', 'Demand & supply'),
('9708', 2022, 'Oct/Nov', '11', 3, 'If PED for a good is −0.4, a 10% price rise will:', '["Raise total revenue","Lower total revenue","Leave revenue unchanged","Raise quantity demanded"]', 'A', 'Demand is inelastic (|PED| < 1), so quantity falls proportionally less than price rises and total revenue increases.', 'Elasticity'),
('0620', 2023, 'May/June', '12', 1, 'Which particle has no charge?', '["Proton","Neutron","Electron","Hydrogen ion"]', 'B', 'Neutrons are electrically neutral; protons are +1, electrons −1, H⁺ is +1.', 'Atomic structure'),
('0620', 2023, 'May/June', '12', 2, 'What is the pH of a strongly alkaline solution?', '["1","7","9","14"]', 'D', 'Strong alkalis sit at the top of the pH scale, around 13–14. pH 7 is neutral and pH 1 strongly acidic.', 'Acids, bases & salts'),
('0580', 2023, 'May/June', '12', 1, 'Evaluate 3² + 4².', '["12","24","25","49"]', 'C', '3² + 4² = 9 + 16 = 25.', 'Number'),
('0580', 2023, 'May/June', '12', 2, 'Solve 2x + 5 = 17.', '["x = 5","x = 6","x = 7","x = 11"]', 'B', '2x = 17 − 5 = 12, so x = 6.', 'Algebra'),
('0580', 2022, 'Oct/Nov', '11', 3, 'The gradient of the line y = 4 − 3x is:', '["4","3","−3","−4"]', 'C', 'In y = mx + c the gradient m is the coefficient of x, here −3.', 'Coordinate geometry');