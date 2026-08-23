import fs from 'fs';
import path from 'path';

// Read the top 4000 list we just downloaded
const freqWords = fs.readFileSync('data/top_4000_german.txt', 'utf8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(Boolean);

const wordLevels: Record<string, string> = {};

freqWords.forEach((word, index) => {
    if (index < 500) {
        wordLevels[word] = 'A1.1';
    } else if (index < 1000) {
        wordLevels[word] = 'A1.2';
    } else if (index < 2500) {
        wordLevels[word] = 'A2';
    }
});

fs.writeFileSync('data/word_levels.json', JSON.stringify(wordLevels, null, 2));
console.log('Saved word_levels.json');
