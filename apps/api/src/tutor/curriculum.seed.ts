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

  // Unit 3: Locations, Existence & Quantities
  {
    level: "N5",
    unitIndex: 3,
    unitTitle: "Locations, Existence & Quantities",
    lessonIndex: 9,
    title: "Existence of Inanimate & Animate (あります / います)",
    grammarKey: "existence-arimasu-imasu",
    objective:
      "Distinguish between inanimate existence (あります) and animate existence (います) with location marker に.",
  },
  {
    level: "N5",
    unitIndex: 3,
    unitTitle: "Locations, Existence & Quantities",
    lessonIndex: 10,
    title: "Action Location (で) vs. Existence Location (に)",
    grammarKey: "particles-de-vs-ni-location",
    objective:
      "Distinguish between particle で for where dynamic actions occur and particle に for where entities exist.",
  },
  {
    level: "N5",
    unitIndex: 3,
    unitTitle: "Locations, Existence & Quantities",
    lessonIndex: 11,
    title: "Basic Counters & Quantifiers (一つ、二つ、〜人)",
    grammarKey: "japanese-counters-quantifiers",
    objective:
      "Count general items using native Japanese numbers and count people, placing quantifiers naturally in sentences.",
  },
  {
    level: "N5",
    unitIndex: 3,
    unitTitle: "Locations, Existence & Quantities",
    lessonIndex: 12,
    title: "Inclusive Particle も & Listing Nouns (と / や)",
    grammarKey: "particle-mo-to-ya",
    objective:
      "Use particle も to express 'also/too' and connect nouns using exhaustive と and non-exhaustive や.",
  },

  // Unit 4: Describing the World (Adjectives)
  {
    level: "N5",
    unitIndex: 4,
    unitTitle: "Describing the World (Adjectives)",
    lessonIndex: 13,
    title: "い-Adjectives: Present Affirmative & Negative",
    grammarKey: "i-adjectives-present-negative",
    objective:
      "Learn how to describe things and express negative qualities using い-adjectives in polite present forms.",
  },
  {
    level: "N5",
    unitIndex: 4,
    unitTitle: "Describing the World (Adjectives)",
    lessonIndex: 14,
    title: "な-Adjectives & Noun Modification",
    grammarKey: "na-adjectives-noun-modification",
    objective:
      "Use な-adjectives to describe nouns and form polite present affirmative and negative statements.",
  },
  {
    level: "N5",
    unitIndex: 4,
    unitTitle: "Describing the World (Adjectives)",
    lessonIndex: 15,
    title: "Past Tense of Adjectives (い & な)",
    grammarKey: "adjectives-past-tense",
    objective:
      "Express past affirmative and past negative states for both い-adjectives and な-adjectives.",
  },
  {
    level: "N5",
    unitIndex: 4,
    unitTitle: "Describing the World (Adjectives)",
    lessonIndex: 16,
    title: "Connecting Adjectives & Preferences (〜が好き / 嫌い)",
    grammarKey: "connecting-adjectives-suki-kirai",
    objective:
      "Connect multiple adjectives using 〜くて / 〜で and state likes and dislikes using 好き / 嫌い with particle が.",
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
