export type GrammaticalCase = 'nominative' | 'accusative' | 'dative';
export type Gender = 'masculine' | 'feminine' | 'neuter' | 'plural';
export type WordType = 'article' | 'noun' | 'pronoun' | 'adjective' | 'verb' | 'preposition';

export interface Blank {
  id: string;
  word: string;
  englishHint: string; // English translation of this word for the blank (NEVER include grammatical cases like 'dative' or 'accusative' in this hint)
  case?: GrammaticalCase;
  gender?: Gender;
  type: WordType;
  wrongOptions: string[];
  hints: Record<string, string>;
}

export interface Phase2Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptTags: string[];
}

export interface Sentence {
  id: string;
  parts: { text: string; blankId?: string }[]; 
  german?: string;
  difficultyLevel?: string;
  hardestWord?: string;
  english: string;
  wordTranslations?: Record<string, string>;
  blanks: Record<string, Blank>;
  phase2Questions: Phase2Question[];
  tags: string[];
}

// Try to load the generated tatoeba sentences if they exist
let generatedSentences: Sentence[] = [];
try {
  // Use require so it doesn't hard-crash the Next.js compiler if the file is missing or malformed
  generatedSentences = require('./tatoeba_sentences.json');
} catch (e) {
  console.log("No tatoeba_sentences.json found yet.");
}

export const sentences: Sentence[] = [
  ...generatedSentences,
  {
    id: "s1",
    tags: ["dative", "accusative", "two_objects"],
    english: "I give the man the apple.",
    parts: [
      { text: "Ich " }, { text: "gebe", blankId: "v1" }, { text: " " }, { text: "dem", blankId: "b1" }, { text: " " }, { text: "Mann", blankId: "n1" }, { text: " " }, { text: "den", blankId: "b2" }, { text: " " }, { text: "Apfel.", blankId: "n2" }
    ],
    blanks: {
      v1: { id: "v1", word: "gebe", englishHint: "give", type: "verb", wrongOptions: ["gibt", "geben", "gibst"], hints: { "gibt": "Wait, 'gibt' is for er/sie/es. The subject here is 'Ich'.", "geben": "Wait, 'geben' is the infinitive or for wir/sie. The subject is 'Ich'.", "gibst": "Wait, 'gibst' is for du." } },
      b1: { id: "b1", word: "dem", englishHint: "the", case: "dative", gender: "masculine", type: "article", wrongOptions: ["der", "den", "das", "des"], hints: { "der": "Wait, 'der' is nominative masculine. 'Mann' here is the receiver (indirect object), so we need dative.", "den": "Wait, 'den' is accusative masculine. The apple is what is being given (accusative), but the man is receiving it (dative).", "das": "Wait, 'das' is neuter. 'Mann' is masculine." } },
      n1: { id: "n1", word: "Mann", englishHint: "man", gender: "masculine", type: "noun", wrongOptions: ["Männer", "Mannes"], hints: { "Männer": "Wait, 'Männer' is plural. We are giving it to one man." } },
      b2: { id: "b2", word: "den", englishHint: "the", case: "accusative", gender: "masculine", type: "article", wrongOptions: ["der", "dem", "das"], hints: { "der": "Wait, 'der' is nominative. The apple is the object being given (direct object), so it's accusative.", "dem": "Wait, 'dem' is dative. The apple is not receiving anything, it is being acted upon (accusative)." } },
      n2: { id: "n2", word: "Apfel", englishHint: "apple", gender: "masculine", type: "noun", wrongOptions: ["Äpfel", "Apfels"], hints: { "Äpfel": "Wait, 'Äpfel' is the plural form (apples)." } }
    },
    phase2Questions: [
      { question: "Which word represents the dative article?", options: ["Ich", "dem", "Mann", "den", "Apfel"], correctAnswer: "dem", explanation: "In a sentence with a verb like 'geben' (to give), the person receiving the object takes the dative case. 'dem' is the dative masculine article for 'Mann'.", conceptTags: ["dative_article", "masculine_dative"] }
    ]
  },
  {
    id: "s2",
    tags: ["dative", "preposition", "mit"],
    english: "She goes to the cinema with the friend (female).",
    parts: [
      { text: "Sie " }, { text: "geht", blankId: "v1" }, { text: " mit " }, { text: "der", blankId: "b1" }, { text: " " }, { text: "Freundin", blankId: "n1" }, { text: " ins Kino." }
    ],
    blanks: {
      v1: { id: "v1", word: "geht", englishHint: "goes", type: "verb", wrongOptions: ["gehe", "gehen", "gehst"], hints: { "gehe": "Wait, 'gehe' is for 'Ich'. The subject is 'Sie' (she)." } },
      b1: { id: "b1", word: "der", englishHint: "the", case: "dative", gender: "feminine", type: "article", wrongOptions: ["die", "den", "dem"], hints: { "die": "Wait, 'die' is nominative/accusative feminine. The preposition 'mit' ALWAYS requires the dative case.", "den": "Wait, 'den' is for plural dative or masculine accusative. 'Freundin' is singular feminine.", "dem": "Wait, 'dem' is for masculine/neuter dative." } },
      n1: { id: "n1", word: "Freundin", englishHint: "friend (female)", gender: "feminine", type: "noun", wrongOptions: ["Freund", "Freundinnen"], hints: { "Freund": "Wait, 'Freund' is a male friend.", "Freundinnen": "Wait, 'Freundinnen' is plural." } }
    },
    phase2Questions: [
      { question: "Why does 'Freundin' take the article 'der' here?", options: ["Because it is masculine.", "Because the preposition 'mit' always takes the dative case.", "Because it is the subject.", "Because it is plural."], correctAnswer: "Because the preposition 'mit' always takes the dative case.", explanation: "Certain prepositions (aus, außer, bei, mit, nach, seit, von, zu) always trigger the dative case. The dative feminine article is 'der'.", conceptTags: ["dative_preposition", "feminine_dative"] }
    ]
  },
  {
    id: "s3",
    tags: ["dative", "verb_dative", "helfen"],
    english: "I am helping the child.",
    parts: [
      { text: "Ich " }, { text: "helfe", blankId: "v1" }, { text: " " }, { text: "dem", blankId: "b1" }, { text: " " }, { text: "Kind.", blankId: "n1" }
    ],
    blanks: {
      v1: { id: "v1", word: "helfe", englishHint: "help", type: "verb", wrongOptions: ["hilft", "helfen", "hilfst"], hints: { "hilft": "Wait, 'hilft' is for er/sie/es." } },
      b1: { id: "b1", word: "dem", englishHint: "the", case: "dative", gender: "neuter", type: "article", wrongOptions: ["das", "den", "der"], hints: { "das": "Wait, 'das' is nominative/accusative. The verb 'helfen' always requires dative.", "den": "Wait, 'den' is masculine accusative or plural dative. 'Kind' is singular neuter." } },
      n1: { id: "n1", word: "Kind", englishHint: "child", gender: "neuter", type: "noun", wrongOptions: ["Kinder", "Kindes"], hints: { "Kinder": "Wait, 'Kinder' is plural (children)." } }
    },
    phase2Questions: [
      { question: "What grammatical rule applies to the verb 'helfen'?", options: ["It takes an accusative object.", "It always takes a dative object.", "It takes no object."], correctAnswer: "It always takes a dative object.", explanation: "Some German verbs (helfen, danken, gefallen, gehören) take a dative object directly.", conceptTags: ["dative_verb", "neuter_dative"] }
    ]
  },
  {
    id: "s4",
    tags: ["nominative", "dative", "accusative", "two_objects"],
    english: "The dog brings the woman the ball.",
    parts: [
      { text: "Der", blankId: "b1" }, { text: " " }, { text: "Hund", blankId: "n1" }, { text: " " }, { text: "bringt", blankId: "v1" }, { text: " " }, { text: "der", blankId: "b2" }, { text: " Frau " }, { text: "den", blankId: "b3" }, { text: " Ball." }
    ],
    blanks: {
      b1: { id: "b1", word: "Der", englishHint: "The", case: "nominative", gender: "masculine", type: "article", wrongOptions: ["Den", "Dem", "Das"], hints: { "Den": "The dog is doing the action, so it is the subject (nominative).", "Dem": "The dog is the subject (nominative), not the receiver (dative)." } },
      n1: { id: "n1", word: "Hund", englishHint: "dog", gender: "masculine", type: "noun", wrongOptions: ["Hunde", "Hundes"], hints: { "Hunde": "Plural." } },
      v1: { id: "v1", word: "bringt", englishHint: "brings", type: "verb", wrongOptions: ["bringe", "bringen", "bringst"], hints: { "bringe": "For 'ich'." } },
      b2: { id: "b2", word: "der", englishHint: "the (indirect object)", case: "dative", gender: "feminine", type: "article", wrongOptions: ["die", "den", "dem"], hints: { "die": "'Frau' is receiving the ball, so it must be dative. 'die' is nominative/accusative.", "dem": "'dem' is for masculine/neuter dative. 'Frau' is feminine." } },
      b3: { id: "b3", word: "den", englishHint: "the (direct object)", case: "accusative", gender: "masculine", type: "article", wrongOptions: ["der", "dem", "das"], hints: { "der": "The ball is the object being brought (accusative). 'der' is nominative.", "dem": "The ball is the direct object (accusative), not the receiver (dative)." } }
    },
    phase2Questions: [
      { question: "Why is 'der Frau' in the dative case here?", options: ["Because she is doing the action.", "Because she is the receiver of the action (indirect object).", "Because it follows a preposition.", "Because 'Frau' is masculine."], correctAnswer: "Because she is the receiver of the action (indirect object).", explanation: "The verb 'bringen' (to bring) usually has a direct object (what is brought) and an indirect object (who receives it). The receiver takes the dative case.", conceptTags: ["dative_receiver", "feminine_dative"] }
    ]
  },
  {
    id: "s5",
    tags: ["dative", "preposition", "aus"],
    english: "We are coming out of the house.",
    parts: [
      { text: "Wir kommen " }, { text: "aus", blankId: "p1" }, { text: " " }, { text: "dem", blankId: "b1" }, { text: " " }, { text: "Haus.", blankId: "n1" }
    ],
    blanks: {
      p1: { id: "p1", word: "aus", englishHint: "out of", type: "preposition", wrongOptions: ["von", "zu", "bei"], hints: { "von": "'von' means 'from', but 'aus' specifically means 'out of' an enclosed space.", "zu": "'zu' means 'to'." } },
      b1: { id: "b1", word: "dem", englishHint: "the", case: "dative", gender: "neuter", type: "article", wrongOptions: ["das", "den", "der"], hints: { "das": "The preposition 'aus' ALWAYS requires the dative case. 'Haus' is neuter.", "den": "'den' is for masculine accusative or plural dative." } },
      n1: { id: "n1", word: "Haus", englishHint: "house", gender: "neuter", type: "noun", wrongOptions: ["Häuser", "Hauses"], hints: { "Häuser": "Plural." } }
    },
    phase2Questions: [
      { question: "Which preposition ALWAYS triggers the dative case here?", options: ["durch", "für", "aus", "gegen"], correctAnswer: "aus", explanation: "The prepositions 'aus, außer, bei, mit, nach, seit, von, zu' strictly require the dative case.", conceptTags: ["dative_preposition"] }
    ]
  },
  {
    id: "s6",
    tags: ["dative", "verb_dative", "gefallen"],
    english: "The book pleases me. (I like the book.)",
    parts: [
      { text: "Das Buch " }, { text: "gefällt", blankId: "v1" }, { text: " " }, { text: "mir.", blankId: "p1" }
    ],
    blanks: {
      v1: { id: "v1", word: "gefällt", englishHint: "pleases (likes)", type: "verb", wrongOptions: ["gefallen", "gefalle"], hints: { "gefallen": "Plural form, but 'Das Buch' is singular." } },
      p1: { id: "p1", word: "mir", englishHint: "me (to me)", case: "dative", type: "pronoun", wrongOptions: ["mich", "ich", "dir"], hints: { "mich": "'gefallen' requires a dative object. 'mich' is accusative.", "ich": "'ich' is the subject (nominative), but 'Das Buch' is the subject here.", "dir": "Means 'to you', but the hint says 'me'." } }
    },
    phase2Questions: [
      { question: "In the sentence 'Das Buch gefällt mir', what is the grammatical subject?", options: ["mir", "Das Buch", "There is no subject."], correctAnswer: "Das Buch", explanation: "The verb 'gefallen' works like 'to be pleasing to'. 'Das Buch' is doing the pleasing (subject/nominative), and it is pleasing 'to me' (dative object).", conceptTags: ["dative_verb", "nominative_subject"] }
    ]
  },
  {
    id: "s7",
    tags: ["two_way_preposition", "dative", "location"],
    english: "The picture hangs on the wall.",
    parts: [
      { text: "Das Bild " }, { text: "hängt", blankId: "v1" }, { text: " an " }, { text: "der", blankId: "b1" }, { text: " " }, { text: "Wand.", blankId: "n1" }
    ],
    blanks: {
      v1: { id: "v1", word: "hängt", englishHint: "hangs", type: "verb", wrongOptions: ["hänge", "hängen"], hints: { "hänge": "For 'ich'." } },
      b1: { id: "b1", word: "der", englishHint: "the", case: "dative", gender: "feminine", type: "article", wrongOptions: ["die", "den", "dem"], hints: { "die": "The preposition 'an' is a two-way preposition. Since there is no movement (location), it takes dative. 'Wand' is feminine, so dative feminine is 'der'.", "dem": "For masculine/neuter dative." } },
      n1: { id: "n1", word: "Wand", englishHint: "wall", gender: "feminine", type: "noun", wrongOptions: ["Wände"], hints: { "Wände": "Plural." } }
    },
    phase2Questions: [
      { question: "Why does 'an' take the dative case in this sentence?", options: ["Because 'an' always takes dative.", "Because it describes a static location (where?).", "Because 'Wand' is feminine.", "Because there is a direct object."], correctAnswer: "Because it describes a static location (where?).", explanation: "Prepositions like 'an, auf, in, unter, über' are two-way prepositions. They take the dative case when answering 'where?' (location/no movement) and accusative when answering 'where to?' (destination/movement).", conceptTags: ["two_way_preposition_dative"] }
    ]
  },
  {
    id: "s8",
    tags: ["two_way_preposition", "accusative", "motion"],
    english: "I am hanging the picture on the wall.",
    parts: [
      { text: "Ich hänge das Bild an " }, { text: "die", blankId: "b1" }, { text: " Wand." }
    ],
    blanks: {
      b1: { id: "b1", word: "die", englishHint: "the", case: "accusative", gender: "feminine", type: "article", wrongOptions: ["der", "den", "dem"], hints: { "der": "The preposition 'an' here describes movement to a destination (where to?). Therefore, it takes accusative. The accusative feminine article is 'die'.", "den": "For masculine accusative." } }
    },
    phase2Questions: [
      { question: "Compare this to 'Das Bild hängt an der Wand'. Why is it 'an DIE Wand' here?", options: ["Because 'Wand' changed gender.", "Because it is describing movement/destination (where to?).", "Because 'Ich' is the subject."], correctAnswer: "Because it is describing movement/destination (where to?).", explanation: "When an action involves movement towards a destination (answering 'Wohin?'), two-way prepositions take the accusative case.", conceptTags: ["two_way_preposition_accusative"] }
    ]
  },
  {
    id: "s9",
    tags: ["dative", "plural", "danken"],
    english: "We thank the teachers.",
    parts: [
      { text: "Wir " }, { text: "danken", blankId: "v1" }, { text: " " }, { text: "den", blankId: "b1" }, { text: " " }, { text: "Lehrern.", blankId: "n1" }
    ],
    blanks: {
      v1: { id: "v1", word: "danken", englishHint: "thank", type: "verb", wrongOptions: ["dankt", "danke"], hints: { "dankt": "For ihr/er/sie/es." } },
      b1: { id: "b1", word: "den", englishHint: "the (plural)", case: "dative", gender: "plural", type: "article", wrongOptions: ["die", "der", "dem"], hints: { "die": "'danken' requires dative. Dative plural is 'den'.", "dem": "For singular masculine/neuter." } },
      n1: { id: "n1", word: "Lehrern", englishHint: "teachers", gender: "plural", type: "noun", wrongOptions: ["Lehrer", "Lehrers"], hints: { "Lehrer": "In dative plural, most nouns add an '-n'. So 'die Lehrer' becomes 'den Lehrern'.", "Lehrers": "Genitive singular." } }
    },
    phase2Questions: [
      { question: "Notice the 'n' at the end of 'Lehrern'. Why is it there?", options: ["It's a typo.", "Because dative plural nouns add an '-n' if they don't already end in -n or -s.", "Because it is accusative masculine."], correctAnswer: "Because dative plural nouns add an '-n' if they don't already end in -n or -s.", explanation: "In the dative plural case, not only does the article change to 'den', but the noun itself gets an extra '-n' attached at the end (unless it already ends in -n or -s).", conceptTags: ["dative_plural_noun"] }
    ]
  },
  {
    id: "s10",
    tags: ["dative", "pronoun", "gehören"],
    english: "The car belongs to him.",
    parts: [
      { text: "Das Auto " }, { text: "gehört", blankId: "v1" }, { text: " " }, { text: "ihm.", blankId: "p1" }
    ],
    blanks: {
      v1: { id: "v1", word: "gehört", englishHint: "belongs", type: "verb", wrongOptions: ["gehören", "gehöre"], hints: { "gehören": "Plural." } },
      p1: { id: "p1", word: "ihm", englishHint: "to him", case: "dative", type: "pronoun", wrongOptions: ["ihn", "ihr", "er"], hints: { "ihn": "'gehören' requires dative. 'ihn' is accusative.", "ihr": "'ihr' is dative for 'she' (to her). The hint says 'to him'.", "er": "Nominative 'he'." } }
    },
    phase2Questions: [
      { question: "Which pronoun is the dative form of 'er' (he)?", options: ["ihn", "ihm", "ihr"], correctAnswer: "ihm", explanation: "'er' (nominative) -> 'ihn' (accusative) -> 'ihm' (dative).", conceptTags: ["dative_pronoun"] }
    ]
  }
];
