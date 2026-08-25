"use client";

import { useState, useEffect } from "react";
import { sentences } from "../data/sentences";
import { useStore } from "../store/useStore";
import Flashcard from "../components/Flashcard";
import NounCard from "../components/NounCard";
import { ThemeToggle } from "../components/ThemeToggle";
import { BookOpen, AlertTriangle, Image as ImageIcon } from "lucide-react";

export default function Home() {
  const { practiceMode, setPracticeMode, getNextSentenceId, missedWords, selectedLevel, setSelectedLevel, completedSentences, incrementCompletedSentences, resetProgress } = useStore();
  const [currentSentenceId, setCurrentSentenceId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // We use useEffect to avoid hydration mismatch with localStorage
  useEffect(() => {
    setMounted(true);
    setCurrentSentenceId(getNextSentenceId());
  }, [getNextSentenceId]);

  if (!mounted || !currentSentenceId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-blue-400 rounded-full mb-4"></div>
          <div className="text-gray-400 font-medium">Loading practice...</div>
        </div>
      </div>
    );
  }

  const currentSentence = sentences.find(s => s.id === currentSentenceId) || sentences[0];

  const handleNext = () => {
    incrementCompletedSentences();
    setCurrentSentenceId(getNextSentenceId(currentSentenceId));
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 font-sans">
      
      <div className="w-full max-w-2xl mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 drop-shadow-sm tracking-tight">
          <BookOpen className="text-blue-600 dark:text-blue-400 w-8 h-8 drop-shadow-md" />
          DeutschDive
        </h1>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setPracticeMode('sentences')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${practiceMode === 'sentences' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <BookOpen className="w-4 h-4" />
              Sentences
            </button>
            <button
              onClick={() => setPracticeMode('nouns')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${practiceMode === 'nouns' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <ImageIcon className="w-4 h-4" />
              Nouns
            </button>
          </div>

          {practiceMode === 'sentences' && (
            <select 
              className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              value={selectedLevel}
              onChange={(e) => {
                const level = e.target.value as any;
                setSelectedLevel(level);
                setCurrentSentenceId(getNextSentenceId(currentSentenceId));
              }}
            >
              <option value="All">All Levels</option>
              <option value="A1.1">Easy</option>
              <option value="A1.2">Medium</option>
              <option value="A2">Hard</option>
              <option value="B1+">Expert</option>
            </select>
          )}

          <ThemeToggle />
        </div>
      </div>

      {practiceMode === 'sentences' ? (
        <Flashcard 
          key={currentSentence.id} 
          sentence={currentSentence} 
          onNext={handleNext} 
        />
      ) : (
        <NounCard key="noun-card" />
      )}
      
      {practiceMode === 'sentences' && (
        <div className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500 max-w-lg">
          <p className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Portions of these deep dives are LLM-generated and may contain mistakes.
          </p>
        </div>
      )}
    </div>
  );
}
