import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'data', 'tatoeba_sentences.json');
const tsvPath = path.join(process.cwd(), 'tatoeba_filtered.tsv');

const sentences = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const tsv = fs.readFileSync(tsvPath, 'utf8').split('\n');

const idMatch = /^tatoeba_(\d+)_/;

let updated = 0;
for (const s of sentences) {
  if (s.german) continue; // already has it

  const match = idMatch.exec(s.id);
  if (match) {
    const idx = parseInt(match[1], 10);
    const row = tsv[idx];
    if (row) {
      const parts = row.split('\t');
      if (parts.length > 2) {
        s.german = parts[1];
      } else {
        s.german = parts[0];
      }
      updated++;
    }
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(sentences, null, 2));
console.log(`Updated ${updated} sentences with german field.`);
