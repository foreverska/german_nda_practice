import fs from 'fs';
import path from 'path';

const freqWords = new Set(
  fs.readFileSync('data/top_4000_german.txt', 'utf8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(Boolean)
);

const TARGET_KEYWORDS = [
  'dem', 'der', 'den', 'mir', 'dir', 'ihm', 'ihr', 'ihnen',
  'aus', 'außer', 'bei', 'mit', 'nach', 'seit', 'von', 'zu',
  'an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen',
  'helfen', 'hilft', 'danken', 'dankt', 'gefallen', 'gefällt', 'gehören', 'gehört', 'antworten', 'glauben',
  'geben', 'gibt', 'bringen', 'bringt', 'zeigen', 'zeigt'
];

let passed = 0;
const records = fs.readFileSync('deu_eng_full.tsv', 'utf8').split('\n');

for (const row of records) {
  const parts = row.split('\t');
  const german = parts.length > 2 ? parts[1] : parts[0];
  if (!german) continue;

  const wordCount = german.split(' ').length;
  if (wordCount < 4 || wordCount > 12) continue;

  const words = german.toLowerCase().replace(/[.,?!]/g, '').split(' ').filter(Boolean);
  
  if (!words.some(w => TARGET_KEYWORDS.includes(w))) continue;

  // Check if ALL words are in top 4000
  if (words.every(w => freqWords.has(w))) {
    passed++;
  }
}

console.log(`Passed: ${passed}`);
