import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'data', 'tatoeba_sentences.json');
const sentences = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let updated = 0;

for (const s of sentences) {
  if (s.blanks) {
    for (const key in s.blanks) {
      if (s.blanks[key] && s.blanks[key].englishHint) {
        const hint = s.blanks[key].englishHint;
        let cleaned = hint.replace(/\b(dative|accusative|nominative|genitive)\b/ig, '');
        // Clean up weird punctuation left behind like "(, masculine)" or "( pronoun)"
        cleaned = cleaned.replace(/,\s*,/g, ','); // replace double comma
        cleaned = cleaned.replace(/\(\s*,/g, '('); // replace comma after open paren
        cleaned = cleaned.replace(/,\s*\)/g, ')'); // replace comma before close paren
        cleaned = cleaned.replace(/\(\s*\)/g, ''); // replace empty parens
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        if (cleaned !== hint) {
          s.blanks[key].englishHint = cleaned;
          updated++;
        }
      }
    }
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(sentences, null, 2));
console.log(`Cleaned ${updated} hints.`);
