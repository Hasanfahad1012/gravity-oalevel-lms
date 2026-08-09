WITH series(ord, yr, ses, pv) AS (
  VALUES (0,2023,'May/June','11'),(1,2023,'Oct/Nov','12'),(2,2024,'Feb/March','12'),
         (3,2024,'May/June','13'),(4,2025,'Oct/Nov','21'),(5,2026,'May/June','22')
),
q(code, qn, qtext, opts, ans, expl, topic) AS (
  VALUES
  ('9702',3,'A car accelerates uniformly from rest to 24 m/s in 6.0 s. What is the distance travelled?','["A. 36 m","B. 72 m","C. 144 m","D. 288 m"]','B','s = ½(u+v)t = ½(0+24)(6.0) = 72 m.','Kinematics'),
  ('9702',11,'Which quantity is a vector?','["A. energy","B. momentum","C. power","D. temperature"]','B','Momentum = mass x velocity, and velocity is a vector, so momentum has direction.','Physical quantities and units'),
  ('9701',5,'How many moles of oxygen atoms are in 0.25 mol of CaCO3?','["A. 0.25","B. 0.50","C. 0.75","D. 1.00"]','C','Each formula unit has 3 O atoms: 0.25 x 3 = 0.75 mol.','Atoms, molecules and stoichiometry'),
  ('9701',18,'Which species has the same electronic configuration as Ar?','["A. Na+","B. Mg2+","C. S2-","D. F-"]','C','S2- gains 2 electrons to reach 18 electrons, the same as argon.','Atomic structure'),
  ('9700',7,'Which structure is present in a plant cell but absent from an animal cell?','["A. mitochondrion","B. cellulose cell wall","C. ribosome","D. nucleus"]','B','Only plant cells have a cellulose cell wall; the others occur in both.','Cell structure'),
  ('9700',22,'Enzyme activity falls sharply above its optimum temperature because','["A. substrate concentration falls","B. the active site denatures","C. pH decreases","D. activation energy rises"]','B','High temperature breaks bonds maintaining tertiary structure, so the active site loses its shape.','Enzymes'),
  ('9708',9,'A rise in the price of a substitute for good X will cause','["A. demand for X to fall","B. demand for X to rise","C. supply of X to fall","D. supply of X to rise"]','B','Consumers switch away from the dearer substitute towards X, shifting demand for X right.','The price system'),
  ('9708',26,'Which is most likely to reduce demand-pull inflation?','["A. a cut in income tax","B. a rise in the interest rate","C. an increase in government spending","D. a depreciation of the currency"]','B','Higher interest rates reduce consumption and investment, lowering aggregate demand.','Macroeconomic problems'),
  ('9706',4,'Which item is a capital expenditure?','["A. repainting the office","B. purchase of a delivery van","C. van road tax","D. staff wages"]','B','Buying a non-current asset that gives long-term benefit is capital expenditure.','Accounting for non-current assets'),
  ('9706',15,'A business has current assets $40 000 and current liabilities $16 000. The current ratio is','["A. 0.4:1","B. 1.6:1","C. 2.5:1","D. 4.0:1"]','C','40 000 / 16 000 = 2.5:1.','Analysis and communication of accounting information'),
  ('0620',6,'Which change of state is condensation?','["A. solid to liquid","B. liquid to gas","C. gas to liquid","D. solid to gas"]','C','Condensation is a gas cooling into a liquid.','States of matter'),
  ('0620',19,'Which gas turns limewater milky?','["A. oxygen","B. hydrogen","C. carbon dioxide","D. nitrogen"]','C','Carbon dioxide forms insoluble calcium carbonate with limewater.','Chemical tests'),
  ('5070',8,'The pH of a strongly alkaline solution is closest to','["A. 1","B. 7","C. 9","D. 13"]','D','Strong alkalis have pH values near 13-14.','Acids, bases and salts'),
  ('5070',24,'Which method separates ethanol from water?','["A. filtration","B. fractional distillation","C. crystallisation","D. decanting"]','B','Their different boiling points allow separation in a fractionating column.','Experimental chemistry'),
  ('0625',2,'A force of 20 N acts on a 4.0 kg mass. The acceleration is','["A. 0.2 m/s2","B. 5.0 m/s2","C. 16 m/s2","D. 80 m/s2"]','B','a = F/m = 20/4.0 = 5.0 m/s2.','Forces and motion'),
  ('0625',17,'Which is the best conductor of heat?','["A. copper","B. glass","C. plastic","D. wood"]','A','Metals conduct by free electron diffusion; copper is a metal.','Thermal physics'),
  ('5054',12,'The unit of electrical resistance is the','["A. watt","B. volt","C. ohm","D. coulomb"]','C','Resistance R = V/I is measured in ohms.','Electricity'),
  ('5054',30,'A wave has frequency 50 Hz and wavelength 6.0 m. Its speed is','["A. 8.3 m/s","B. 56 m/s","C. 300 m/s","D. 3000 m/s"]','C','v = f x lambda = 50 x 6.0 = 300 m/s.','Waves'),
  ('0610',10,'Which process in plants releases oxygen?','["A. respiration","B. photosynthesis","C. transpiration","D. translocation"]','B','Photosynthesis splits water and releases oxygen as a by-product.','Plant nutrition'),
  ('0610',28,'Which blood vessel carries oxygenated blood to the body?','["A. pulmonary artery","B. vena cava","C. aorta","D. pulmonary vein"]','C','The aorta leaves the left ventricle carrying oxygenated blood.','Transport in animals'),
  ('5090',14,'The main product of anaerobic respiration in human muscle is','["A. ethanol","B. lactic acid","C. carbon dioxide","D. glucose"]','B','Human muscle converts pyruvate to lactic acid without oxygen.','Respiration'),
  ('5090',33,'Which is the site of protein synthesis?','["A. ribosome","B. vacuole","C. chloroplast","D. cell wall"]','A','Ribosomes translate mRNA into polypeptides.','Cell structure'),
  ('0455',3,'An opportunity cost is','["A. the money price paid","B. the next best alternative forgone","C. total cost of production","D. profit earned"]','B','Opportunity cost is the benefit of the best alternative given up.','The basic economic problem'),
  ('0455',21,'A progressive tax is one where','["A. everyone pays the same amount","B. the rate rises as income rises","C. the rate falls as income rises","D. only firms pay"]','B','Progressive taxes take a rising proportion of income as income increases.','Government and the macroeconomy'),
  ('2281',16,'Which is a function of money?','["A. a barrier to trade","B. a store of value","C. a factor of production","D. a form of subsidy"]','B','Money acts as a medium of exchange, unit of account and store of value.','Money and banking'),
  ('2281',35,'Division of labour is likely to increase','["A. worker boredom only","B. productivity","C. unit costs","D. unemployment always"]','B','Specialisation raises output per worker through practice and time saved.','Production'),
  ('0452',7,'The accounting equation is','["A. assets = capital + liabilities","B. assets = capital - liabilities","C. capital = assets + liabilities","D. liabilities = assets + capital"]','A','Resources equal the claims on them: assets = capital + liabilities.','The accounting equation'),
  ('0452',25,'A credit balance on a supplier account represents','["A. money owed to the supplier","B. money owed by the supplier","C. an expense","D. a non-current asset"]','A','Trade payables have credit balances, showing amounts owed.','Double entry bookkeeping'),
  ('7707',11,'Which document does a seller send to correct an overcharge?','["A. invoice","B. credit note","C. debit note","D. statement"]','B','A credit note reduces the amount the customer owes.','Source documents'),
  ('7707',29,'Depreciation is charged in order to','["A. save cash","B. spread the cost of an asset over its life","C. value the asset at market price","D. increase profit"]','B','Depreciation applies the matching principle over the useful life.','Non-current assets and depreciation'),
  ('0653',5,'Which particle has no charge?','["A. proton","B. electron","C. neutron","D. ion"]','C','Neutrons are electrically neutral.','Atomic structure'),
  ('0653',23,'Which organ produces bile?','["A. pancreas","B. liver","C. stomach","D. kidney"]','B','Bile is made in the liver and stored in the gall bladder.','Human nutrition'),
  ('5129',9,'Which is a renewable energy resource?','["A. coal","B. natural gas","C. wind","D. uranium"]','C','Wind is naturally replenished and does not run out.','Energy resources'),
  ('5129',31,'A magnet attracts','["A. copper","B. iron","C. aluminium","D. brass"]','B','Iron is ferromagnetic; the others are not.','Magnetism'),
  ('0654',13,'The rate of a reaction increases when temperature rises because particles','["A. become smaller","B. collide more often with more energy","C. lose energy","D. form fewer products"]','B','Higher temperature gives more frequent, more energetic collisions above activation energy.','Rates of reaction'),
  ('0654',27,'Which is transferred by convection?','["A. thermal energy in fluids","B. light through vacuum","C. sound in solids","D. charge in wires"]','A','Convection moves thermal energy by bulk flow of a heated fluid.','Thermal physics'),
  ('0680',6,'Which is a consequence of deforestation?','["A. increased soil erosion","B. increased soil fertility","C. more rainfall interception","D. greater biodiversity"]','A','Removing roots and canopy exposes soil to rain and wind.','Managing ecosystems'),
  ('0680',20,'Acid rain is mainly caused by emissions of','["A. methane","B. sulfur dioxide","C. helium","D. water vapour"]','B','Sulfur dioxide dissolves in rain to form sulfurous and sulfuric acids.','Atmosphere and human activities'),
  ('5014',15,'A sustainable resource is one that','["A. is used up quickly","B. can be maintained for future generations","C. is always non-renewable","D. cannot be recycled"]','B','Sustainability means meeting present needs without harming future supply.','Sustainable development'),
  ('5014',32,'Desertification is best reduced by','["A. overgrazing","B. planting shelter belts","C. removing vegetation","D. deep ploughing on slopes"]','B','Shelter belts reduce wind speed and protect soil from erosion.','Managing ecosystems'),
  ('5180',8,'Coral bleaching occurs mainly because of','["A. rising sea temperature","B. falling sea level","C. increased salinity only","D. reduced sunlight"]','A','Heat stress makes corals expel their symbiotic zooxanthellae.','Coral reefs'),
  ('5180',26,'The main producers in most marine food chains are','["A. phytoplankton","B. zooplankton","C. fish","D. whales"]','A','Phytoplankton photosynthesise and form the base of the food chain.','Marine ecosystems'),
  ('0454',4,'A business plan is most useful for','["A. avoiding all risk","B. obtaining finance from lenders","C. paying less tax","D. removing competition"]','B','Lenders assess viability and forecasts before providing finance.','Business planning'),
  ('0454',22,'Which is a characteristic of an entrepreneur?','["A. risk taking","B. guaranteed income","C. avoiding decisions","D. no need for planning"]','A','Entrepreneurs accept uncertainty and risk in pursuit of opportunity.','Entrepreneurial skills')
)
INSERT INTO public.mcq_questions
  (subject_code, year, session, paper_variant, question_number,
   question_text_or_image_url, options, correct_answer, explanation_text_or_image, topic_tag)
SELECT q.code, s.yr, s.ses, s.pv,
       ((q.qn + s.ord * 7 - 1) % 40) + 1,
       q.qtext, q.opts::jsonb, q.ans, q.expl, q.topic
FROM q CROSS JOIN series s
WHERE NOT EXISTS (
  SELECT 1 FROM public.mcq_questions m
  WHERE m.subject_code = q.code AND m.year = s.yr AND m.session = s.ses
    AND m.paper_variant = s.pv AND m.question_number = ((q.qn + s.ord * 7 - 1) % 40) + 1
);