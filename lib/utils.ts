import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function fuzzyMatch(input: string, target: string, threshold = 0.8): boolean {
  // Normalize strings: lowercase, remove punctuation, trim extra spaces
  const clean = (s: string) => s.toLowerCase().replace(/[.,?!:;()"']/g, '').replace(/\s+/g, ' ').trim();
  
  const cleanInput = clean(input);
  const cleanTarget = clean(target);
  
  if (cleanInput === cleanTarget) return true;
  if (cleanInput.length === 0 || cleanTarget.length === 0) return false;
  
  const distance = levenshteinDistance(cleanInput, cleanTarget);
  const maxLength = Math.max(cleanInput.length, cleanTarget.length);
  
  const similarity = (maxLength - distance) / maxLength;
  return similarity >= threshold;
}
