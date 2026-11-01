import type { GenerateLessonPayload } from "@nipponic/shared";

export const PREBAKED_LESSONS: Record<string, GenerateLessonPayload> = {
  "particle-wa-desu": {
    title: "Identity & The Copula (〜は〜です)",
    theoryMarkdown: `### 📘 Stating Identity: A は B です

In Japanese, basic sentences stating who or what someone is follow the structure **A は B です** ("As for A, it is B").

---

#### 1. The Topic Marker は (Pronounced *wa*)

- The character **は** is normally read as *ha*, but when used as a grammatical particle marking the **topic** of the sentence, it is pronounced **wa**.
- It tells the listener: *"Speaking of A..."* or *"As for A..."*

---

#### 2. The Copula です (desu)

- **です** roughly corresponds to "to be" (*am / is / are*) in polite speech.
- It comes at the very end of the sentence.
- The final *u* is devoiced, sounding like *dess*.

| Pattern | Meaning |
| :--- | :--- |
| <ruby>私<rt>わたし</rt></ruby>は<ruby>学生<rt>がくせい</rt></ruby>です。 | I am a student. |
| <ruby>田中<rt>たなか</rt></ruby>さんは<ruby>先生<rt>せんせい</rt></ruby>です。 | Tanaka-san is a teacher. |
| <ruby>私<rt>わたし</rt></ruby>は<ruby>日本人<rt>にほんじん</rt></ruby>です。 | I am Japanese. |

> 💡 **Honorific Note:** Never attach **〜さん** (Mr./Ms.) to your own name. Only use it when addressing or referring to other people.`,
    dialogue: [
      {
        speaker: "Ken",
        jpText: "はじめまして。私はケンです。",
        enText: "Nice to meet you. I am Ken.",
      },
      {
        speaker: "Tanaka",
        jpText: "はじめまして。田中です。よろしくお願いします。",
        enText: "Nice to meet you. I am Tanaka. Pleased to meet you.",
      },
      {
        speaker: "Ken",
        jpText: "田中さんは先生ですか。",
        enText: "Tanaka-san, are you a teacher?",
      },
      {
        speaker: "Tanaka",
        jpText: "はい、私は日本語の先生です。",
        enText: "Yes, I am a Japanese language teacher.",
      },
    ],
    vocabulary: [
      {
        jpText: "私",
        reading: "わたし",
        enText: "I / me",
      },
      {
        jpText: "学生",
        reading: "がくせい",
        enText: "student",
      },
      {
        jpText: "先生",
        reading: "せんせい",
        enText: "teacher",
      },
      {
        jpText: "日本人",
        reading: "にほんじん",
        enText: "Japanese person",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the correct particle to mark the topic: 私___学生です。",
        options: ["は", "が", "を", "に"],
        correctAnswer: "は",
        explanation:
          "Particle は (pronounced 'wa') marks the sentence topic (私 - I).",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt: "Complete the sentence to state 'I am Tanaka': 私は田中___。",
        correctAnswer: "です",
        explanation:
          "です is the polite copula placed at the end to state 'am/is/are'.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'I am a student.'",
        options: ["私は", "学生", "です"],
        correctAnswer: "私は学生です",
        explanation:
          "The order is Topic (私は) + Complement (学生) + Copula (です).",
      },
    ],
  },

  "desu-negative": {
    title: "Negative Identification (〜ではありません / 〜じゃありません)",
    theoryMarkdown: `### 📘 Negative Copula: 〜ではありません & 〜じゃありません

To make a negative statement like *"I am not a student"*, replace **です** with one of its negative polite forms.

---

#### 1. Two Levels of Politeness

| Form | Tone | Context |
| :--- | :--- | :--- |
| **〜ではありません** | Formal Polite | Written Japanese, formal speeches, business |
| **〜じゃありません** | Casual Polite | Everyday spoken conversation among acquaintances |

---

#### 2. Sentence Structure

- **Formula:** \`[Topic] は [Noun] ではありません / じゃありません\`
- Example: <ruby>私<rt>わたし</rt></ruby>は<ruby>会社員<rt>かいしゃいん</rt></ruby>ではありません。(I am not an office worker.)
- Example: ケンさんは<ruby>先生<rt>せんせい</rt></ruby>じゃありません。(Ken-san is not a teacher.)`,
    dialogue: [
      {
        speaker: "Ken",
        jpText: "マリアさんは日本人ですか。",
        enText: "Maria-san, are you Japanese?",
      },
      {
        speaker: "Maria",
        jpText: "いいえ、日本人じゃありません。ブラジル人です。",
        enText: "No, I am not Japanese. I am Brazilian.",
      },
      {
        speaker: "Ken",
        jpText: "学生ですか。",
        enText: "Are you a student?",
      },
      {
        speaker: "Maria",
        jpText: "いいえ、学生ではありません。会社員です。",
        enText: "No, I am not a student. I am an office worker.",
      },
    ],
    vocabulary: [
      {
        jpText: "会社員",
        reading: "かいしゃいん",
        enText: "office worker / company employee",
      },
      {
        jpText: "はい",
        reading: "はい",
        enText: "yes",
      },
      {
        jpText: "いいえ",
        reading: "いいえ",
        enText: "no",
      },
      {
        jpText: "ブラジル人",
        reading: "ぶらじるじん",
        enText: "Brazilian person",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt: "Select the conversational polite negative ending for です:",
        options: ["じゃありません", "でした", "ません", "ます"],
        correctAnswer: "じゃありません",
        explanation:
          "じゃありません is the standard spoken polite negative equivalent of です.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete with the polite negative: 私は先生___。(I am not a teacher.)",
        correctAnswer: "ではありません",
        explanation:
          "ではありません creates the polite negative form of a noun predicate.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'Tanaka is not a student.'",
        options: ["田中さんは", "学生", "じゃありません"],
        correctAnswer: "田中さんは学生じゃありません",
        explanation:
          "Topic (田中さんは) + Predicate Noun (学生) + Negative Copula (じゃありません).",
      },
    ],
  },

  "particle-ka-questions": {
    title: "Questions with Particle か (〜か)",
    theoryMarkdown: `### 📘 Asking Questions: Sentence-Ending か

In Japanese, you turn any statement into a question simply by adding the particle **か** to the end of the sentence.

---

#### 1. Yes / No Questions

- No change in word order is required.
- A question mark (**？**) is often omitted in traditional writing because **か** already acts as the question marker.

| Statement | Question |
| :--- | :--- |
| <ruby>学生<rt>がくせい</rt></ruby>です。(You are a student.) | <ruby>学生<rt>がくせい</rt></ruby>ですか。(Are you a student?) |

---

#### 2. Asking "Who?" (<ruby>誰<rt>だれ</rt></ruby>)

To ask who someone is, use the question word **誰 (だれ)** in the noun slot:

- あの<ruby>人<rt>ひと</rt></ruby>は**<ruby>誰<rt>だれ</rt></ruby>**ですか。(Who is that person?)
- あの<ruby>人<rt>ひと</rt></ruby>はマリアさんです。(That person is Maria-san.)`,
    dialogue: [
      {
        speaker: "Tanaka",
        jpText: "ケンさんはアメリカ人ですか。",
        enText: "Ken-san, are you American?",
      },
      {
        speaker: "Ken",
        jpText: "はい、アメリカ人です。",
        enText: "Yes, I am American.",
      },
      {
        speaker: "Tanaka",
        jpText: "あの人は誰ですか。",
        enText: "Who is that person over there?",
      },
      {
        speaker: "Ken",
        jpText: "あの人はマリアさんです。学生です。",
        enText: "That person is Maria-san. She is a student.",
      },
    ],
    vocabulary: [
      {
        jpText: "アメリカ人",
        reading: "あめりかじん",
        enText: "American person",
      },
      {
        jpText: "誰",
        reading: "だれ",
        enText: "who",
      },
      {
        jpText: "人",
        reading: "ひと",
        enText: "person",
      },
      {
        jpText: "あの人",
        reading: "あのひと",
        enText: "that person",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the particle that turns a statement into a question: あなたは学生です___。",
        options: ["か", "ね", "よ", "は"],
        correctAnswer: "か",
        explanation: "Particle か placed at the end marks an inquiry.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete the question: あの人は___ですか。(Who is that person?)",
        correctAnswer: "誰",
        explanation: "誰 (だれ) is the interrogative word for 'who'.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'Are you a teacher?'",
        options: ["あなたは", "先生", "ですか"],
        correctAnswer: "あなたは先生ですか",
        explanation:
          "Topic (あなたは) + Noun (先生) + Question Copula (ですか).",
      },
    ],
  },

  "demonstratives-kore-sore-are-particle-no": {
    title: "Demonstratives (これ/それ/あれ) & Possessive Particle の",
    theoryMarkdown: `### 📘 Demonstratives & The Connector Particle の

---

#### 1. The Ko-So-A-Do Demonstratives for Things

Japanese demonstratives categorize things relative to the positions of the speaker and listener:

| Word | Meaning | Spatial Relationship |
| :--- | :--- | :--- |
| **これ** | This | Close to the speaker |
| **それ** | That | Close to the listener |
| **あれ** | That over there | Far from both speaker and listener |
| **どれ** | Which one? | Question word |

---

#### 2. The Modifying / Possessive Particle の

Particle **の** connects two nouns (\`Noun 1 の Noun 2\`), where Noun 1 qualifies or possesses Noun 2:

- **Possession:** <ruby>私<rt>わたし</rt></ruby>**の**<ruby>本<rt>ほん</rt></ruby> (My book)
- **Affiliation:** <ruby>日本語<rt>にほんご</rt></ruby>**の**<ruby>先生<rt>せんせい</rt></ruby> (Teacher of Japanese)`,
    dialogue: [
      {
        speaker: "Ken",
        jpText: "田中さん、これは何ですか。",
        enText: "Tanaka-sal, what is this?",
      },
      {
        speaker: "Tanaka",
        jpText: "それは私の本です。",
        enText: "That is my book.",
      },
      {
        speaker: "Ken",
        jpText: "あれも田中さんの本ですか。",
        enText: "Is that one over there also your book, Tanaka-san?",
      },
      {
        speaker: "Tanaka",
        jpText: "いいえ、あれは辞書です。",
        enText: "No, that one over there is a dictionary.",
      },
    ],
    vocabulary: [
      {
        jpText: "これ",
        reading: "これ",
        enText: "this (near speaker)",
      },
      {
        jpText: "それ",
        reading: "それ",
        enText: "that (near listener)",
      },
      {
        jpText: "あれ",
        reading: "あれ",
        enText: "that over there (far from both)",
      },
      {
        jpText: "本",
        reading: "ほん",
        enText: "book",
      },
      {
        jpText: "辞書",
        reading: "じしょ",
        enText: "dictionary",
      },
      {
        jpText: "何",
        reading: "なん",
        enText: "what",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Which demonstrative refers to an object located close to the listener?",
        options: ["それ", "これ", "あれ", "どれ"],
        correctAnswer: "それ",
        explanation:
          "それ refers to an object near the person you are speaking to.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete with the possession particle: これは私___辞書です。(This is my dictionary.)",
        correctAnswer: "の",
        explanation:
          "Particle の connects 私 (I) and 辞書 (dictionary) to express 'my dictionary'.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'That over there is my book.'",
        options: ["あれは", "私の", "本です"],
        correctAnswer: "あれは私の本です",
        explanation:
          "Topic/Demonstrative (あれは) + Possessive modifier (私の) + Noun predicate (本です).",
      },
    ],
  },
};
