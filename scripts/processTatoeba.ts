import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables (e.g. OPENROUTER_API_KEY)
dotenv.config({ path: '.env.local' });

if (!process.env.OPENROUTER_API_KEY) {
  console.error("ERROR: OPENROUTER_API_KEY is not set in .env.local");
  process.exit(1);
}

// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// You can use any model on OpenRouter
const MODEL_NAME = 'google/gemini-2.5-flash-lite';

const PROMPT_TEMPLATE = `
You are an expert German language teacher. I will provide a German sentence and its English translation.
Your task is to analyze it for A1.2 - A2 level grammar concepts (Nominative, Accusative, Dative cases, two-way prepositions, dative verbs, etc.).

Convert it into a specific JSON structure for a flashcard app. 
The JSON must perfectly match this TypeScript interface:

export type GrammaticalCase = 'nominative' | 'accusative' | 'dative';
export type Gender = 'masculine' | 'feminine' | 'neuter' | 'plural';
export type WordType = 'article' | 'noun' | 'pronoun' | 'adjective' | 'verb' | 'preposition';

export interface Blank {
  id: string; // e.g., "b1", "v1", "n1"
  word: string; // The exact word to be guessed
  englishHint: string; // English translation of this word for the blank (NEVER include grammatical cases like 'dative' or 'accusative' in this hint)
  case?: GrammaticalCase;
  gender?: Gender;
  type: WordType;
  wrongOptions: string[]; // 2-3 plausible wrong options
  hints: Record<string, string>; // Maps EACH wrong guess to a specific hint explaining why it's wrong based on grammar.
}

export interface Phase2Question {
  question: string; // MUST be in English
  options: string[]; // 3-4 options, MUST be in English
  correctAnswer: string;
  explanation: string; // MUST be in English
  conceptTags: string[]; // e.g., ["dative_article", "masculine"]
}

export interface Sentence {
  id: string;
  parts: { text: string; blankId?: string }[]; 
  german?: string;
  difficultyLevel?: string;
  hardestWord?: string;
  english: string;
  wordTranslations: Record<string, string>; // Map EVERY German word in the sentence to its English translation in this context.
  blanks: Record<string, Blank>;
  phase2Questions: Phase2Question[];
  tags: string[]; // e.g., ["dative", "preposition", "aus"]
}

Input German: "{german}"
Input English: "{english}"

CRITICAL RULES:
1. ONLY return the JSON representation of the \`Sentence\` object. Do not include markdown blocks or any other text.
2. The \`parts\` array must perfectly reconstruct the Input German sentence when concatenated. Spaces must be included in the \`text\` fields where necessary. (e.g. { text: "Ich " }, { text: "gebe", blankId: "v1" })
3. Identify 2 to 4 potential blanks (verbs, nouns, articles, pronouns). 
4. Provide highly educational hints for the \`wrongOptions\`.
5. Include 1 or 2 \`phase2Questions\` that test the core grammar concept of the sentence. The question, options, and explanation MUST be written entirely in English.
6. Provide a comprehensive \`wordTranslations\` dictionary that translates every single German word in the sentence to English.

Return raw JSON only.
`;

async function processSentence(german: string, english: string, hardestLevel: string, hardestWord: string, index: number, retries = 3) {
  console.log(`Processing [${index}]: ${german}`);
  
  const prompt = PROMPT_TEMPLATE
    .replace('{german}', german)
    .replace('{english}', english);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "user", content: prompt }
        ],
      });

      let responseText = response.choices[0]?.message?.content;
      if (!responseText) throw new Error("No text returned from API");
      
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        responseText = responseText.substring(firstBrace, lastBrace + 1);
      }
      
      const parsed = JSON.parse(responseText);
      parsed.id = `tatoeba_${index}_${Date.now()}`;
      parsed.german = german;
      parsed.difficultyLevel = hardestLevel;
      parsed.hardestWord = hardestWord;
      return parsed;
      
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`Failed to process sentence after ${retries} attempts: ${german}`, error.message);
        return null;
      }
      console.warn(`Attempt ${attempt} failed for sentence [${index}]. Retrying... (${error.message})`);
      // Add a small delay before retry
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function main() {
  const inputFile = path.join(process.cwd(), 'tatoeba_filtered.tsv'); // Make sure it points to the filtered one
  const outputFile = path.join(process.cwd(), 'data', 'tatoeba_sentences.json');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Could not find ${inputFile}. Please create a TSV file with German \t English columns in the project root.`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(inputFile, 'utf-8');
  const records = parse(fileContent, {
    delimiter: '\t',
    skip_empty_lines: true,
    relax_quotes: true,
    quote: false,
  });

  // Let's cap it at 500 sentences for now so you don't wait 3 days!
  // You can increase this limit later once you verify the output.
  const PROCESS_LIMIT = 10000;
  const targetRecords = records.slice(0, PROCESS_LIMIT);

  console.log(`Found ${records.length} sentences. Processing the first ${targetRecords.length}...`);
  
  const generatedSentences = [];
  const CONCURRENCY = 10; // Run 5 requests at a time
  
  for (let i = 0; i < targetRecords.length; i += CONCURRENCY) {
    const batch = targetRecords.slice(i, i + CONCURRENCY);
    const promises = batch.map((row, batchIdx) => {
      const german = row[0]; 
      const english = row[1];
      const hardestLevel = row[2] || 'A2';
      const hardestWord = row[3] || '';
      if (!german || !english) return Promise.resolve(null);
      return processSentence(german, english, hardestLevel, hardestWord, i + batchIdx);
    });

    const results = await Promise.all(promises);
    
    for (const res of results) {
      if (res) generatedSentences.push(res);
    }
    
    // Save progress periodically
    if (i % 50 === 0 && i > 0) {
      console.log(`Saved intermediate progress... (${generatedSentences.length} successful)`);
      fs.writeFileSync(outputFile, JSON.stringify(generatedSentences, null, 2));
    }
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(generatedSentences, null, 2));
  console.log(`\nSuccessfully processed ${generatedSentences.length} sentences.`);
  console.log(`Saved to ${outputFile}`);
}

main();
