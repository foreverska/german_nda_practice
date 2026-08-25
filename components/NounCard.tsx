import React, { useState, useEffect, useMemo } from 'react';
import { nouns, Noun } from '../data/nouns';
import { cn, normalizeGerman } from '../lib/utils';
import { HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

const LEVEL_SIZE = 20;
const REQUIRED_SCORE = 2;

type PracticeMode = 'mcq' | 'gender' | 'type';

export default function NounCard() {
  const { nounStats, recordNounAttempt } = useStore();
  
  const [currentNoun, setCurrentNoun] = useState<Noun | null>(null);
  const [mode, setMode] = useState<PracticeMode>('type');
  const [distractors, setDistractors] = useState<Noun[]>([]);
  
  const [typedInput, setTypedInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  
  const [showEnglishHint, setShowEnglishHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // MCQ state
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const [wrongMCQs, setWrongMCQs] = useState<Set<string>>(new Set());
  
  // Gender mode state
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [wrongGenders, setWrongGenders] = useState<Set<string>>(new Set());

  const mcqOptions = useMemo(() => {
    if (!currentNoun) return [];
    const opts = [currentNoun, ...distractors];
    return opts.sort(() => Math.random() - 0.5);
  }, [currentNoun, distractors]);

  const loadNext = () => {
    // 1. Determine active level
    let activeLevel = 1;
    let pool: Noun[] = [];
    
    // Group by levels
    const totalLevels = Math.ceil(nouns.length / LEVEL_SIZE);
    
    for (let l = 1; l <= totalLevels; l++) {
      const levelNouns = nouns.slice((l - 1) * LEVEL_SIZE, l * LEVEL_SIZE);
      const allMastered = levelNouns.every(n => {
        const s = nounStats[n.id];
        return s && s.typeScore >= REQUIRED_SCORE;
      });
      
      if (!allMastered || l === totalLevels) {
        activeLevel = l;
        break;
      }
    }
    
    // 2. Build pool (all nouns from level 1 to activeLevel that are NOT mastered)
    // Actually, to reinforce, let's just include all unmastered nouns up to activeLevel
    pool = nouns.slice(0, activeLevel * LEVEL_SIZE).filter(n => {
      const s = nounStats[n.id];
      return !s || s.typeScore < REQUIRED_SCORE;
    });
    
    if (pool.length === 0) {
      // If everything is completely mastered, just practice random nouns
      pool = nouns;
    }
    
    // Pick a random noun from the pool
    const noun = pool[Math.floor(Math.random() * pool.length)];
    setCurrentNoun(noun);
    
    // 3. Determine mode based on progress
    const stats = nounStats[noun.id] || { mcqScore: 0, genderScore: 0, typeScore: 0 };
    let selectedMode: PracticeMode = 'mcq';
    
    if (stats.mcqScore < REQUIRED_SCORE) {
      selectedMode = 'mcq';
    } else if (stats.genderScore < REQUIRED_SCORE) {
      selectedMode = 'gender';
    } else {
      selectedMode = 'type';
    }
    setMode(selectedMode);
    
    // Pick distractors for MCQ
    if (selectedMode === 'mcq') {
      const randomDistractors: Noun[] = [];
      while (randomDistractors.length < 3) {
        const dist = nouns[Math.floor(Math.random() * nouns.length)];
        if (dist.id !== noun.id && !randomDistractors.find(d => d.id === dist.id)) {
          randomDistractors.push(dist);
        }
      }
      setDistractors(randomDistractors);
    }
    
    // Reset state
    setTypedInput('');
    setIsCorrect(false);
    setIsWrong(false);
    setShowEnglishHint(false);
    setShowAnswer(false);
    setSelectedMCQ(null);
    setWrongMCQs(new Set());
    setSelectedGender(null);
    setWrongGenders(new Set());
  };

  useEffect(() => {
    loadNext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentNoun) return null;

  const checkTypeAnswer = () => {
    if (isCorrect) {
      loadNext();
      return;
    }
    
    const cleanTyped = normalizeGerman(typedInput);
    const cleanTarget = normalizeGerman(currentNoun.german);
    const cleanWord = normalizeGerman(currentNoun.word);
    
    if (cleanTyped === cleanTarget || cleanTyped === cleanWord) {
      setIsCorrect(true);
      setIsWrong(false);
      if (!showAnswer) {
        recordNounAttempt(currentNoun.id, 'type', true);
      }
    } else {
      setIsWrong(true);
      if (!showAnswer) {
        recordNounAttempt(currentNoun.id, 'type', false);
      }
    }
  };

  const handleMCQSelect = (nounId: string) => {
    if (isCorrect) return; // locked
    setSelectedMCQ(nounId);
    
    if (nounId === currentNoun.id) {
      setIsCorrect(true);
      setIsWrong(false);
      // Only record correct if they got it on the first try (wrongMCQs is empty)
      const firstTry = wrongMCQs.size === 0;
      recordNounAttempt(currentNoun.id, 'mcq', firstTry);
    } else {
      setWrongMCQs(prev => new Set(prev).add(nounId));
      recordNounAttempt(currentNoun.id, 'mcq', false);
    }
  };
  
  const handleGenderSelect = (article: string) => {
    if (isCorrect) return;
    setSelectedGender(article);
    
    if (article === currentNoun.article.toLowerCase()) {
      setIsCorrect(true);
      setIsWrong(false);
      const firstTry = wrongGenders.size === 0;
      recordNounAttempt(currentNoun.id, 'gender', firstTry);
    } else {
      setWrongGenders(prev => new Set(prev).add(article));
      recordNounAttempt(currentNoun.id, 'gender', false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">
      
      {mode === 'type' ? (
        // TYPE MODE
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Mastery: Type the German Word
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
                  recordNounAttempt(currentNoun.id, 'type', false);
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
      ) : mode === 'gender' ? (
        // GENDER MODE
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
            Select the Correct Article
          </div>
          
          <div className="text-8xl mb-4">{currentNoun.emoji}</div>
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            ___ {currentNoun.word}
          </div>
          
          <div className="flex gap-4 w-full justify-center">
            {['der', 'die', 'das'].map(article => {
              const isActualCorrect = article === currentNoun.article.toLowerCase();
              const isThisWrong = wrongGenders.has(article);
              const isSelected = isCorrect && isActualCorrect;
              
              return (
                <button
                  key={article}
                  onClick={() => handleGenderSelect(article)}
                  disabled={isCorrect || isThisWrong}
                  className={cn(
                    "px-8 py-4 text-2xl font-bold rounded-2xl border-4 transition-all bg-gray-50 dark:bg-gray-900/50",
                    isSelected ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : isThisWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 opacity-50"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                  )}
                >
                  {article}
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
      ) : (
        // MCQ MODE
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
            Introduction: Select the matching image
          </div>
          
          <div className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            {currentNoun.german}
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            {mcqOptions.map(opt => {
              const isActualCorrect = opt.id === currentNoun.id;
              const isThisWrong = wrongMCQs.has(opt.id);
              const showAsCorrect = isCorrect && isActualCorrect;
              
              return (
                <button
                  key={opt.id}
                  onClick={() => handleMCQSelect(opt.id)}
                  disabled={isCorrect || isThisWrong}
                  className={cn(
                    "h-32 text-6xl rounded-2xl border-4 flex items-center justify-center transition-all bg-gray-50 dark:bg-gray-900/50",
                    showAsCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : isThisWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20 opacity-50"
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
