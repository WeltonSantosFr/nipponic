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
  // Unit 1: Foundations & Greetings
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Greetings",
    lessonIndex: 1,
    title: "Polite Copula (です) & Introductions",
    grammarKey: "copula-desu",
    objective: "Learn to introduce yourself politely using [Noun] です and state identity or nationality.",
  },
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Greetings",
    lessonIndex: 2,
    title: "Topic Marker (は) & Also (も)",
    grammarKey: "particle-wa-mo",
    objective: "Master the topic marker は (pronounced wa) and the inclusive marker も (too/also).",
  },
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Greetings",
    lessonIndex: 3,
    title: "Asking Questions (か) & What (何)",
    grammarKey: "question-ka-nan",
    objective: "Form polite questions using question particle か and interrogatives like 何 (what).",
  },
  {
    level: "N5",
    unitIndex: 1,
    unitTitle: "Foundations & Greetings",
    lessonIndex: 4,
    title: "Demonstratives (これ, それ, あれ, どれ)",
    grammarKey: "ko-so-a-do-things",
    objective: "Identify objects near the speaker, listener, or far from both using the ko-so-a-do system.",
  },

  // Unit 2: Daily Life & Basic Verbs
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 5,
    title: "Polite Verbs Present & Negative (〜ます / 〜ません)",
    grammarKey: "verb-masu-masen",
    objective: "Learn polite present affirmative (〜ます) and negative (〜ません) verb conjugations for routine actions.",
  },
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 6,
    title: "Direct Object Marker (を)",
    grammarKey: "particle-wo",
    objective: "Use particle を (o) to mark the direct object of transitive verbs like eating, drinking, and reading.",
  },
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 7,
    title: "Location of Action (で) & Direction (へ / に)",
    grammarKey: "particles-de-he-ni",
    objective: "Distinguish between location where an action takes place (で) and direction of movement (へ / に).",
  },
  {
    level: "N5",
    unitIndex: 2,
    unitTitle: "Daily Life & Basic Verbs",
    lessonIndex: 8,
    title: "Time Expressions & Specific Time (に)",
    grammarKey: "particle-ni-time",
    objective: "Express hours, days of the week, and mark specific point-in-time actions with particle に.",
  },

  // Unit 3: Adjectives & Descriptions
  {
    level: "N5",
    unitIndex: 3,
    unitTitle: "Adjectives & Descriptions",
    lessonIndex: 9,
    title: "い-Adjectives (Present & Negative: 〜くない)",
    grammarKey: "i-adjectives",
    objective: "Conjugate true い-adjectives to describe physical properties, sensations, and feelings.",
  },
  {
    level: "N5",
    unitIndex: 3,
    unitTitle: "Adjectives & Descriptions",
    lessonIndex: 10,
    title: "な-Adjectives (Present & Negative: 〜じゃない)",
    grammarKey: "na-adjectives",
    objective: "Use な-adjectives before nouns (using な) and in predicates with です / じゃないです.",
  },
  {
    level: "N5",
    unitIndex: 3,
    unitTitle: "Adjectives & Descriptions",
    lessonIndex: 11,
    title: "Expressing Likes & Dislikes (好き / 嫌い with が)",
    grammarKey: "suki-kirai-ga",
    objective: "Express preferences with 好き (like), 嫌い (dislike), and the grammatical subject particle が.",
  },

  // Unit 4: Existence & Locations
  {
    level: "N5",
    unitIndex: 4,
    unitTitle: "Locations & Existence",
    lessonIndex: 12,
    title: "Inanimate Existence (ある / あります)",
    grammarKey: "exist-aru",
    objective: "State the presence, possession, or location of non-living things using ある / あります.",
  },
  {
    level: "N5",
    unitIndex: 4,
    unitTitle: "Locations & Existence",
    lessonIndex: 13,
    title: "Animate Existence (いる / います)",
    grammarKey: "exist-iru",
    objective: "State the presence or location of living people and animals using いる / います.",
  },
  {
    level: "N5",
    unitIndex: 4,
    unitTitle: "Locations & Existence",
    lessonIndex: 14,
    title: "Relative Location (上, 下, 前, 後ろ, 中, 隣)",
    grammarKey: "spatial-relations",
    objective: "Describe relative spatial locations of objects using [Noun A] の [Position] に [Noun B] があります.",
  },

  // Unit 5: Verb Connections & Te-form
  {
    level: "N5",
    unitIndex: 5,
    unitTitle: "Verb Connections & Te-form",
    lessonIndex: 15,
    title: "Introduction to Te-form (〜て)",
    grammarKey: "te-form-intro",
    objective: "Learn the fundamentals of verb Te-form to connect consecutive actions in chronological sequence.",
  },
  {
    level: "N5",
    unitIndex: 5,
    unitTitle: "Verb Connections & Te-form",
    lessonIndex: 16,
    title: "Polite Requests (〜てください)",
    grammarKey: "te-kudasai",
    objective: "Form polite, natural daily requests using [Verb て-form] ください.",
  },
  {
    level: "N5",
    unitIndex: 5,
    unitTitle: "Verb Connections & Te-form",
    lessonIndex: 17,
    title: "Actions in Progress & States (〜ている)",
    grammarKey: "te-iru",
    objective: "Express ongoing actions (present continuous) and continuous states using [Verb て-form] います.",
  },
  {
    level: "N5",
    unitIndex: 5,
    unitTitle: "Verb Connections & Te-form",
    lessonIndex: 18,
    title: "Asking and Granting Permission (〜てもいいです)",
    grammarKey: "te-mo-ii",
    objective: "Ask for and give permission to do something using [Verb て-form] もいいですか.",
  },
];
