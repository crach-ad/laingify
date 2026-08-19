// The eight KCSB strands ("program components"). Each becomes a Module.topic,
// so every year group's dashboard shows the same eight topic cards and the
// Reception → Year 8 spiral is visible at a glance.
export const STRAND = {
  CS: "Computer Systems",
  CT: "Computational Thinking",
  P: "Programming",
  MD: "Managing Data",
  DC: "Networks & Digital Communication",
  TC: "Tools & Content Creation",
  SW: "Safety & Wellbeing",
  DW: "The Digital World",
};

// Default order inside every class: what a computer is → the two programming
// strands back-to-back → data / networks → the three Digital Literacy strands.
export const STRAND_ORDER = ["CS", "CT", "P", "MD", "DC", "TC", "SW", "DW"];

// Year-group → Cambridge stage / age band, for reference in summaries.
export const YEARS = [
  { key: "reception", name: "Reception", code: "KCSB-R", band: "EARLY", ages: "4–5", stage: "Cambridge Early Years (informal)" },
  { key: "year-1", name: "Year 1", code: "KCSB-1", band: "EARLY", ages: "5–6", stage: "Primary Stage 1" },
  { key: "year-2", name: "Year 2", code: "KCSB-2", band: "EARLY", ages: "6–7", stage: "Primary Stage 2" },
  { key: "year-3", name: "Year 3", code: "KCSB-3", band: "YOUTH", ages: "7–8", stage: "Primary Stage 3" },
  { key: "year-4", name: "Year 4", code: "KCSB-4", band: "YOUTH", ages: "8–9", stage: "Primary Stage 4" },
  { key: "year-5", name: "Year 5", code: "KCSB-5", band: "YOUTH", ages: "9–10", stage: "Primary Stage 5" },
  { key: "year-6", name: "Year 6", code: "KCSB-6", band: "YOUTH", ages: "10–11", stage: "Primary Stage 6" },
  { key: "year-7", name: "Year 7", code: "KCSB-7", band: "TEEN", ages: "11–12", stage: "Lower Secondary Stage 7" },
  { key: "year-8", name: "Year 8", code: "KCSB-8", band: "TEEN", ages: "12–13", stage: "Lower Secondary Stage 8" },
];
