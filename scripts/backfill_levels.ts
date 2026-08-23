import fs from 'fs';
import path from 'path';

const jsonPath = path.join(process.cwd(), 'data', 'tatoeba_sentences.json');
const wordLevelsPath = path.join(process.cwd(), 'data', 'word_levels.json');

const sentences = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const wordLevels = JSON.parse(fs.readFileSync(wordLevelsPath, 'utf8'));

let updated = 0;
for (const s of sentences) {
  if (!s.german) continue;
  
  const words = s.german.toLowerCase().replace(/[.,?!:;()"']/g, '').replace(/[0-9]/g, '').split(' ').filter(Boolean);
  
  let maxLevelValue = 0;
  let hardestWord = '';
  let hardestLevel = 'A1.1';

  for (const word of words) {
      let lvl = wordLevels[word];
      if (!lvl) {
          // If it's a completely unknown word in the old sentences, default to B1+
          lvl = 'B1+';
      }
      
      let val = 1;
      if (lvl === 'A1.2') val = 2;
      if (lvl === 'A2') val = 3;
      if (lvl === 'B1+') val = 4;

      if (val > maxLevelValue) {
          maxLevelValue = val;
          hardestWord = word;
          hardestLevel = lvl;
      }
  }

  s.difficultyLevel = hardestLevel;
  s.hardestWord = hardestWord;
  updated++;
}

fs.writeFileSync(jsonPath, JSON.stringify(sentences, null, 2));
console.log(`Updated ${updated} sentences with difficulty levels.`);
