const fs = require('fs');

const content = fs.readFileSync('data/nouns.ts', 'utf8');
const match = content.match(/export const nouns: Noun\[\] = (\[[\s\S]*\]);/);
if (match) {
  const nouns = JSON.parse(match[1]);
  nouns.push({
    id: "n999",
    german: "das Konto",
    article: "das",
    word: "Konto",
    english: "account",
    emoji: "💳🧾"
  });
  
  const fileContent = `export interface Noun {
  id: string;
  german: string;
  article: string;
  word: string;
  english: string;
  emoji: string;
}

export const nouns: Noun[] = ${JSON.stringify(nouns, null, 2)};
`;
  fs.writeFileSync('data/nouns.ts', fileContent);
  console.log("Added das Konto");
}
