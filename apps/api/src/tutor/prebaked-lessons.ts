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
};
