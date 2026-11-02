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

  "verb-masu-masen": {
    title: "Polite Verbs Present & Negative (〜ます / 〜ません)",
    theoryMarkdown: `### 📘 The Polite Present Form (〜ます / 〜ません)

In Japanese, verbs conjugate to indicate politeness and tense. The **〜ます** ending is the standard polite form used when speaking to teachers, colleagues, or acquaintances.

Japanese has no distinct future tense: the present tense covers both **habitual actions** and **future intentions**.

---

#### 1. Verb Groups & Conjugation Rules

Japanese verbs fall into three distinct groups:

| Verb Group | Dictionary Form | Masu Stem | Affirmative (〜ます) | Negative (〜ません) |
| :--- | :--- | :--- | :--- | :--- |
| **Ichidan (Group 2)** | <ruby>食<rt>た</rt></ruby>べる | 食べ- | <ruby>食<rt>た</rt></ruby>べます (eat / will eat) | <ruby>食<rt>た</rt></ruby>べません (do not / will not eat) |
| **Godan (Group 1)** | <ruby>飲<rt>の</rt></ruby>む | 飲み- | <ruby>飲<rt>の</rt></ruby>みます (drink / will drink) | <ruby>飲<rt>の</rt></ruby>みません (do not / will not drink) |
| **Irregular (Group 3)** | する | し- | します (do / will do) | しません (do not / will not do) |
| **Irregular (Group 3)** | <ruby>来<rt>く</rt></ruby>る | 来 (き)- | <ruby>来<rt>き</rt></ruby>ます (come / will come) | <ruby>来<rt>き</rt></ruby>ません (do not / will not come) |

---

#### 2. Key Rules

- **Ichidan Verbs:** Drop the final **る** and attach **ます** or **ません**.
- **Godan Verbs:** Shift the final **-u** syllable to its corresponding **-i** syllable on the kana chart (e.g., む → み, く → き, す → し), then attach **ます** or **ません**.

> 💡 **Usage Example:** <ruby>私<rt>わたし</rt></ruby>は<ruby>毎日<rt>まいにち</rt></ruby>お<ruby>茶<rt>ちゃ</rt></ruby>を<ruby>飲<rt>の</rt></ruby>みます。(I drink green tea every day.)`,
    dialogue: [
      {
        speaker: "Ken",
        jpText: "田中さんは毎日朝ご飯を食べますか。",
        enText: "Tanaka-san, do you eat breakfast every day?",
      },
      {
        speaker: "Tanaka",
        jpText: "はい、食べます。パンを食べます。",
        enText: "Yes, I do. I eat bread.",
      },
      {
        speaker: "Ken",
        jpText: "コーヒーも飲みますか。",
        enText: "Do you drink coffee too?",
      },
      {
        speaker: "Tanaka",
        jpText: "いいえ、コーヒーは飲みません。お茶を飲みます。",
        enText: "No, I don't drink coffee. I drink green tea.",
      },
    ],
    vocabulary: [
      {
        jpText: "食べる",
        reading: "たべる",
        enText: "to eat",
      },
      {
        jpText: "飲む",
        reading: "のむ",
        enText: "to drink",
      },
      {
        jpText: "毎日",
        reading: "まいにち",
        enText: "every day",
      },
      {
        jpText: "朝ご飯",
        reading: "あさごはん",
        enText: "breakfast",
      },
      {
        jpText: "お茶",
        reading: "おちゃ",
        enText: "green tea / tea",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the correct polite affirmative form for the godan verb 飲む (to drink):",
        options: ["飲みます", "飲みません", "飲まます", "飲めます"],
        correctAnswer: "飲みます",
        explanation:
          "飲む is a godan verb ending in む; shift む to the い-row sound み and add ます to form 飲みます.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete with the polite negative of 食べる: 私は朝ご飯を___。(I do not eat breakfast.)",
        correctAnswer: "食べません",
        explanation:
          "食べる is an ichidan verb. Dropping る and adding ません forms the polite negative 食べません.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'I drink green tea every day.'",
        options: ["お茶を", "私は", "飲みます", "毎日"],
        correctAnswer: "私は毎日お茶を飲みます",
        explanation:
          "Natural Japanese order places Topic (私は) and Time adverb (毎日) first, followed by Object (お茶を) and Verb (飲みます).",
      },
    ],
  },

  "particle-wo-he-ni": {
    title: "Direct Objects (を) & Destinations (へ / に)",
    theoryMarkdown: `### 📘 Action Objects & Motion Destinations

---

#### 1. Direct Object Marker を (Pronounced *o*)

- The particle written as **を** is pronounced **o**.
- It immediately follows the noun that directly receives the action of a transitive verb.

$$\\text{[Noun]} + \\mathbf{を} + \\text{[Transitive Verb]}$$

- <ruby>本<rt>ほん</rt></ruby>**を**<ruby>読<rt>よ</rt></ruby>みます。(I read a book.)
- <ruby>水<rt>みず</rt></ruby>**を**<ruby>飲<rt>の</rt></ruby>みます。(I drink water.)

---

#### 2. Destination Markers へ (Pronounced *e*) and に

When using movement verbs like <ruby>行<rt>い</rt></ruby>く (to go), <ruby>来<rt>く</rt></ruby>る (to come), and <ruby>帰<rt>かえ</rt></ruby>る (to return home), specify the destination with **へ** or **に**:

- **へ (pronounced *e*):** Emphasizes the direction/heading towards a place.
- **に:** Emphasizes the specific arrival point or target destination.

| Example | Meaning |
| :--- | :--- |
| <ruby>学校<rt>がっこう</rt></ruby>**へ**<ruby>行<rt>い</rt></ruby>きます。 | I go to school. |
| <ruby>家<rt>うち</rt></ruby>**に**<ruby>帰<rt>かえ</rt></ruby>ります。 | I return home. |

> 💡 *Note:* In everyday conversation, へ and に are often interchangeable when indicating destinations.`,
    dialogue: [
      {
        speaker: "Aoi",
        jpText: "ケンさん、今日どこへ行きますか。",
        enText: "Ken-san, where are you going today?",
      },
      {
        speaker: "Ken",
        jpText: "私は図書館へ行きます。本を読みます。",
        enText: "I am going to the library. I will read a book.",
      },
      {
        speaker: "Aoi",
        jpText: "日本語の本ですか。",
        enText: "Is it a Japanese book?",
      },
      {
        speaker: "Ken",
        jpText:
          "はい、日本語を勉強します。あおいさんは家へ帰りますか。",
        enText:
          "Yes, I will study Japanese. Are you going home, Aoi-san?",
      },
      {
        speaker: "Aoi",
        jpText: "はい、家に帰ります。",
        enText: "Yes, I will return home.",
      },
    ],
    vocabulary: [
      {
        jpText: "行く",
        reading: "いく",
        enText: "to go",
      },
      {
        jpText: "帰る",
        reading: "かえる",
        enText: "to return / to go home",
      },
      {
        jpText: "図書館",
        reading: "としょかん",
        enText: "library",
      },
      {
        jpText: "家",
        reading: "うち",
        enText: "house / home",
      },
      {
        jpText: "勉強する",
        reading: "べんきょうする",
        enText: "to study",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Which particle marks the direct object in: 水___飲みます (I drink water)?",
        options: ["を", "は", "へ", "に"],
        correctAnswer: "を",
        explanation:
          "Particle を marks the direct object of the transitive verb 飲みます.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete the destination sentence: 明日東京___行きます。(I will go to Tokyo tomorrow.)",
        correctAnswer: "へ",
        explanation:
          "Particle へ (read 'e') marks the direction or destination of movement.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'Ken goes to the library.'",
        options: ["ケンさんは", "図書館へ", "行きます"],
        correctAnswer: "ケンさんは図書館へ行きます",
        explanation:
          "Topic (ケンさんは) + Destination (図書館へ) + Motion Verb (行きます).",
      },
    ],
  },

  "particle-ni-time": {
    title: "Time Expressions & Time Marker (に)",
    theoryMarkdown: `### 📘 Expressing Time with Particle に

To state the specific time at which an event happens, place the particle **に** directly after the time word.

---

#### 1. When to Use に vs. When NOT to Use に

| Category | Examples | Use に? |
| :--- | :--- | :---: |
| **Specific Times (Numbers / Days / Dates)** | <ruby>七時<rt>しちじ</rt></ruby> (7:00), <ruby>月曜日<rt>げつようび</rt></ruby> (Monday), <ruby>五月<rt>ごがつ</rt></ruby> (May) | **YES** (七時に) |
| **Relative Times (No Numbers)** | <ruby>今日<rt>きょう</rt></ruby> (today), <ruby>明日<rt>あした</rt></ruby> (tomorrow), <ruby>毎日<rt>まいにち</rt></ruby> (every day), <ruby>今<rt>いま</rt></ruby> (now) | **NO** (never add に) |
| **General Periods of the Day** | <ruby>朝<rt>あさ</rt></ruby> (morning), <ruby>夜<rt>よる</rt></ruby> (night) | **OPTIONAL** |

---

#### 2. Telling Time: Hours (〜時 / 〜じ)

- <ruby>一時<rt>いちじ</rt></ruby> (1:00), <ruby>二時<rt>にじ</rt></ruby> (2:00), <ruby>三時<rt>さんじ</rt></ruby> (3:00)
- **Irregular Readings:**
  - 4:00 is <ruby>四時<rt>よじ</rt></ruby> (*yoji*, NOT *yonji*)
  - 7:00 is <ruby>七時<rt>しちじ</rt></ruby> (*shichiji*, NOT *nanaji*)
  - 9:00 is <ruby>九時<rt>くじ</rt></ruby> (*kuji*, NOT *kyuuji*)
- Add **<ruby>半<rt>はん</rt></ruby>** for half past: <ruby>七時半<rt>しちじはん</rt></ruby> (7:30)`,
    dialogue: [
      {
        speaker: "Tanaka",
        jpText: "ケンさんは毎朝何時に起きますか。",
        enText: "Ken-san, what time do you wake up every morning?",
      },
      {
        speaker: "Ken",
        jpText: "私は七時に起きます。田中さんは？",
        enText: "I wake up at seven o'clock. How about you, Tanaka-san?",
      },
      {
        speaker: "Tanaka",
        jpText: "私は六時半に起きます。",
        enText: "I wake up at six-thirty.",
      },
      {
        speaker: "Ken",
        jpText: "早いですね。夜は何時に寝ますか。",
        enText: "That's early. What time do you go to bed at night?",
      },
      {
        speaker: "Tanaka",
        jpText: "十一時に寝ます。",
        enText: "I go to bed at eleven o'clock.",
      },
    ],
    vocabulary: [
      {
        jpText: "起きる",
        reading: "おきる",
        enText: "to wake up / to get up",
      },
      {
        jpText: "寝る",
        reading: "ねる",
        enText: "to sleep / to go to bed",
      },
      {
        jpText: "何時",
        reading: "なんじ",
        enText: "what time",
      },
      {
        jpText: "七時",
        reading: "しちじ",
        enText: "seven o'clock",
      },
      {
        jpText: "半",
        reading: "はん",
        enText: "half (past the hour)",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt: "Which time word must NEVER be followed by particle に?",
        options: ["明日", "七時", "月曜日", "三日"],
        correctAnswer: "明日",
        explanation:
          "Relative time words like 明日 (tomorrow) or 今日 (today) do not take the particle に.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete with the time marker: 私は毎朝七時___起きます。(I wake up at 7 o'clock every morning.)",
        correctAnswer: "に",
        explanation:
          "Specific numerical times (like 七時) require particle に to denote the point of time.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'I go to bed at eleven o'clock.'",
        options: ["寝ます", "十一時に", "私は"],
        correctAnswer: "私は十一時に寝ます",
        explanation:
          "Topic (私は) + Specific Time (十一時に) + Verb (寝ます).",
      },
    ],
  },

  "verb-mashita-masendeshita": {
    title: "Polite Past Tense (〜ました / 〜ませんでした)",
    theoryMarkdown: `### 📘 Expressing the Past: 〜ました & 〜ませんでした

To talk about actions that occurred in the past, change the polite verb ending **〜ます**.

---

#### 1. The Conjugation Pattern

| Tense | Affirmative | Negative |
| :--- | :--- | :--- |
| **Present / Future** | 〜ます (e.g., <ruby>食<rt>た</rt></ruby>べます - eat) | 〜ません (e.g., <ruby>食<rt>た</rt></ruby>べません - do not eat) |
| **Past** | **〜ました** (e.g., <ruby>食<rt>た</rt></ruby>べました - ate) | **〜ませんでした** (e.g., <ruby>食<rt>た</rt></ruby>べませんでした - did not eat) |

---

#### 2. Common Past Time Words

These relative past time expressions do **not** take the particle に:

- <ruby>昨日<rt>きのう</rt></ruby> (yesterday)
- <ruby>今朝<rt>けさ</rt></ruby> (this morning)
- <ruby>先週<rt>せんしゅう</rt></ruby> (last week)

> 💡 **Example:** <ruby>昨日<rt>きのう</rt></ruby>、<ruby>日本語<rt>にほんご</rt></ruby>を<ruby>勉強<rt>べんきょう</rt></ruby>しました。(Yesterday, I studied Japanese.)`,
    dialogue: [
      {
        speaker: "Maria",
        jpText: "ケンさん、昨日は何をしましたか。",
        enText: "Ken-san, what did you do yesterday?",
      },
      {
        speaker: "Ken",
        jpText: "私は図書館へ行きました。日本語を勉強しました。",
        enText: "I went to the library. I studied Japanese.",
      },
      {
        speaker: "Maria",
        jpText: "そうですか。私も昨日勉強しました。",
        enText: "I see. I also studied yesterday.",
      },
      {
        speaker: "Ken",
        jpText: "マリアさんはテレビを見ましたか。",
        enText: "Did you watch TV, Maria-san?",
      },
      {
        speaker: "Maria",
        jpText: "いいえ、テレビは見ませんでした。",
        enText: "No, I did not watch TV.",
      },
    ],
    vocabulary: [
      {
        jpText: "昨日",
        reading: "きのう",
        enText: "yesterday",
      },
      {
        jpText: "見る",
        reading: "みる",
        enText: "to see / to watch",
      },
      {
        jpText: "テレビ",
        reading: "てれび",
        enText: "television / TV",
      },
      {
        jpText: "しました",
        reading: "しました",
        enText: "did (polite past of する)",
      },
      {
        jpText: "今朝",
        reading: "けさ",
        enText: "this morning",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the polite past affirmative form of 行きます (to go):",
        options: ["行きました", "行きませんでした", "行きます", "行きましたん"],
        correctAnswer: "行きました",
        explanation:
          "Replace suffix 〜ます with 〜ました to form the polite past affirmative (行きました = went).",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete with the polite past negative: 昨日は勉強___。(I did not study yesterday.)",
        correctAnswer: "しませんでした",
        explanation:
          "The past negative of します (to do) is しませんでした (did not do).",
      },
      {
        order: 3,
        type: "reorder",
        prompt:
          "Arrange the words to say: 'Yesterday, I did not watch television.'",
        options: ["見ませんでした", "テレビは", "昨日は"],
        correctAnswer: "昨日はテレビは見ませんでした",
        explanation:
          "Time topic (昨日は) + Object contrast (テレビは) + Past negative verb (見ませんでした).",
      },
    ],
  },

  "existence-arimasu-imasu": {
    title: "Existence of Inanimate & Animate (あります / います)",
    theoryMarkdown: `### 📘 Expressing Existence: あります vs. います

Japanese uses two completely different verbs to express "to exist", "there is", or "to have", depending on whether the subject is capable of self-propelled movement.

---

#### 1. Inanimate Objects & Plants: あります

Use **あります** (plain form: ある) for non-living objects, plants, events, and abstract things:

- <ruby>机<rt>つくえ</rt></ruby>が**あります**。(There is a desk.)
- <ruby>部屋<rt>へや</rt></ruby>にテレビが**あります**。(There is a television in the room.)

---

#### 2. Living Beings (Humans & Animals): います

Use **います** (plain form: いる) for people and animals:

- <ruby>先生<rt>せんせい</rt></ruby>が**います**。(There is a teacher.)
- <ruby>庭<rt>にわ</rt></ruby>に<ruby>猫<rt>ねこ</rt></ruby>が**います**。(There is a cat in the garden.)

---

#### 3. Sentence Structure

$$\\text{[Location]} + \\mathbf{に} + \\text{[Entity]} + \\mathbf{が} + \\mathbf{あります / います}$$`,
    dialogue: [
      {
        speaker: "Ken",
        jpText: "田中さんの部屋に何がありますか。",
        enText: "Tanaka-san, what is in your room?",
      },
      {
        speaker: "Tanaka",
        jpText: "机とベッドがあります。テレビはありません。",
        enText: "There is a desk and a bed. There is no television.",
      },
      {
        speaker: "Ken",
        jpText: "ペットはいますか。",
        enText: "Do you have pets?",
      },
      {
        speaker: "Tanaka",
        jpText: "はい、白い猫がいます。",
        enText: "Yes, I have a white cat.",
      },
    ],
    vocabulary: [
      {
        jpText: "あります",
        reading: "あります",
        enText: "to exist (inanimate items, plants)",
      },
      {
        jpText: "います",
        reading: "います",
        enText: "to exist (living beings, humans, animals)",
      },
      {
        jpText: "部屋",
        reading: "へや",
        enText: "room",
      },
      {
        jpText: "机",
        reading: "つくえ",
        enText: "desk",
      },
      {
        jpText: "猫",
        reading: "ねこ",
        enText: "cat",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the correct verb for a living person: あそこに学生が___。",
        options: ["います", "あります", "します", "行きます"],
        correctAnswer: "います",
        explanation:
          "学生 (student) is a human being, so the existence verb います must be used.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete with the correct existence verb: 部屋に本が___。(There is a book in the room.)",
        correctAnswer: "あります",
        explanation:
          "本 (book) is an inanimate object, so あります is the correct verb.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'There is a cat in the garden.'",
        options: ["います", "庭に", "猫が"],
        correctAnswer: "庭に猫がいます",
        explanation:
          "Location with に (庭に) + Subject with が (猫が) + Animate verb (います).",
      },
    ],
  },

  "particles-de-vs-ni-location": {
    title: "Action Location (で) vs. Existence Location (に)",
    theoryMarkdown: `### 📘 Action Location (で) vs. Static Location (に)

Both **で** and **に** attach to location nouns, but they describe fundamentally different relationships with the verb that follows.

---

#### 1. Particle で: Location of Dynamic Action

Use **で** when specifying the physical site where an event or activity takes place:

- <ruby>図書館<rt>としょかん</rt></ruby>**で**<ruby>勉強<rt>べんきょう</rt></ruby>します。(I study **at** the library.)
- レストラン**で**ご飯を<ruby>食<rt>た</rt></ruby>べます。(I eat a meal **at** a restaurant.)

---

#### 2. Particle に: Location of Static Existence

Use **に** with existence verbs like **あります** and **います** to mark where something resides:

- <ruby>机<rt>つくえ</rt></ruby>の<ruby>上<rt>うえ</rt></ruby>**に**<ruby>本<rt>ほん</rt></ruby>があります。(There is a book **on** the desk.)
- <ruby>教室<rt>きょうしつ</rt></ruby>**に**<ruby>田中<rt>たなか</rt></ruby>さんがいます。(Tanaka-san is **in** the classroom.)

---

#### 3. Summary Rule

| Verb Type | Particle | Example |
| :--- | :---: | :--- |
| **Action verbs** (食べる, 読む, 勉強する) | **で** | <ruby>家<rt>うち</rt></ruby>**で**<ruby>本<rt>ほん</rt></ruby>を<ruby>読<rt>よ</rt></ruby>みます。 |
| **Existence verbs** (ある, いる) | **に** | <ruby>家<rt>うち</rt></ruby>**に**<ruby>本<rt>ほん</rt></ruby>があります。 |`,
    dialogue: [
      {
        speaker: "Aoi",
        jpText: "ケンさんはいつもどこで勉強しますか。",
        enText: "Ken-san, where do you usually study?",
      },
      {
        speaker: "Ken",
        jpText: "私は図書館で勉強します。",
        enText: "I study at the library.",
      },
      {
        speaker: "Aoi",
        jpText: "図書館に日本の辞書がありますか。",
        enText: "Are there Japanese dictionaries in the library?",
      },
      {
        speaker: "Ken",
        jpText: "はい、辞書がたくさんありますよ。",
        enText: "Yes, there are many dictionaries.",
      },
    ],
    vocabulary: [
      {
        jpText: "どこ",
        reading: "どこ",
        enText: "where",
      },
      {
        jpText: "上",
        reading: "うえ",
        enText: "on / above / top",
      },
      {
        jpText: "下",
        reading: "した",
        enText: "under / below",
      },
      {
        jpText: "教室",
        reading: "きょうしつ",
        enText: "classroom",
      },
      {
        jpText: "たくさん",
        reading: "たくさん",
        enText: "many / a lot",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the correct particle for action location: レストラン___パンを食べます。",
        options: ["で", "に", "を", "へ"],
        correctAnswer: "で",
        explanation:
          "Eating (食べます) is a dynamic action, so the location takes particle で.",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete with the static location particle: 机の上___ペンがあります。(There is a pen on the desk.)",
        correctAnswer: "に",
        explanation:
          "Existence verbs like あります require particle に to mark the location of existence.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'I read books at the library.'",
        options: ["図書館で", "本を", "読みます"],
        correctAnswer: "図書館で本を読みます",
        explanation:
          "Action Location (図書館で) + Direct Object (本を) + Verb (読みます).",
      },
    ],
  },

  "japanese-counters-quantifiers": {
    title: "Basic Counters & Quantifiers (一つ、二つ、〜人)",
    theoryMarkdown: `### 📘 Counting Things & People

Japanese uses counter suffixes attached to numbers. For general items without a specialized counter, use the **Native Japanese Number System** (Hitotsu, Futatsu...).

---

#### 1. General Item Counters (Native Japanese)

| Kanji | Kana Reading | Meaning |
| :--- | :--- | :--- |
| **一つ** | ひとつ | One item |
| **二つ** | ふたつ | Two items |
| **三つ** | みっつ | Three items |
| **四つ** | よっつ | Four items |
| **五つ** | いつつ | Five items |
| **幾つ** | いくつ | How many? |

---

#### 2. People Counter (〜人 / にん)

Notice the irregular readings for 1 and 2 people:

- **一人 (ひとり):** One person
- **二人 (ふたり):** Two people
- **三人 (さんにん):** Three people
- **四人 (よにん):** Four people (*irregular pronunciation*)
- **何人 (なんにん):** How many people?

---

#### 3. Sentence Placement

Quantifiers typically sit directly before the verb **without** any particle:

$$\\text{[Noun]} + \\mathbf{を} + \\mathbf{[Quantifier]} + \\text{[Verb]}$$

- りんごを**二つ**<ruby>買<rt>か</rt></ruby>いました。(I bought two apples.)`,
    dialogue: [
      {
        speaker: "Clerk",
        jpText: "いらっしゃいませ。何名様ですか。",
        enText: "Welcome. How many people in your party?",
      },
      {
        speaker: "Ken",
        jpText: "二人です。",
        enText: "Two people.",
      },
      {
        speaker: "Clerk",
        jpText: "ご注文は何にしますか。",
        enText: "What would you like to order?",
      },
      {
        speaker: "Ken",
        jpText: "コーヒーを二つと、ケーキを一つください。",
        enText: "Two coffees and one cake, please.",
      },
    ],
    vocabulary: [
      {
        jpText: "一つ",
        reading: "ひとつ",
        enText: "one (general item)",
      },
      {
        jpText: "二つ",
        reading: "ふたつ",
        enText: "two (general items)",
      },
      {
        jpText: "一人",
        reading: "ひとり",
        enText: "one person",
      },
      {
        jpText: "二人",
        reading: "ふたり",
        enText: "two people",
      },
      {
        jpText: "ください",
        reading: "ください",
        enText: "please give me",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the correct reading for counting two people (二人):",
        options: ["ふたり", "ひとり", "ににん", "ふたつ"],
        correctAnswer: "ふたり",
        explanation:
          "二人 uses the special native reading ふたり (futari).",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete the sentence to ask for one item: りんごを___ください。(One apple, please.)",
        correctAnswer: "一つ",
        explanation:
          "一つ (ひとつ) is the counter for one general object.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'I bought two coffees.'",
        options: ["二つ", "買いました", "コーヒーを"],
        correctAnswer: "コーヒーを二つ買いました",
        explanation:
          "Object (コーヒーを) + Quantifier (二つ) + Verb (買いました).",
      },
    ],
  },

  "particle-mo-to-ya": {
    title: "Inclusive Particle も & Listing Nouns (と / や)",
    theoryMarkdown: `### 📘 Inclusion (も) & Listing Nouns (と / や)

---

#### 1. Inclusive Particle も (Also / Too)

Particle **も** replaces **は**, **が**, or **を** to mean "also" or "too":

- <ruby>私<rt>わたし</rt></ruby>**も**<ruby>学生<rt>がくせい</rt></ruby>です。(I am **also** a student.)
- お<ruby>茶<rt>ちゃ</rt></ruby>**も**<ruby>飲<rt>の</rt></ruby>みます。(I **also** drink tea.)

---

#### 2. Exhaustive Listing with と (And)

Use **と** between nouns when naming an exhaustive list where no items are omitted:

- ペン**と**ノートを<ruby>買<rt>か</rt></ruby>いました。(I bought a pen and a notebook [and nothing else].)

---

#### 3. Non-Exhaustive Listing with や (And... among others)

Use **や** when giving representative examples from a larger group of items:

- <ruby>机<rt>つくえ</rt></ruby>の<ruby>上<rt>うえ</rt></ruby>に<ruby>本<rt>ほん</rt>**や**ペンがあります。(On the desk there are books and pens [among other things].)`,
    dialogue: [
      {
        speaker: "Maria",
        jpText: "昨日、ノートとペンを買いました。",
        enText: "Yesterday, I bought a notebook and a pen.",
      },
      {
        speaker: "Tanaka",
        jpText: "私も昨日ノートを買いました。",
        enText: "I also bought a notebook yesterday.",
      },
      {
        speaker: "Maria",
        jpText: "田中さんは辞書も買いましたか。",
        enText: "Did you also buy a dictionary, Tanaka-san?",
      },
      {
        speaker: "Tanaka",
        jpText: "いいえ、辞書は買いませんでした。",
        enText: "No, I didn't buy a dictionary.",
      },
    ],
    vocabulary: [
      {
        jpText: "買う",
        reading: "かう",
        enText: "to buy",
      },
      {
        jpText: "ノート",
        reading: "のーと",
        enText: "notebook",
      },
      {
        jpText: "ペン",
        reading: "ぺん",
        enText: "pen",
      },
      {
        jpText: "友達",
        reading: "ともだち",
        enText: "friend",
      },
      {
        jpText: "雑誌",
        reading: "ざっし",
        enText: "magazine",
      },
    ],
    exercises: [
      {
        order: 1,
        type: "multiple_choice",
        prompt:
          "Choose the particle meaning 'also/too' that replaces は: 私___学生です。",
        options: ["も", "と", "や", "で"],
        correctAnswer: "も",
        explanation:
          "Particle も replaces は to indicate inclusion ('I am also a student').",
      },
      {
        order: 2,
        type: "fill_blank",
        prompt:
          "Complete the exhaustive list of items: ペン___ノートを買いました。(I bought a pen and a notebook.)",
        correctAnswer: "と",
        explanation:
          "Particle と connects nouns exhaustively to mean 'and'.",
      },
      {
        order: 3,
        type: "reorder",
        prompt: "Arrange the words to say: 'I also study Japanese.'",
        options: ["勉強します", "日本語を", "私も"],
        correctAnswer: "私も日本語を勉強します",
        explanation:
          "Topic with inclusive particle (私も) + Object (日本語を) + Verb (勉強します).",
      },
    ],
  },
};
