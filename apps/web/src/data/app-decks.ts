import { Deck, Card } from "@nipponic/shared";

function createStaticCard(
  id: string,
  jpText: string,
  enText: string
): Card {
  return {
    id,
    jpText,
    enText,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    nextReviewAt: new Date().toISOString(),
    lastReviewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// 1. Hiragana Simples (46 Gojūon + 25 Dakuten/Handakuten = 71 Cards)
export const HIRAGANA_BASIC_DECK: Deck = {
  id: "app-deck-hiragana-basic",
  name: "Hiragana (Básico)",
  isPublic: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  cards: [
    // Vowels
    createStaticCard("hb-1", "あ", "a"),
    createStaticCard("hb-2", "い", "i"),
    createStaticCard("hb-3", "う", "u"),
    createStaticCard("hb-4", "え", "e"),
    createStaticCard("hb-5", "お", "o"),

    // K-row
    createStaticCard("hb-6", "か", "ka"),
    createStaticCard("hb-7", "き", "ki"),
    createStaticCard("hb-8", "く", "ku"),
    createStaticCard("hb-9", "け", "ke"),
    createStaticCard("hb-10", "こ", "ko"),

    // S-row
    createStaticCard("hb-11", "さ", "sa"),
    createStaticCard("hb-12", "し", "shi"),
    createStaticCard("hb-13", "す", "su"),
    createStaticCard("hb-14", "せ", "se"),
    createStaticCard("hb-15", "そ", "so"),

    // T-row
    createStaticCard("hb-16", "た", "ta"),
    createStaticCard("hb-17", "ち", "chi"),
    createStaticCard("hb-18", "つ", "tsu"),
    createStaticCard("hb-19", "て", "te"),
    createStaticCard("hb-20", "と", "to"),

    // N-row
    createStaticCard("hb-21", "な", "na"),
    createStaticCard("hb-22", "に", "ni"),
    createStaticCard("hb-23", "ぬ", "nu"),
    createStaticCard("hb-24", "ね", "ne"),
    createStaticCard("hb-25", "の", "no"),

    // H-row
    createStaticCard("hb-26", "は", "ha"),
    createStaticCard("hb-27", "ひ", "hi"),
    createStaticCard("hb-28", "ふ", "fu"),
    createStaticCard("hb-29", "へ", "he"),
    createStaticCard("hb-30", "ほ", "ho"),

    // M-row
    createStaticCard("hb-31", "ま", "ma"),
    createStaticCard("hb-32", "み", "mi"),
    createStaticCard("hb-33", "む", "mu"),
    createStaticCard("hb-34", "め", "me"),
    createStaticCard("hb-35", "も", "mo"),

    // Y-row
    createStaticCard("hb-36", "や", "ya"),
    createStaticCard("hb-37", "ゆ", "yu"),
    createStaticCard("hb-38", "よ", "yo"),

    // R-row
    createStaticCard("hb-39", "ら", "ra"),
    createStaticCard("hb-40", "り", "ri"),
    createStaticCard("hb-41", "る", "ru"),
    createStaticCard("hb-42", "れ", "re"),
    createStaticCard("hb-43", "ろ", "ro"),

    // W & N
    createStaticCard("hb-44", "わ", "wa"),
    createStaticCard("hb-45", "を", "wo (o)"),
    createStaticCard("hb-46", "ん", "n"),

    // G-row (Dakuten)
    createStaticCard("hb-47", "が", "ga"),
    createStaticCard("hb-48", "ぎ", "gi"),
    createStaticCard("hb-49", "ぐ", "gu"),
    createStaticCard("hb-50", "げ", "ge"),
    createStaticCard("hb-51", "ご", "go"),

    // Z-row (Dakuten)
    createStaticCard("hb-52", "ざ", "za"),
    createStaticCard("hb-53", "じ", "ji"),
    createStaticCard("hb-54", "ず", "zu"),
    createStaticCard("hb-55", "ぜ", "ze"),
    createStaticCard("hb-56", "ぞ", "zo"),

    // D-row (Dakuten)
    createStaticCard("hb-57", "だ", "da"),
    createStaticCard("hb-58", "ぢ", "ji (dji)"),
    createStaticCard("hb-59", "づ", "zu (dzu)"),
    createStaticCard("hb-60", "で", "de"),
    createStaticCard("hb-61", "ど", "do"),

    // B-row (Dakuten)
    createStaticCard("hb-62", "ば", "ba"),
    createStaticCard("hb-63", "び", "bi"),
    createStaticCard("hb-64", "ぶ", "bu"),
    createStaticCard("hb-65", "べ", "be"),
    createStaticCard("hb-66", "ぼ", "bo"),

    // P-row (Handakuten)
    createStaticCard("hb-67", "ぱ", "pa"),
    createStaticCard("hb-68", "ぴ", "pi"),
    createStaticCard("hb-69", "ぷ", "pu"),
    createStaticCard("hb-70", "ぺ", "pe"),
    createStaticCard("hb-71", "ぽ", "po"),
  ],
};

// 2. Hiragana Avançado (33 Yōon Compound Sounds)
export const HIRAGANA_ADVANCED_DECK: Deck = {
  id: "app-deck-hiragana-advanced",
  name: "Hiragana (Avançado)",
  isPublic: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  cards: [
    // K-digraphs
    createStaticCard("ha-1", "きゃ", "kya"),
    createStaticCard("ha-2", "きゅ", "kyu"),
    createStaticCard("ha-3", "きょ", "kyo"),

    // S-digraphs
    createStaticCard("ha-4", "しゃ", "sha"),
    createStaticCard("ha-5", "しゅ", "shu"),
    createStaticCard("ha-6", "しょ", "sho"),

    // T-digraphs
    createStaticCard("ha-7", "ちゃ", "cha"),
    createStaticCard("ha-8", "ちゅ", "chu"),
    createStaticCard("ha-9", "ちょ", "cho"),

    // N-digraphs
    createStaticCard("ha-10", "にゃ", "nya"),
    createStaticCard("ha-11", "にゅ", "nyu"),
    createStaticCard("ha-12", "にょ", "nyo"),

    // H-digraphs
    createStaticCard("ha-13", "ひゃ", "hya"),
    createStaticCard("ha-14", "ひゅ", "hyu"),
    createStaticCard("ha-15", "ひょ", "hyo"),

    // M-digraphs
    createStaticCard("ha-16", "みゃ", "mya"),
    createStaticCard("ha-17", "みゅ", "myu"),
    createStaticCard("ha-18", "みょ", "myo"),

    // R-digraphs
    createStaticCard("ha-19", "りゃ", "rya"),
    createStaticCard("ha-20", "りゅ", "ryu"),
    createStaticCard("ha-21", "りょ", "ryo"),

    // G-digraphs
    createStaticCard("ha-22", "ぎゃ", "gya"),
    createStaticCard("ha-23", "ぎゅ", "gyu"),
    createStaticCard("ha-24", "ぎょ", "gyo"),

    // J-digraphs
    createStaticCard("ha-25", "じゃ", "ja"),
    createStaticCard("ha-26", "じゅ", "ju"),
    createStaticCard("ha-27", "じょ", "jo"),

    // B-digraphs
    createStaticCard("ha-28", "びゃ", "bya"),
    createStaticCard("ha-29", "びゅ", "byu"),
    createStaticCard("ha-30", "びょ", "byo"),

    // P-digraphs
    createStaticCard("ha-31", "ぴゃ", "pya"),
    createStaticCard("ha-32", "ぴゅ", "pyu"),
    createStaticCard("ha-33", "ぴょ", "pyo"),
  ],
};

// 3. Katakana Simples (46 Gojūon + 25 Dakuten/Handakuten = 71 Cards)
export const KATAKANA_BASIC_DECK: Deck = {
  id: "app-deck-katakana-basic",
  name: "Katakana (Básico)",
  isPublic: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  cards: [
    // Vowels
    createStaticCard("kb-1", "ア", "a"),
    createStaticCard("kb-2", "イ", "i"),
    createStaticCard("kb-3", "ウ", "u"),
    createStaticCard("kb-4", "エ", "e"),
    createStaticCard("kb-5", "オ", "o"),

    // K-row
    createStaticCard("kb-6", "カ", "ka"),
    createStaticCard("kb-7", "キ", "ki"),
    createStaticCard("kb-8", "ク", "ku"),
    createStaticCard("kb-9", "ケ", "ke"),
    createStaticCard("kb-10", "コ", "ko"),

    // S-row
    createStaticCard("kb-11", "サ", "sa"),
    createStaticCard("kb-12", "シ", "shi"),
    createStaticCard("kb-13", "ス", "su"),
    createStaticCard("kb-14", "セ", "se"),
    createStaticCard("kb-15", "ソ", "so"),

    // T-row
    createStaticCard("kb-16", "タ", "ta"),
    createStaticCard("kb-17", "チ", "chi"),
    createStaticCard("kb-18", "ツ", "tsu"),
    createStaticCard("kb-19", "テ", "te"),
    createStaticCard("kb-20", "ト", "to"),

    // N-row
    createStaticCard("kb-21", "ナ", "na"),
    createStaticCard("kb-22", "ニ", "ni"),
    createStaticCard("kb-23", "ヌ", "nu"),
    createStaticCard("kb-24", "ネ", "ne"),
    createStaticCard("kb-25", "ノ", "no"),

    // H-row
    createStaticCard("kb-26", "ハ", "ha"),
    createStaticCard("kb-27", "ヒ", "hi"),
    createStaticCard("kb-28", "フ", "fu"),
    createStaticCard("kb-29", "ヘ", "he"),
    createStaticCard("kb-30", "ホ", "ho"),

    // M-row
    createStaticCard("kb-31", "マ", "ma"),
    createStaticCard("kb-32", "ミ", "mi"),
    createStaticCard("kb-33", "ム", "mu"),
    createStaticCard("kb-34", "メ", "me"),
    createStaticCard("kb-35", "モ", "mo"),

    // Y-row
    createStaticCard("kb-36", "ヤ", "ya"),
    createStaticCard("kb-37", "ユ", "yu"),
    createStaticCard("kb-38", "ヨ", "yo"),

    // R-row
    createStaticCard("kb-39", "ラ", "ra"),
    createStaticCard("kb-40", "リ", "ri"),
    createStaticCard("kb-41", "ル", "ru"),
    createStaticCard("kb-42", "レ", "re"),
    createStaticCard("kb-43", "ロ", "ro"),

    // W & N
    createStaticCard("kb-44", "ワ", "wa"),
    createStaticCard("kb-45", "ヲ", "wo (o)"),
    createStaticCard("kb-46", "ン", "n"),

    // G-row (Dakuten)
    createStaticCard("kb-47", "ガ", "ga"),
    createStaticCard("kb-48", "ギ", "gi"),
    createStaticCard("kb-49", "グ", "gu"),
    createStaticCard("kb-50", "ゲ", "ge"),
    createStaticCard("kb-51", "ゴ", "go"),

    // Z-row (Dakuten)
    createStaticCard("kb-52", "ザ", "za"),
    createStaticCard("kb-53", "ジ", "ji"),
    createStaticCard("kb-54", "ず", "zu"),
    createStaticCard("kb-55", "ゼ", "ze"),
    createStaticCard("kb-56", "ゾ", "zo"),

    // D-row (Dakuten)
    createStaticCard("kb-57", "ダ", "da"),
    createStaticCard("kb-58", "ヂ", "ji (dji)"),
    createStaticCard("kb-59", "ヅ", "zu (dzu)"),
    createStaticCard("kb-60", "デ", "de"),
    createStaticCard("kb-61", "ド", "do"),

    // B-row (Dakuten)
    createStaticCard("kb-62", "バ", "ba"),
    createStaticCard("kb-63", "ビ", "bi"),
    createStaticCard("kb-64", "ブ", "bu"),
    createStaticCard("kb-65", "ベ", "be"),
    createStaticCard("kb-66", "ボ", "bo"),

    // P-row (Handakuten)
    createStaticCard("kb-67", "パ", "pa"),
    createStaticCard("kb-68", "ピ", "pi"),
    createStaticCard("kb-69", "プ", "pu"),
    createStaticCard("kb-70", "ペ", "pe"),
    createStaticCard("kb-71", "ポ", "po"),
  ],
};

// 4. Katakana Avançado (33 Yōon + 17 Extended Foreign Sounds = 50 Cards)
export const KATAKANA_ADVANCED_DECK: Deck = {
  id: "app-deck-katakana-advanced",
  name: "Katakana (Avançado)",
  isPublic: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  cards: [
    // Standard Digraphs
    createStaticCard("ka-1", "キャ", "kya"),
    createStaticCard("ka-2", "キュ", "kyu"),
    createStaticCard("ka-3", "キョ", "kyo"),
    createStaticCard("ka-4", "シャ", "sha"),
    createStaticCard("ka-5", "シュ", "shu"),
    createStaticCard("ka-6", "ショ", "sho"),
    createStaticCard("ka-7", "チャ", "cha"),
    createStaticCard("ka-8", "チュ", "chu"),
    createStaticCard("ka-9", "チョ", "cho"),
    createStaticCard("ka-10", "ニャ", "nya"),
    createStaticCard("ka-11", "ニュ", "nyu"),
    createStaticCard("ka-12", "ニョ", "nyo"),
    createStaticCard("ka-13", "ヒャ", "hya"),
    createStaticCard("ka-14", "ヒュ", "hyu"),
    createStaticCard("ka-15", "ヒョ", "hyo"),
    createStaticCard("ka-16", "ミャ", "mya"),
    createStaticCard("ka-17", "ミュ", "myu"),
    createStaticCard("ka-18", "ミョ", "myo"),
    createStaticCard("ka-19", "リャ", "rya"),
    createStaticCard("ka-20", "リュ", "ryu"),
    createStaticCard("ka-21", "リョ", "ryo"),
    createStaticCard("ka-22", "ギャ", "gya"),
    createStaticCard("ka-23", "ギュ", "gyu"),
    createStaticCard("ka-24", "ギョ", "gyo"),
    createStaticCard("ka-25", "ジャ", "ja"),
    createStaticCard("ka-26", "ジュ", "ju"),
    createStaticCard("ka-27", "ジョ", "jo"),
    createStaticCard("ka-28", "ビャ", "bya"),
    createStaticCard("ka-29", "ビュ", "byu"),
    createStaticCard("ka-30", "ビョ", "byo"),
    createStaticCard("ka-31", "ピャ", "pya"),
    createStaticCard("ka-32", "ピュ", "pyu"),
    createStaticCard("ka-33", "ピョ", "pyo"),

    // Extended Foreign Combinations
    createStaticCard("ka-34", "ファ", "fa"),
    createStaticCard("ka-35", "フィ", "fi"),
    createStaticCard("ka-36", "フェ", "fe"),
    createStaticCard("ka-37", "フォ", "fo"),
    createStaticCard("ka-38", "ティ", "ti"),
    createStaticCard("ka-39", "ディ", "di"),
    createStaticCard("ka-40", "トゥ", "tu"),
    createStaticCard("ka-41", "ドゥ", "du"),
    createStaticCard("ka-42", "ウィ", "wi"),
    createStaticCard("ka-43", "ウェ", "we"),
    createStaticCard("ka-44", "ウォ", "wo"),
    createStaticCard("ka-45", "ヴァ", "va"),
    createStaticCard("ka-46", "ヴィ", "vi"),
    createStaticCard("ka-47", "ヴェ", "ve"),
    createStaticCard("ka-48", "ヴォ", "vo"),
    createStaticCard("ka-49", "シェ", "she"),
    createStaticCard("ka-50", "チェ", "che"),
  ],
};

export const APP_DECKS: Deck[] = [
  HIRAGANA_BASIC_DECK,
  HIRAGANA_ADVANCED_DECK,
  KATAKANA_BASIC_DECK,
  KATAKANA_ADVANCED_DECK,
];
