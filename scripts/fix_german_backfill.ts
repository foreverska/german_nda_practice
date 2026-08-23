import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'data', 'tatoeba_sentences.json');
const tsvPath = path.join(process.cwd(), 'deu_eng_full.tsv'); // Use the full TSV to guarantee we find it!

const sentences = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const tsv = fs.readFileSync(tsvPath, 'utf8').split('\n');

const englishToGerman = new Map<string, string>();

console.log('Loading massive TSV into memory for mapping...');
for (const row of tsv) {
    const parts = row.split('\t');
    const german = parts.length > 2 ? parts[1] : parts[0];
    const english = parts.length > 2 ? parts[3] : parts[1];
    
    if (english && german) {
        // If there are duplicates, we just keep the first one or we can keep all.
        // Actually, we can check if the words match the blanks to be 100% sure, 
        // but just English is probably good enough for 451 sentences.
        if (!englishToGerman.has(english.trim())) {
            englishToGerman.set(english.trim(), german.trim());
        }
    }
}

let updated = 0;
let failed = 0;

for (const s of sentences) {
    const english = s.english.trim();
    const correctGerman = englishToGerman.get(english);
    
    if (correctGerman) {
        s.german = correctGerman;
        updated++;
    } else {
        console.log(`Failed to find german for: "${english}"`);
        failed++;
    }
}

fs.writeFileSync(jsonPath, JSON.stringify(sentences, null, 2));
console.log(`Fixed ${updated} sentences. Failed: ${failed}.`);
