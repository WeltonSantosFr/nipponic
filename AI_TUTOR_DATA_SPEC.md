# 📋 AI Tutor — Especificação Técnica de Formatos JSON

Este documento define **exatamente** o formato técnico e as estruturas JSON necessárias para gerar unidades e lições externamente (via scripts, LLMs ou arquivos estáticos) e inseri-las no **Nipponic**, mantendo 100% da compatibilidade com o fluxo e a interface atual do **AI Tutor**.

---

## 📌 Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura 1: Unidades e Tópicos Curriculares (`CurriculumTopic`)](#2-estrutura-1-unidades-e-tópicos-curriculares-curriculumtopic)
3. [Estrutura 2: Conteúdo Completo da Lição (`Lesson`)](#3-estrutura-2-conteúdo-completo-da-lição-lesson)
   - [Campo `theoryMarkdown`](#campo-theorymarkdown)
   - [Campo `dialogue`](#campo-dialogue)
   - [Campo `vocabulary`](#campo-vocabulary)
   - [Campo `exercises` (Tipos e Regras)](#campo-exercises-tipos-e-regras)
4. [Estrutura 3: JSON Completo Unificado (Unidade + Lições)](#4-estrutura-3-json-completo-unificado-unidade--lições)
5. [Mapeamento para o Banco de Dados (Prisma / PostgreSQL)](#5-mapeamento-para-o-banco-de-dados-prisma--postgresql)
6. [Regras Críticas de Validação e Qualidade](#6-regras-críticas-de-validação-e-qualidade)

---

## 1. Visão Geral da Arquitetura

O sistema do AI Tutor opera com base em duas entidades complementares:

```
[ Nível JLPT (N5, N4, N3, N2, N1) ]
       │
       ▼
[ Unidade (unitIndex + unitTitle) ]
       │
       ▼
[ Tópico Curricular (CurriculumTopic) ] ── (1 para 1) ──► [ Lição (Lesson) ]
       • id / grammarKey                                        • Teoria (theoryMarkdown)
       • title & objective                                      • Diálogo (dialogueJson)
       • lessonIndex                                            • Vocabulário (vocabularyJson)
                                                                • Exercícios (LessonExercise[])
```

- **CurriculumTopic:** Define o item listado na grade/menu lateral do currículo (título, nível, unidade, objetivo pedagógico e status).
- **Lesson:** Contém o conteúdo interativo exibido nas 4 abas do player (_Theory_, _Dialogue_, _Exercises_ e _Vocabulary_).

---

## 2. Estrutura 1: Unidades e Tópicos Curriculares (`CurriculumTopic`)

Quando uma unidade é gerada, ela agrupa de 3 a 5 tópicos diários de estudo.

### Schema do Objeto de Tópico

| Campo         | Tipo     | Obrigatório | Descrição                                     | Exemplo                                                              |
| :------------ | :------- | :---------: | :-------------------------------------------- | :------------------------------------------------------------------- |
| `lessonIndex` | `number` |     Sim     | Índice sequencial da aula no nível            | `5`                                                                  |
| `title`       | `string` |     Sim     | Título conciso da lição em inglês             | `"Polite Verbs Present & Negative (〜ます / 〜ません)"`              |
| `grammarKey`  | `string` |     Sim     | Identificador único/slug do padrão gramatical | `"verb-masu-masen"`                                                  |
| `objective`   | `string` |     Sim     | 1 a 2 frases explicando o objetivo da aula    | `"Learn polite present affirmative and negative verb conjugations."` |

### Exemplo JSON de Criação de Unidade (`GenerateUnitPayload`)

```json
{
  "unitTitle": "Daily Life & Basic Verbs",
  "topics": [
    {
      "lessonIndex": 5,
      "title": "Polite Verbs Present & Negative (〜ます / 〜ません)",
      "grammarKey": "verb-masu-masen",
      "objective": "Learn polite present affirmative (〜ます) and negative (〜ません) verb conjugations for routine actions."
    },
    {
      "lessonIndex": 6,
      "title": "Object Marker (を) & Destination Marker (へ/に)",
      "grammarKey": "particle-wo-he-ni",
      "objective": "Use particles を for direct objects and へ/に for destinations with movement verbs."
    },
    {
      "lessonIndex": 7,
      "title": "Time Expressions & Marker (に)",
      "grammarKey": "particle-ni-time",
      "objective": "Specify specific times and days of the week using particle に."
    },
    {
      "lessonIndex": 8,
      "title": "Past Tense Verbs (〜ました / 〜ませんでした)",
      "grammarKey": "verb-mashita-masendeshita",
      "objective": "Express completed and non-completed actions in the past using polite verb forms."
    }
  ]
}
```

---

## 3. Estrutura 2: Conteúdo Completo da Lição (`Lesson`)

Este é o payload JSON que alimenta uma aula individual.

### Schema Principal (`GenerateLessonPayload`)

```json
{
  "title": "string",
  "theoryMarkdown": "string",
  "dialogue": [
    {
      "speaker": "string",
      "jpText": "string",
      "enText": "string"
    }
  ],
  "vocabulary": [
    {
      "jpText": "string",
      "reading": "string",
      "enText": "string"
    }
  ],
  "exercises": [
    {
      "order": 1,
      "type": "multiple_choice | fill_blank | reorder",
      "prompt": "string",
      "options": ["string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}
```

---

### Campo `theoryMarkdown`

É uma string formatada em **Markdown** rica, contendo:

- A explicação conceitual do ponto gramatical;
- A fórmula estrutural clara (ex: `[Verbo raiz / stem] + ます`);
- Nuances de uso, contexto social e armadilhas comuns;
- Exemplos com leitura em **Furigana**.

#### Formatação de Furigana na Teoria

O leitor suporta duas sintaxes para furigana embutido no texto da teoria:

1. **Tags HTML Ruby padrão (Recomendado):** `<ruby>日本語<rt>にほんご</rt></ruby>`
2. **Sintaxe de chaves:** `{日本語|にほんご}`

Exemplo de conteúdo para `theoryMarkdown`:

```markdown
### 📘 The Polite Present Form (〜ます / 〜ません)

In Japanese, the **〜ます (masu)** form is the standard polite ending used with verbs when speaking to acquaintances, colleagues, or strangers.

---

#### 1. Structural Formula

| Verb Type     | Dictionary Form                | Stem  | Affirmative (〜ます)                       | Negative (〜ません)                                |
| :------------ | :----------------------------- | :---- | :----------------------------------------- | :------------------------------------------------- |
| **Ichidan**   | <ruby>食<rt>た</rt></ruby>べる | 食べ- | <ruby>食<rt>た</rt></ruby>べます (I eat)   | <ruby>食<rt>た</rt></ruby>べません (I don't eat)   |
| **Godan**     | <ruby>飲<rt>の</rt></ruby>む   | 飲み- | <ruby>飲<rt>の</rt></ruby>みます (I drink) | <ruby>飲<rt>の</rt></ruby>みません (I don't drink) |
| **Irregular** | する                           | し-   | します (I do)                              | しません (I don't do)                              |

---

#### 2. Key Nuances

- **Habitual Actions:** <ruby>毎日<rt>まいにち</rt></ruby>コーヒーを<ruby>飲<rt>の</rt></ruby>みます。(I drink coffee every day.)
- **Future Intent:** <ruby>明日<rt>あした</rt></ruby>、<ruby>東京<rt>とうきょう</rt></ruby>へ<ruby>行<rt>い</rt></ruby>きます。(I will go to Tokyo tomorrow.)
```

---

### Campo `dialogue`

Um array contendo entre **4 e 6 falas** entre dois personagens, contextualizando a gramática.

| Campo     | Tipo     | Descrição                                              |
| :-------- | :------- | :----------------------------------------------------- |
| `speaker` | `string` | Nome do personagem (ex: `"Ken"`, `"Aoi"`, `"Tanaka"`)  |
| `jpText`  | `string` | Fala em japonês autêntico (Kanji e Kana; nunca Romaji) |
| `enText`  | `string` | Tradução correspondente em inglês                      |

Exemplo:

```json
[
  {
    "speaker": "Ken",
    "jpText": "田中さん、毎朝何を飲みますか。",
    "enText": "Tanaka-san, what do you drink every morning?"
  },
  {
    "speaker": "Tanaka",
    "jpText": "私はお茶を飲みます。コーヒーは飲みません。",
    "enText": "I drink green tea. I don't drink coffee."
  },
  {
    "speaker": "Ken",
    "jpText": "そうですか。朝ご飯も食べますか。",
    "enText": "I see. Do you eat breakfast too?"
  },
  {
    "speaker": "Tanaka",
    "jpText": "はい、パンを食べます。",
    "enText": "Yes, I eat bread."
  }
]
```

---

### Campo `vocabulary`

Um array contendo entre **4 e 6 palavras-chave** introduzidas na lição. Estas palavras são utilizadas pelo app para permitir adição em lote aos baralhos de flashcards do usuário.

| Campo     | Tipo     | Descrição                                       |
| :-------- | :------- | :---------------------------------------------- |
| `jpText`  | `string` | Palavra em escrita japonesa normal (Kanji/Kana) |
| `reading` | `string` | Leitura fonética estrita em Hiragana/Katakana   |
| `enText`  | `string` | Tradução em inglês                              |

Exemplo:

```json
[
  {
    "jpText": "飲む",
    "reading": "のむ",
    "enText": "to drink"
  },
  {
    "jpText": "食べる",
    "reading": "たべる",
    "enText": "to eat"
  },
  {
    "jpText": "毎朝",
    "reading": "まいあさ",
    "enText": "every morning"
  },
  {
    "jpText": "お茶",
    "reading": "おちゃ",
    "enText": "tea / green tea"
  }
]
```

---

### Campo `exercises` (Tipos e Regras)

Um array contendo entre **3 e 5 exercícios**. Cada exercício deve respeitar estritamente um dos 3 tipos suportados pelo componente `InteractiveExercise`:

#### 1. Tipo: `"multiple_choice"` (Múltipla Escolha)

- `options`: Array obrigatório com as alternativas (3 a 4 opções).
- `correctAnswer`: Deve ser **idêntica** a uma das strings presentes em `options`.

```json
{
  "order": 1,
  "type": "multiple_choice",
  "prompt": "Choose the correct polite affirmative ending for 飲む (to drink):",
  "options": ["飲みます", "飲みません", "飲まます", "飲めます"],
  "correctAnswer": "飲みます",
  "explanation": "飲む is a godan verb ending in む; its stem changes from む to み, forming 飲みます."
}
```

#### 2. Tipo: `"fill_blank"` (Preenchimento de Lacunas)

- `prompt`: Frase ou instrução com lacuna indicada por travessões ou sublinhado `___`.
- `options`: Omitido ou `null`.
- `correctAnswer`: A palavra/partícula exata em japonês que preenche a lacuna.

```json
{
  "order": 2,
  "type": "fill_blank",
  "prompt": "Complete with the polite negative of 食べる: 私は朝ご飯を___。(I don't eat breakfast.)",
  "correctAnswer": "食べません",
  "explanation": "食べる is an ichidan verb. Dropping る and adding ません forms the polite negative 食べません."
}
```

#### 3. Tipo: `"reorder"` (Reordenação de Sentenças)

- `prompt`: Instrução pedindo para ordenar a frase.
- `options`: Array com os blocos/palavras soltas que o aluno clicará para montar a frase. Devem estar em ordem embaralhada.
- `correctAnswer`: A frase completa sem espaços ou com espaços normais (o frontend normaliza removendo espaços para conferência).

```json
{
  "order": 3,
  "type": "reorder",
  "prompt": "Arrange the words to say: 'I drink green tea every day.'",
  "options": ["お茶を", "私は", "飲みます", "毎日"],
  "correctAnswer": "私は毎日お茶を飲みます",
  "explanation": "The natural word order is Subject (私は) + Time adverb (毎日) + Object (お茶を) + Verb (飲みます)."
}
```

---

## 4. Estrutura 3: JSON Completo Unificado (Unidade + Lições)

Para facilitar a exportação e importação em lote gerada externamente, utilize este formato unificado:

```json
{
  "level": "N5",
  "unitIndex": 2,
  "unitTitle": "Daily Life & Basic Verbs",
  "lessons": [
    {
      "lessonIndex": 5,
      "title": "Polite Verbs Present & Negative (〜ます / 〜ません)",
      "grammarKey": "verb-masu-masen",
      "objective": "Learn polite present affirmative (〜ます) and negative (〜ません) verb conjugations for routine actions.",
      "content": {
        "title": "Polite Verbs Present & Negative (〜ます / 〜ません)",
        "theoryMarkdown": "### 📘 The Polite Present Form (〜ます / 〜ません)\n\nIn Japanese, the **〜ます** form expresses polite affirmative action...",
        "dialogue": [
          {
            "speaker": "Ken",
            "jpText": "田中さん、毎朝何を飲みますか。",
            "enText": "Tanaka-san, what do you drink every morning?"
          },
          {
            "speaker": "Tanaka",
            "jpText": "私はお茶を飲みます。",
            "enText": "I drink green tea."
          }
        ],
        "vocabulary": [
          {
            "jpText": "飲む",
            "reading": "のむ",
            "enText": "to drink"
          },
          {
            "jpText": "お茶",
            "reading": "おちゃ",
            "enText": "tea / green tea"
          }
        ],
        "exercises": [
          {
            "order": 1,
            "type": "multiple_choice",
            "prompt": "Select the polite affirmative of 飲む:",
            "options": ["飲みます", "飲みません", "飲まます"],
            "correctAnswer": "飲みます",
            "explanation": "飲む becomes 飲みます in polite form."
          },
          {
            "order": 2,
            "type": "fill_blank",
            "prompt": "Complete with the polite negative: 私はパンを___。(I don't eat bread.)",
            "correctAnswer": "食べません",
            "explanation": "食べる becomes 食べません."
          },
          {
            "order": 3,
            "type": "reorder",
            "prompt": "Reorder the sentence: 'I drink green tea.'",
            "options": ["お茶を", "私は", "飲みます"],
            "correctAnswer": "私はお茶を飲みます",
            "explanation": "Subject + Object + Verb order."
          }
        ]
      }
    }
  ]
}
```

---

## 5. Mapeamento para o Banco de Dados (Prisma / PostgreSQL)

Quando você for inserir esse JSON no banco de dados da aplicação, o relacionamento ocorre em 3 tabelas:

### 1. Tabela `CurriculumTopic`

```sql
INSERT INTO "public"."curriculumTopic" (
  "id", "level", "unitIndex", "unitTitle", "lessonIndex", "title", "grammarKey", "objective", "createdAt", "updatedAt"
) VALUES (
  'topic-uuid-1',
  'N5',
  2,
  'Daily Life & Basic Verbs',
  5,
  'Polite Verbs Present & Negative (〜ます / 〜ません)',
  'verb-masu-masen',
  'Learn polite present affirmative (〜ます) and negative (〜ません) verb conjugations for routine actions.',
  NOW(),
  NOW()
);
```

### 2. Tabela `Lesson`

```sql
INSERT INTO "public"."lesson" (
  "id", "topicId", "title", "level", "theoryMarkdown", "dialogueJson", "vocabularyJson", "createdAt", "updatedAt"
) VALUES (
  'lesson-uuid-1',
  'topic-uuid-1', -- Chave estrangeira para curriculumTopic.id
  'Polite Verbs Present & Negative (〜ます / 〜ません)',
  'N5',
  '### 📘 The Polite Present Form...',
  '[{"speaker": "Ken", "jpText": "...", "enText": "..."}]'::json,
  '[{"jpText": "飲む", "reading": "のむ", "enText": "to drink"}]'::json,
  NOW(),
  NOW()
);
```

### 3. Tabela `LessonExercise`

```sql
INSERT INTO "public"."lessonExercise" (
  "id", "lessonId", "order", "type", "prompt", "optionsJson", "correctAnswer", "explanation", "createdAt"
) VALUES (
  'exercise-uuid-1',
  'lesson-uuid-1', -- Chave estrangeira para lesson.id
  1,
  'multiple_choice',
  'Select the polite affirmative of 飲む:',
  '["飲みます", "飲みません", "飲まます"]'::json,
  '飲みます',
  '飲む becomes 飲みます in polite form.',
  NOW()
);
```

---

## 6. Regras Críticas de Validação e Qualidade

Ao gerar o conteúdo externamente com LLM ou manualmente, siga estas regras para evitar falhas de validação nos esquemas Zod do app (`@nipponic/shared`):

1. **Sem Romaji nos campos japoneses:**
   - Os campos `jpText`, `reading`, `options` (de reordenação ou vocabulário) e `correctAnswer` devem conter **Kanji e Kana autênticos**.
   - Nunca coloque identificadores como `"verb-masu-masen"` ou `"nomimasu"` como resposta ou texto em japonês.

2. **Campo `reading` puramente fonético:**
   - Deve conter apenas **Hiragana** ou **Katakana** (ex: `"がくせい"`, e não `"学生"` ou `"gakusei"`).

3. **Compatibilidade dos Exercícios:**
   - Em `multiple_choice`, a string `correctAnswer` deve ser idêntica a um dos elementos de `options`.
   - Em `reorder`, a junção dos itens em `options` deve ser capaz de formar o `correctAnswer`.

4. **Níveis JLPT Válidos:**
   - O campo `level` aceita exclusivamente um destes 5 valores exatos: `"N5"`, `"N4"`, `"N3"`, `"N2"` ou `"N1"`.

5. **Linguagem de Instrução:**
   - Conforme as diretrizes do app, títulos, explicações de teoria e enunciados de exercícios devem ser mantidos em inglês (`en`) para compatibilidade com o padrão do sistema.
