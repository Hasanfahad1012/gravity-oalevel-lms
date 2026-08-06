export interface Chapter {
  title: string;
  papers: string;
  minutes: number;
}

export interface SyllabusModule {
  code: string;
  chapters: Chapter[];
  topicalPapers: { label: string; session: string; marks: number }[];
  walkthroughs: { label: string; examiner: string; minutes: number }[];
}

export const SYLLABUS: Record<string, SyllabusModule> = {
  "7707": {
    code: "7707",
    chapters: [
      { title: "The accounting equation & double entry", papers: "Paper 1", minutes: 48 },
      { title: "Books of prime entry and ledgers", papers: "Paper 1", minutes: 55 },
      { title: "Control accounts & bank reconciliation", papers: "Paper 2", minutes: 62 },
      { title: "Adjustments: accruals, prepayments, depreciation", papers: "Paper 2", minutes: 71 },
      { title: "Final accounts of sole traders & partnerships", papers: "Paper 2", minutes: 84 },
      { title: "Ratio analysis and interpretation", papers: "Paper 2", minutes: 46 },
    ],
    topicalPapers: [
      { label: "Control accounts — topical set A", session: "M/J 2019–2024", marks: 60 },
      { label: "Depreciation & disposal", session: "O/N 2018–2024", marks: 45 },
      { label: "Partnership appropriation", session: "M/J 2020–2024", marks: 50 },
    ],
    walkthroughs: [
      { label: "9-mark adjustment question — full mark scheme", examiner: "Sir Hamza", minutes: 22 },
      { label: "Ratio interpretation: how marks are awarded", examiner: "Ms. Anjum", minutes: 18 },
    ],
  },
  "9708": {
    code: "9708",
    chapters: [
      { title: "Basic economic ideas & resource allocation", papers: "Paper 1", minutes: 52 },
      { title: "Price elasticity and its applications", papers: "Paper 1", minutes: 58 },
      { title: "Government microeconomic intervention", papers: "Paper 2", minutes: 64 },
      { title: "The macroeconomy: AD/AS analysis", papers: "Paper 3", minutes: 76 },
      { title: "International trade & exchange rates", papers: "Paper 4", minutes: 81 },
    ],
    topicalPapers: [
      { label: "Market failure MCQ bank", session: "2017–2024", marks: 30 },
      { label: "Data response: elasticity", session: "M/J 2021–2024", marks: 20 },
      { label: "Essay: fiscal vs monetary policy", session: "O/N 2019–2024", marks: 25 },
    ],
    walkthroughs: [
      { label: "Structuring a 25-mark evaluation essay", examiner: "Sir Danish", minutes: 26 },
      { label: "Diagram accuracy: where students lose marks", examiner: "Ms. Rida", minutes: 15 },
    ],
  },
  "9609": {
    code: "9609",
    chapters: [
      { title: "Business & its environment", papers: "Paper 1", minutes: 44 },
      { title: "People in organisations", papers: "Paper 2", minutes: 57 },
      { title: "Marketing strategy & the mix", papers: "Paper 2", minutes: 63 },
      { title: "Operations & project management", papers: "Paper 3", minutes: 69 },
      { title: "Finance & accounting decisions", papers: "Paper 3", minutes: 88 },
    ],
    topicalPapers: [
      { label: "Case study: strategic management", session: "M/J 2022–2024", marks: 40 },
      { label: "Investment appraisal calculations", session: "O/N 2020–2024", marks: 35 },
    ],
    walkthroughs: [
      { label: "Applying context: the AO2 trap", examiner: "Sir Danish", minutes: 20 },
      { label: "Level 4 evaluation in Paper 3", examiner: "Ms. Anjum", minutes: 24 },
    ],
  },
  "9709": {
    code: "9709",
    chapters: [
      { title: "Quadratics, functions & transformations", papers: "P1", minutes: 61 },
      { title: "Differentiation and its applications", papers: "P1", minutes: 74 },
      { title: "Integration & areas under curves", papers: "P1", minutes: 68 },
      { title: "Complex numbers & vectors", papers: "P3", minutes: 92 },
      { title: "Forces, kinematics & momentum", papers: "M1", minutes: 80 },
      { title: "Probability distributions", papers: "S1", minutes: 66 },
    ],
    topicalPapers: [
      { label: "Differentiation topical (P1)", session: "2018–2024", marks: 75 },
      { label: "Vectors topical (P3)", session: "2019–2024", marks: 60 },
      { label: "Normal distribution (S1)", session: "2018–2024", marks: 55 },
    ],
    walkthroughs: [
      { label: "Method marks: showing full working", examiner: "Sir Owais", minutes: 19 },
      { label: "P3 integration by substitution walkthrough", examiner: "Sir Owais", minutes: 28 },
    ],
  },
  "0580": {
    code: "0580",
    chapters: [
      { title: "Number, ratio and proportion", papers: "Paper 2", minutes: 40 },
      { title: "Algebra and graphs", papers: "Paper 4", minutes: 58 },
      { title: "Geometry & trigonometry", papers: "Paper 4", minutes: 65 },
      { title: "Statistics and probability", papers: "Paper 4", minutes: 47 },
    ],
    topicalPapers: [{ label: "Algebra topical (extended)", session: "2018–2024", marks: 70 }],
    walkthroughs: [{ label: "Extended paper timing strategy", examiner: "Ms. Rida", minutes: 16 }],
  },
  "9706": {
    code: "9706",
    chapters: [
      { title: "Financial accounting foundations", papers: "Paper 1", minutes: 54 },
      { title: "Limited company accounts", papers: "Paper 2", minutes: 79 },
      { title: "Cost & management accounting", papers: "Paper 3", minutes: 83 },
      { title: "Budgeting and standard costing", papers: "Paper 4", minutes: 72 },
    ],
    topicalPapers: [
      { label: "Company accounts topical", session: "2019–2024", marks: 65 },
      { label: "Variance analysis", session: "2020–2024", marks: 50 },
    ],
    walkthroughs: [
      { label: "Statement of cash flows, line by line", examiner: "Sir Hamza", minutes: 31 },
    ],
  },
};

export const FALLBACK_MODULE: SyllabusModule = {
  code: "",
  chapters: [{ title: "Course outline being finalised", papers: "—", minutes: 0 }],
  topicalPapers: [],
  walkthroughs: [],
};
