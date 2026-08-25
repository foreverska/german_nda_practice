import React, { useState, useEffect, useMemo } from 'react';
import { nouns, Noun } from '../data/nouns';
import { cn } from '../lib/utils';
import { HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function NounCard() {
  const [currentNoun, setCurrentNoun] = useState<Noun | null>(null);
  const [mode, setMode] = useState<'type' | 'mcq'>('type');
  const [distractors, setDistractors] = useState<Noun[]>([]);
  
  const [typedInput, setTypedInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  
  const [showEnglishHint, setShowEnglishHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // MCQ state
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const mcqOptions = useMemo(() => {
    if (!currentNoun) return [];
    const opts = [currentNoun, ...distractors];
    // shuffle
    return opts.sort(() => Math.random() - 0.5);
  }, [currentNoun, distractors]);

  const loadNext = () => {
    // Pick a random noun
    const randomIndex = Math.floor(Math.random() * nouns.length);
    const noun = nouns[randomIndex];
    setCurrentNoun(noun);
    
    // Pick mode
    setMode(Math.random() > 0.5 ? 'type' : 'mcq');
    
    // Pick distractors for MCQ
    const randomDistractors: Noun[] = [];
    while (randomDistractors.length < 3) {
      const dist = nouns[Math.floor(Math.random() * nouns.length)];
      if (dist.id !== noun.id && !randomDistractors.find(d => d.id === dist.id)) {
        randomDistractors.push(dist);
      }
    }
    setDistractors(randomDistractors);
    
    // Reset state
    setTypedInput('');
    setIsCorrect(false);
    setIsWrong(false);
    setShowEnglishHint(false);
    setShowAnswer(false);
    setSelectedMCQ(null);
  };

  useEffect(() => {
    loadNext();
  }, []);

  if (!currentNoun) return null;

  const checkTypeAnswer = () => {
    if (isCorrect) {
      loadNext();
      return;
    }
    
    const cleanTyped = typedInput.trim().toLowerCase();
    const cleanTarget = currentNoun.german.toLowerCase();
    
    if (cleanTyped === cleanTarget || cleanTyped === currentNoun.word.toLowerCase()) {
      setIsCorrect(true);
      setIsWrong(false);
    } else {
      setIsWrong(true);
    }
  };

  const handleMCQSelect = (nounId: string) => {
    if (isCorrect) return;
    setSelectedMCQ(nounId);
    if (nounId === currentNoun.id) {
      setIsCorrect(true);
      setIsWrong(false);
    } else {
      setIsWrong(true);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
      
      {mode === 'type' ? (
        // TYPE MODE
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
            Type the German Word
          </div>
          
          <div className="text-8xl mb-6">{currentNoun.emoji}</div>
          
          {showEnglishHint && (
            <div className="mb-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-lg font-medium">
              "{currentNoun.english}"
            </div>
          )}
          
          {showAnswer && (
            <div className="mb-6 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-xl font-bold">
              {currentNoun.german}
            </div>
          )}
          
          <div className="w-full relative flex items-center gap-4">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => {
                setTypedInput(e.target.value);
                setIsWrong(false);
              }}
              disabled={isCorrect || showAnswer}
              placeholder="e.g. der Apfel"
              className={cn(
                "flex-1 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 transition-colors text-xl font-medium text-center text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2",
                isCorrect || showAnswer ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100" 
                : isWrong ? "border-red-400 focus:ring-red-500 focus:border-red-500" 
                : "border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') checkTypeAnswer();
              }}
            />
          </div>
          
          <div className="w-full flex justify-between mt-6">
            <div className="flex gap-2">
              <button
                onClick={() => setShowEnglishHint(true)}
                disabled={showEnglishHint || isCorrect || showAnswer}
                className="text-sm px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <HelpCircle className="w-4 h-4" />
                What am I looking at?
              </button>
              
              <button
                onClick={() => {
                  setShowAnswer(true);
                  setTypedInput(currentNoun.german);
                }}
                disabled={showAnswer || isCorrect}
                className="text-sm px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <AlertCircle className="w-4 h-4" />
                IDK (Show Answer)
              </button>
            </div>
            
            <button
              onClick={isCorrect || showAnswer ? loadNext : checkTypeAnswer}
              className={cn(
                "px-6 py-2 rounded-xl font-semibold transition-all flex items-center gap-2",
                isCorrect || showAnswer 
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20" 
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              )}
            >
              {isCorrect || showAnswer ? "Next" : "Check"}
              {(isCorrect || showAnswer) && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      ) : (
        // MCQ MODE
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
            Select the matching image
          </div>
          
          <div className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            {currentNoun.german}
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            {mcqOptions.map(opt => {
              const isSelected = selectedMCQ === opt.id;
              const isActualCorrect = opt.id === currentNoun.id;
              
              // Only show green/red if an option has been selected
              const showAsCorrect = selectedMCQ !== null && isActualCorrect;
              const showAsWrong = isSelected && !isActualCorrect;
              
              return (
                <button
                  key={opt.id}
                  onClick={() => handleMCQSelect(opt.id)}
                  disabled={selectedMCQ !== null && isActualCorrect}
                  className={cn(
                    "h-32 text-6xl rounded-2xl border-4 flex items-center justify-center transition-all bg-gray-50 dark:bg-gray-900/50",
                    showAsCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : showAsWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-white dark:hover:bg-gray-800"
                  )}
                >
                  {opt.emoji}
                </button>
              );
            })}
          </div>
          
          <div className="w-full flex justify-end mt-8">
            {isCorrect && (
              <button
                onClick={loadNext}
                className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
