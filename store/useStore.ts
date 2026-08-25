import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sentences } from '../data/sentences';

interface ProgressStats {
  attempts: number;
  correct: number;
}

interface NounStats {
  mcqScore: number;
  genderScore: number;
  typeScore: number;
}

interface AppState {
  // Stats tracking concepts (e.g., "dative_article", "masculine_dative")
  conceptStats: Record<string, ProgressStats>;
  // Words specifically missed, tracking misses
  missedWords: Record<string, number>; // word -> count of misses
  // Noun stats tracking
  nounStats: Record<string, NounStats>; // nounId -> stats
  
  // Actions
  recordAttempt: (conceptTags: string[], isCorrect: boolean) => void;
  recordMissedWord: (word: string) => void;
  recordNounAttempt: (nounId: string, mode: 'mcq' | 'gender' | 'type', isCorrect: boolean) => void;
  
  // Level filter
  selectedLevel: 'All' | 'A1.1' | 'A1.2' | 'A2';
  setSelectedLevel: (level: 'All' | 'A1.1' | 'A1.2' | 'A2') => void;
  
  completedSentences: number;
  incrementCompletedSentences: () => void;
  resetProgress: () => void;
  
  // Mode
  practiceMode: 'sentences' | 'nouns';
  setPracticeMode: (mode: 'sentences' | 'nouns') => void;
  
  // Next sentence logic
  getNextSentenceId: (currentId?: string) => string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      conceptStats: {},
      missedWords: {},
      nounStats: {},
      selectedLevel: 'All',
      completedSentences: 0,
      practiceMode: 'sentences',
      
      setPracticeMode: (mode) => set({ practiceMode: mode }),
      setSelectedLevel: (level) => set({ selectedLevel: level }),
      incrementCompletedSentences: () => set((state) => ({ completedSentences: state.completedSentences + 1 })),
      resetProgress: () => set({ conceptStats: {}, missedWords: {}, nounStats: {}, completedSentences: 0 }),
      
      recordNounAttempt: (nounId, mode, isCorrect) => {
        set((state) => {
          const stats = state.nounStats[nounId] || { mcqScore: 0, genderScore: 0, typeScore: 0 };
          const newStats = { ...stats };
          
          if (mode === 'mcq') {
            newStats.mcqScore = isCorrect ? newStats.mcqScore + 1 : Math.max(0, newStats.mcqScore - 1);
          } else if (mode === 'gender') {
            newStats.genderScore = isCorrect ? newStats.genderScore + 1 : Math.max(0, newStats.genderScore - 1);
          } else if (mode === 'type') {
            newStats.typeScore = isCorrect ? newStats.typeScore + 1 : Math.max(0, newStats.typeScore - 1);
          }
          
          return { nounStats: { ...state.nounStats, [nounId]: newStats } };
        });
      },
      
      recordAttempt: (conceptTags, isCorrect) => {
        set((state) => {
          const newStats = { ...state.conceptStats };
          conceptTags.forEach(tag => {
            if (!newStats[tag]) {
              newStats[tag] = { attempts: 0, correct: 0 };
            }
            newStats[tag].attempts += 1;
            if (isCorrect) {
              newStats[tag].correct += 1;
            }
          });
          return { conceptStats: newStats };
        });
      },
      
      recordMissedWord: (word) => {
        set((state) => ({
          missedWords: {
            ...state.missedWords,
            [word]: (state.missedWords[word] || 0) + 1
          }
        }));
      },
      
      getNextSentenceId: (currentId) => {
        const state = get();
        
        let available = sentences.filter(s => s.id !== currentId);
        
        if (state.selectedLevel !== 'All') {
            available = available.filter(s => s.difficultyLevel === state.selectedLevel);
        }
        
        // If filtering leaves no sentences (e.g. no A1.1 sentences loaded), fallback to all
        if (available.length === 0) {
            available = sentences.filter(s => s.id !== currentId);
        }
        if (available.length === 0) return currentId || sentences[0].id;

        // Find weakest concepts
        const concepts = Object.entries(state.conceptStats)
          .map(([tag, stats]) => ({
            tag,
            score: stats.correct / (stats.attempts || 1)
          }))
          .sort((a, b) => a.score - b.score);
          
        const weakestConcepts = concepts.slice(0, 3).map(c => c.tag);
        
        // Try to find sentences that match weak concepts
        if (weakestConcepts.length > 0) {
          const matchingSentences = available.filter(s => 
            s.tags.some(tag => weakestConcepts.includes(tag))
          );
          
          // Only use weak concepts if we have a decent pool of sentences, 
          // AND add a 20% chance to just give a random sentence anyway for variety
          if (matchingSentences.length >= 3 && Math.random() > 0.2) {
            const randomIndex = Math.floor(Math.random() * matchingSentences.length);
            return matchingSentences[randomIndex].id;
          }
        }
        
        // Fallback: random selection
        const randomIndex = Math.floor(Math.random() * available.length);
        return available[randomIndex].id;
      }
    }),
    {
      name: 'german-practice-storage',
    }
  )
);
