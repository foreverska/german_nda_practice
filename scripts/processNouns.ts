import fs from 'fs';
import { OpenAI } from 'openai';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    "HTTP-Referer": "https://localhost:3000",
    "X-Title": "Flashcard App"
  }
});

async function main() {
  console.log("Fetching A1 Wordlist...");
  const res = await fetch('https://raw.githubusercontent.com/patsytau/anki_german_a1_vocab/main/Goethe%20Institute%20A1%20Wordlist.txt');
  const text = await res.text();
  
  const records = parse(text, {
    delimiter: '\t',
    relax_column_count: true,
    skip_empty_lines: true,
    quote: false
  });

  const nouns: { german: string, english: string }[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    if (record.length < 4) continue;
    
    let germanStr = record[1].trim();
    const englishStr = record[3].trim();
    
    // Nouns typically start with der, die, or das
    if (germanStr.startsWith('der ') || germanStr.startsWith('die ') || germanStr.startsWith('das ')) {
      // Remove the plural comma part (e.g., "die Ansage, -n" -> "die Ansage")
      const noun = germanStr.split(',')[0].trim();
      
      if (!seen.has(noun)) {
        seen.add(noun);
        nouns.push({ german: noun, english: englishStr });
      }
    }
  }

  console.log(`Found ${nouns.length} nouns.`);

  const emojis: Record<string, { emoji: string, english: string }> = {};
  const noEmojis: string[] = [];

  // Batch process
  const BATCH_SIZE = 50;
  for (let i = 0; i < nouns.length; i += BATCH_SIZE) {
    const batch = nouns.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(nouns.length/BATCH_SIZE)}...`);
    
    const prompt = `
You are creating visual flashcards for a German language learning app. 
For the following German nouns, provide the best visual representation using emojis. The goal is to allow a learner to guess the German noun purely by looking at the emoji(s), without relying on English translations.

CRITICAL INSTRUCTIONS FOR CREATIVITY & PRECISION:
1. Avoid generic associations that map better to other common words. For example, do not use 🏦 for "das Konto" (account) because a learner will guess "die Bank". Instead, use something like 💳🧾 or 💰🏦.
2. Do not use generic buildings or generic people if a more specific emoji or pair of emojis exists. For example, do not use 🏢 for "der Flughafen" (airport) - use ✈️🛫 or ✈️🏢 instead.
3. Use a highly recognizable single emoji if it's perfectly unambiguous (e.g., 🍎 for "der Apfel", 💪 for "der Arm", 🦵 for "das Bein").
4. If a single emoji isn't quite clear enough, you MUST use a **pair or trio** of emojis to get the point across (e.g., ✈️🧳 for "der Ausflug" / excursion, 🧑‍💼🏢 for "der Beruf" / profession).
5. If the concept is completely abstract and fundamentally impossible to represent visually (e.g., "das Beispiel" / example), return the string "NONE".
6. Also provide the English translation for verification.

Format your response as a JSON array of objects with "german", "emoji", and "english" keys.

Nouns to process:
${JSON.stringify(batch, null, 2)}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0].message.content || '{"data":[]}';
      
      let parsed;
      try {
        parsed = JSON.parse(responseContent);
      } catch(e) {
        console.error("Failed to parse JSON:", responseContent);
        continue;
      }
      
      let results = [];
      if (Array.isArray(parsed)) {
        results = parsed;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        results = parsed.data;
      } else {
        const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (key) results = parsed[key];
      }

      for (const res of results) {
        if (res.emoji && res.emoji !== "NONE") {
          emojis[res.german] = { emoji: res.emoji, english: res.english };
        } else {
          noEmojis.push(res.german);
        }
      }
    } catch (e) {
      console.error("Error processing batch:", e);
    }
  }

  fs.writeFileSync('data/noun_emojis.json', JSON.stringify(emojis, null, 2));
  fs.writeFileSync('data/noun_no_emojis.json', JSON.stringify(noEmojis, null, 2));
  
  console.log(`Successfully mapped ${Object.keys(emojis).length} nouns.`);
  console.log(`Failed to map ${noEmojis.length} nouns.`);

  // Generate data/nouns.ts
  const tsNouns = [];
  let id = 1;
  for (const [german, data] of Object.entries(emojis)) {
    const articleMatch = german.match(/^(der|die|das)\s+(.*)$/i);
    let article = '';
    let word = german;
    if (articleMatch) {
      article = articleMatch[1].toLowerCase();
      word = articleMatch[2];
    }
    
    tsNouns.push({
      id: `n${id++}`,
      german,
      article,
      word,
      english: data.english,
      emoji: data.emoji
    });
  }

  const fileContent = `export interface Noun {
  id: string;
  german: string;
  article: string;
  word: string;
  english: string;
  emoji: string;
}

export const nouns: Noun[] = ${JSON.stringify(tsNouns, null, 2)};
`;

  fs.writeFileSync('data/nouns.ts', fileContent);
  console.log(`Generated data/nouns.ts with ${tsNouns.length} nouns.`);
}

main().catch(console.error);
