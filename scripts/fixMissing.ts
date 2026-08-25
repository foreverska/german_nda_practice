import fs from 'fs';
import { parse } from 'csv-parse/sync';

const text = fs.readFileSync('data/tatoeba_sentences.json', 'utf8'); // Wait, we fetched from URL
