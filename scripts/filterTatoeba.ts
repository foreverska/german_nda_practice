import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Target A1.2 / A2 grammar markers (we still want these grammar constructs)
const TARGET_KEYWORDS = [
  'dem', 'der', 'den', 'mir', 'dir', 'ihm', 'ihr', 'ihnen',
  'aus', 'außer', 'bei', 'mit', 'nach', 'seit', 'von', 'zu',
  'an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen',
  'helfen', 'hilft', 'danken', 'dankt', 'gefallen', 'gefällt', 'gehören', 'gehört', 'antworten', 'glauben',
  'geben', 'gibt', 'bringen', 'bringt', 'zeigen', 'zeigt'
];

function filterTatoeba() {
  const inputFile = path.join(process.cwd(), 'deu_eng_full.tsv'); 
  const outputFile = path.join(process.cwd(), 'tatoeba_filtered.tsv');
  const wordLevelsPath = path.join(process.cwd(), 'data', 'word_levels.json');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Could not find ${inputFile}.`);
    return;
  }

  const wordLevels = JSON.parse(fs.readFileSync(wordLevelsPath, 'utf8'));

  console.log('Reading massive TSV file...');
  const fileContent = fs.readFileSync(inputFile, 'utf-8');
  
  const records = parse(fileContent, {
    delimiter: '\t',
    skip_empty_lines: true,
    relax_quotes: true,
    quote: false,
  });

  console.log(`Loaded ${records.length} total sentences. Filtering...`);
  
  const filtered = [];
  const seenGerman = new Set<string>();
  
  for (const row of records) {
    const german = row.length > 2 ? row[1] : row[0]; 
    const english = row.length > 2 ? row[3] : row[1];
    
    if (!german || !english) continue;

    const normalizedGerman = german.trim();
    if (seenGerman.has(normalizedGerman)) continue;
    seenGerman.add(normalizedGerman);

    const wordCount = german.split(' ').length;
    if (wordCount < 4 || wordCount > 12) continue;

    // We clean punctuation and digits
    const words = german.toLowerCase().replace(/[.,?!:;()"']/g, '').replace(/[0-9]/g, '').split(' ').filter(Boolean);
    
    // Must contain at least one target grammar keyword
    if (!words.some(word => TARGET_KEYWORDS.includes(word))) continue;

    let maxLevelValue = 0;
    let hardestWord = '';
    let hardestLevel = 'A1.1';
    let isValid = true;

    for (const word of words) {
        if (!wordLevels[word]) {
            isValid = false;
            break;
        }
        
        const lvl = wordLevels[word];
        let val = 1;
        if (lvl === 'A1.2') val = 2;
        if (lvl === 'A2') val = 3;

        if (val > maxLevelValue) {
            maxLevelValue = val;
            hardestWord = word;
            hardestLevel = lvl;
        }
    }

    if (isValid) {
      filtered.push(`${german}\t${english}\t${hardestLevel}\t${hardestWord}`);
    }
  }

  fs.writeFileSync(outputFile, filtered.join('\n') + '\n');
  console.log(`Filtered down to ${filtered.length} sentences strictly within A1.1/A1.2/A2!`);
  console.log(`Saved to ${outputFile}`);
}

filterTatoeba();
