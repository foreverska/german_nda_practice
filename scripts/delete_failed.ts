import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'data', 'tatoeba_sentences.json');
let sentences = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const failed = [
  "There are also nightclubs where flamenco is danced.",
  "You will find this in a drug store.",
  "We are two of a kind. (Literally: We are carved from the same wood.)",
  "This swimsuit looks really good on you.",
  "For the first time in ten years, he returned home."
];

sentences = sentences.filter((s: any) => !failed.includes(s.english.trim()));

fs.writeFileSync(jsonPath, JSON.stringify(sentences, null, 2));
console.log(`Deleted failed sentences.`);
