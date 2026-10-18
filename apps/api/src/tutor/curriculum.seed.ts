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

export const SEED_CURRICULUM_N4: SeedTopic[] = [
  // Unit 1: Potential & Ability
  {
    level: "N4",
    unitIndex: 1,
    unitTitle: "Potential & Ability",
    lessonIndex: 1,
    title: "Potential Form (〜ことができる / 〜れる・られる)",
    grammarKey: "potential-form",
    objective: "Express ability and possibility using verb potential forms (話せる, 食べられる).",
  },
  {
    level: "N4",
    unitIndex: 1,
    unitTitle: "Potential & Ability",
    lessonIndex: 2,
    title: "Simultaneous Actions (〜ながら)",
    grammarKey: "nagara-actions",
    objective: "Describe doing two actions at the same time using [Verb stem] ながら.",
  },
  {
    level: "N4",
    unitIndex: 1,
    unitTitle: "Potential & Ability",
    lessonIndex: 3,
    title: "Excessive Actions & States (〜すぎる)",
    grammarKey: "sugiru-excess",
    objective: "Indicate doing something too much or exceeding limits using 〜すぎる.",
  },

  // Unit 2: Giving & Receiving
  {
    level: "N4",
    unitIndex: 2,
    unitTitle: "Giving & Receiving Favors",
    lessonIndex: 4,
    title: "Giving & Receiving Items (あげる, くれる, もらう)",
    grammarKey: "giving-receiving-items",
    objective: "Master psychological perspective when giving or receiving objects.",
  },
  {
    level: "N4",
    unitIndex: 2,
    unitTitle: "Giving & Receiving Favors",
    lessonIndex: 5,
    title: "Doing Favors for Others (〜てあげる, 〜てくれる, 〜てもらう)",
    grammarKey: "giving-receiving-actions",
    objective: "Express performing actions as favors for others or receiving helpful actions.",
  },

  // Unit 3: Conditionals & Intentions
  {
    level: "N4",
    unitIndex: 3,
    unitTitle: "Conditionals & Hypotheses",
    lessonIndex: 6,
    title: "Past & Sequential Conditional (〜たら)",
    grammarKey: "conditional-tara",
    objective: "Form 'if' and 'when' conditional clauses using the versatile 〜たら pattern.",
  },
  {
    level: "N4",
    unitIndex: 3,
    unitTitle: "Conditionals & Hypotheses",
    lessonIndex: 7,
    title: "Contextual Conditional (〜なら)",
    grammarKey: "conditional-nara",
    objective: "Provide advice or conditions based on information given by the listener.",
  },
  {
    level: "N4",
    unitIndex: 3,
    unitTitle: "Conditionals & Hypotheses",
    lessonIndex: 8,
    title: "Volitional Form & Plans (〜よう・ろう / 〜つもり)",
    grammarKey: "volitional-tsumori",
    objective: "State intentions, suggestions ('let's'), and planned decisions.",
  },

  // Unit 4: Passive & Causative Foundations
  {
    level: "N4",
    unitIndex: 4,
    unitTitle: "Voices & Perspectives",
    lessonIndex: 9,
    title: "Passive Voice (〜れる・られる)",
    grammarKey: "passive-voice",
    objective: "Express actions received from others and suffering passive in Japanese.",
  },
  {
    level: "N4",
    unitIndex: 4,
    unitTitle: "Voices & Perspectives",
    lessonIndex: 10,
    title: "Causative Form (〜せる・させる)",
    grammarKey: "causative-voice",
    objective: "Describe making or letting someone do an action using causative verbs.",
  },
];

export const SEED_CURRICULUM_N3: SeedTopic[] = [
  // Unit 1: Nuance & Conjecture
  {
    level: "N3",
    unitIndex: 1,
    unitTitle: "Conjecture & Hearsay",
    lessonIndex: 1,
    title: "Reliable Hearsay vs Conjecture (〜そうだ vs 〜らしい)",
    grammarKey: "hearsay-souda-rashii",
    objective: "Distinguish between reporting information heard from sources and making reasoned conjectures.",
  },
  {
    level: "N3",
    unitIndex: 1,
    unitTitle: "Conjecture & Hearsay",
    lessonIndex: 2,
    title: "Subjective Impressions (〜ように見える / 〜気がする)",
    grammarKey: "impressions-you-ki",
    objective: "Express intuitions, subtle impressions, and hunches naturally in conversation.",
  },

  // Unit 2: Contrast & Relations
  {
    level: "N3",
    unitIndex: 2,
    unitTitle: "Contrast & Comparative Relations",
    lessonIndex: 3,
    title: "Direct Contrast (〜に対して / 〜反面)",
    grammarKey: "contrast-nitaishite",
    objective: "Express sharp contrast between two subjects or two opposing aspects of the same thing.",
  },
  {
    level: "N3",
    unitIndex: 2,
    unitTitle: "Contrast & Comparative Relations",
    lessonIndex: 4,
    title: "Proportional Change (〜にしたがって / 〜につれて)",
    grammarKey: "proportional-change",
    objective: "Describe how one phenomenon progresses alongside another (as X happens, Y changes).",
  },

  // Unit 3: Time & Opportunities
  {
    level: "N3",
    unitIndex: 3,
    unitTitle: "Time & Opportunity Windows",
    lessonIndex: 5,
    title: "While / Before a State Changes (〜うちに)",
    grammarKey: "time-uchini",
    objective: "Express taking action before a continuous state changes, or unexpected change during a state.",
  },
  {
    level: "N3",
    unitIndex: 3,
    unitTitle: "Time & Opportunity Windows",
    lessonIndex: 6,
    title: "Just About to / In the Middle of (〜ところ)",
    grammarKey: "time-tokoro",
    objective: "Precisely mark whether an action is about to start, currently underway, or just finished.",
  },
];

export const SEED_CURRICULUM_N2: SeedTopic[] = [
  // Unit 1: Advanced Connections & Context
  {
    level: "N2",
    unitIndex: 1,
    unitTitle: "Formal Focus & Topic Framing",
    lessonIndex: 1,
    title: "Centering Controversy or Debate (〜をめぐって)",
    grammarKey: "megutte-debate",
    objective: "Express discussions, conflicts, or decisions centered around an issue in formal Japanese.",
  },
  {
    level: "N2",
    unitIndex: 1,
    unitTitle: "Formal Focus & Topic Framing",
    lessonIndex: 2,
    title: "Disregarding Conditions (〜にかかわらず / 〜をとわず)",
    grammarKey: "nikakawarazu-regardless",
    objective: "State that something applies regardless of age, nationality, weather, or circumstances.",
  },
  {
    level: "N2",
    unitIndex: 1,
    unitTitle: "Formal Focus & Topic Framing",
    lessonIndex: 3,
    title: "Certainty Without Doubt (〜に相違ない / 〜に決まっている)",
    grammarKey: "nisouiinai-certainty",
    objective: "Express strong conviction that a deduction or conclusion is beyond doubt.",
  },

  // Unit 2: Emotional Nuance & Evaluation
  {
    level: "N2",
    unitIndex: 2,
    unitTitle: "Evaluation & Feeling",
    lessonIndex: 4,
    title: "Unmistakable Emotional Feeling (〜ものがある)",
    grammarKey: "monogaaru-feeling",
    objective: "Describe a profound personal emotion or qualitative feeling that deeply moves the speaker.",
  },
  {
    level: "N2",
    unitIndex: 2,
    unitTitle: "Evaluation & Feeling",
    lessonIndex: 5,
    title: "Inevitability & Compulsion (〜ざるを得ない)",
    grammarKey: "zaruwoenai-compelled",
    objective: "State that despite personal reluctance, one has no choice but to do an action due to circumstance.",
  },
];

export const SEED_CURRICULUM_N1: SeedTopic[] = [
  // Unit 1: Extreme Nuances & High Register
  {
    level: "N1",
    unitIndex: 1,
    unitTitle: "Extreme Nuances & Formal Register",
    lessonIndex: 1,
    title: "Extreme Emotional States (〜極まりない / 〜極まる)",
    grammarKey: "kiwamarinai-extreme",
    objective: "Express uncontainable extreme emotional states like danger, impoliteness, or regret in high literary style.",
  },
  {
    level: "N1",
    unitIndex: 1,
    unitTitle: "Extreme Nuances & Formal Register",
    lessonIndex: 2,
    title: "Overwhelming Emotion (〜にたえない)",
    grammarKey: "nitaenai-overwhelming",
    objective: "Express profound feelings (gratitude, sorrow, embarrassment) that one cannot keep inside.",
  },
  {
    level: "N1",
    unitIndex: 1,
    unitTitle: "Extreme Nuances & Formal Register",
    lessonIndex: 3,
    title: "Beginning a Chain of Events (〜を皮切りに)",
    grammarKey: "wokawakirini-beginning",
    objective: "Indicate an opening event that triggers a sequence of subsequent similar actions or expansions.",
  },

  // Unit 2: Literary Negation & Inevitability
  {
    level: "N1",
    unitIndex: 2,
    unitTitle: "Literary Negation & Rigorous Logic",
    lessonIndex: 4,
    title: "Absolute Logical Negation (〜てやまない / 〜ずにはおかない)",
    grammarKey: "teyamanai-unyielding",
    objective: "Articulate deep, enduring wishes or inevitable psychological reactions that cannot be suppressed.",
  },
  {
    level: "N1",
    unitIndex: 2,
    unitTitle: "Literary Negation & Rigorous Logic",
    lessonIndex: 5,
    title: "Disdain & Humble Reflection (〜ごとき / 〜たりとも)",
    grammarKey: "gotoki-taritomo",
    objective: "Use classical grammatical particles to express humility, emphasis on 'even a single drop', or subtle disdain.",
  },
];

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
