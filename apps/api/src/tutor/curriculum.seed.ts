export interface SeedTopic {
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  unitIndex: number;
  unitTitle: string;
  lessonIndex: number;
  title: string;
  grammarKey: string;
  objective: string;
}

export const SEED_CURRICULUM_N5: SeedTopic[] = [
  // Unit 1: Foundations & Introductions
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Introductions",
    lessonIndex: 1,
    title: "Identity & The Copula (〜は〜です)",
    grammarKey: "particle-wa-desu",
    objective:
      "Learn how to introduce yourself and state identity using topic marker は and copula です.",
  },
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Introductions",
    lessonIndex: 2,
    title: "Negative Identification (〜ではありません / 〜じゃありません)",
    grammarKey: "desu-negative",
    objective:
      "Form polite negative identification sentences to express that something or someone is not something.",
  },
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Introductions",
    lessonIndex: 3,
    title: "Questions with Particle か (〜か)",
    grammarKey: "particle-ka-questions",
    objective:
      "Ask yes/no and open-ended questions using sentence-ending particle か and interrogatives.",
  },
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Introductions",
    lessonIndex: 4,
    title: "Demonstratives (これ/それ/あれ) & Possessive Particle の",
    grammarKey: "demonstratives-kore-sore-are-particle-no",
    objective:
      "Identify objects using demonstrative pronouns and show possession/attribution with particle の.",
  },

  // Unit 2: Daily Life & Basic Verbs
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 5,
    title: "Polite Verbs Present & Negative (〜ます / 〜ません)",
    grammarKey: "verb-masu-masen",
    objective:
      "Learn how to conjugate verbs into the polite present affirmative (〜ます) and negative (〜ません) forms for routine actions.",
  },
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 6,
    title: "Direct Objects (を) & Destinations (へ / に)",
    grammarKey: "particle-wo-he-ni",
    objective:
      "Use particle を to mark direct objects and particles へ/に to mark destinations with movement verbs.",
  },
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 7,
    title: "Time Expressions & Time Marker (に)",
    grammarKey: "particle-ni-time",
    objective:
      "Express when actions take place using particle に with specific times, and distinguish relative vs. specific time words.",
  },
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 8,
    title: "Polite Past Tense (〜ました / 〜ませんでした)",
    grammarKey: "verb-mashita-masendeshita",
    objective:
      "Describe completed and non-completed past actions using polite past forms 〜ました and 〜ませんでした.",
  },
];

export const SEED_CURRICULUM_N4: SeedTopic[] = [];

export const SEED_CURRICULUM_N3: SeedTopic[] = [];

export const SEED_CURRICULUM_N2: SeedTopic[] = [];

export const SEED_CURRICULUM_N1: SeedTopic[] = [];

export const ALL_SEED_CURRICULA: Record<
  "N5" | "N4" | "N3" | "N2" | "N1",
  SeedTopic[]
> = {
  N5: SEED_CURRICULUM_N5,
  N4: SEED_CURRICULUM_N4,
  N3: SEED_CURRICULUM_N3,
  N2: SEED_CURRICULUM_N2,
  N1: SEED_CURRICULUM_N1,
};
