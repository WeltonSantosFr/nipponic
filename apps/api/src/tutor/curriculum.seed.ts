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
