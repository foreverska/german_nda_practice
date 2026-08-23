"use client";

import React, { useState, useEffect } from 'react';
import { Sentence } from '../data/sentences';
import { useStore } from '../store/useStore';
import { cn, fuzzyMatch } from '../lib/utils';
import { useSemanticJudge } from '../lib/useSemanticJudge';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

type ScrambleWord = { id: number; word: string };

interface FlashcardProps {
  sentence: Sentence;
  onNext: () => void;
}

export default function Flashcard({ sentence, onNext }: FlashcardProps) {
  const { recordAttempt, recordMissedWord } = useStore();
  const { evaluateSimilarity, isReady, isLoading, progress, initModel } = useSemanticJudge();
  
  // Active blanks for this run (randomly selected so we aren't tested on everything every time)
  const [activeBlankIds, setActiveBlankIds] = useState<string[]>([]);
  
  // State for Phase 1 (Blanks)
  const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
  const [blankFeedback, setBlankFeedback] = useState<Record<string, { isCorrect: boolean; hint?: string }>>({});
  
  // State for Phase 1.5 (English Translation)
  const [typedEnglish, setTypedEnglish] = useState("");
  const [isScrambleMode, setIsScrambleMode] = useState(false);
  const [targetEnglishWords, setTargetEnglishWords] = useState<string[]>([]);
  const [scrambledEnglish, setScrambledEnglish] = useState<ScrambleWord[]>([]);
  const [selectedEnglish, setSelectedEnglish] = useState<ScrambleWord[]>([]);
  const [phase15Complete, setPhase15Complete] = useState(false);
  
  // Reset state when sentence changes
  useEffect(() => {
    setBlankAnswers({});
    setBlankFeedback({});
    setCurrentQuestionIndex(0);
    setQuestionAnswered(false);
    setQuestionFeedback(null);
    setSelectedOption(null);
    
    // Pick 1 to 2 random blanks to test for this sentence iteration
    const allBlanks = Object.keys(sentence.blanks);
    // Shuffle the keys
    const shuffled = [...allBlanks].sort(() => 0.5 - Math.random());
    // Pick at most 2 blanks to keep it focused
    const numToPick = Math.min(2, allBlanks.length);
    setActiveBlankIds(shuffled.slice(0, numToPick));
    
    setTypedEnglish("");
    setIsScrambleMode(false);
    
    // Setup Scramble
    const cleanEnglish = sentence.english.replace(/[.,?!:;()"']/g, '').replace(/\s+/g, ' ').trim();
    const englishWords = cleanEnglish.split(' ').filter(Boolean);
    setTargetEnglishWords(englishWords);
    
    const wordObjects = englishWords.map((word, index) => ({ id: index, word }));
    const shuffledEnglish = [...wordObjects].sort(() => 0.5 - Math.random());
    setScrambledEnglish(shuffledEnglish);
    setSelectedEnglish([]);
    
    setPhase15Complete(false);
    setPhase15IsWrong(false);
  }, [sentence.id, sentence.blanks, sentence.english]);

  // Phase management
  
  
  // State for Phase 2 (Questions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState<{ isCorrect: boolean; explanation?: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const activeQuestion = sentence.phase2Questions[currentQuestionIndex];

  // 1. Reconstruct and tokenize the text
  const { tokens, renderedBlankIds } = React.useMemo(() => {
    const fullText = sentence.german || sentence.parts.map(p => {
      if (!p.text && p.blankId && sentence.blanks[p.blankId]) {
        return sentence.blanks[p.blankId].word;
      }
      return p.text || "";
    }).join("");

    const splitTokens = fullText.split(/([a-zA-ZäöüßÄÖÜ]+)/).filter(Boolean);
    const matched = new Set<string>();
    const tokensWithBlanks = splitTokens.map(token => {
      const matchedBlankId = Object.keys(sentence.blanks).find(id => {
        return sentence.blanks[id].word === token && !matched.has(id);
      });
      if (matchedBlankId) {
        matched.add(matchedBlankId);
      }
      return { token, matchedBlankId };
    });

    return { tokens: tokensWithBlanks, renderedBlankIds: Array.from(matched) };
  }, [sentence]);

  // Phase management
  const validActiveBlanks = activeBlankIds.filter(id => renderedBlankIds.includes(id));
  const allBlanksAnsweredCorrectly = validActiveBlanks.length > 0 && validActiveBlanks.every(
    (blankId) => blankFeedback[blankId]?.isCorrect
  );
  // If NO active blanks could be rendered at all, we just auto-complete phase 1
  const phase1Complete = validActiveBlanks.length === 0 || allBlanksAnsweredCorrectly;

  // Preload the embedding model as soon as phase 1 is complete
  useEffect(() => {
    if (phase1Complete && !isReady && !isLoading) {
      initModel();
    }
  }, [phase1Complete, isReady, isLoading, initModel]);

  const phase2Complete = phase15Complete && currentQuestionIndex >= sentence.phase2Questions.length;

  const [phase15IsWrong, setPhase15IsWrong] = useState(false);

  // Check phase 1.5 correctness
  const handleCheckTranslation = async () => {
    if (phase15Complete) return;
    
    // Semantic match
    const cleanTyped = typedEnglish.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase().trim();
    const cleanTarget = sentence.english.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase().trim();
    
    const sim = await evaluateSimilarity(cleanTyped, cleanTarget);
    console.log(`Semantic similarity between "${cleanTyped}" and "${cleanTarget}":`, sim);
    
    const isCorrect = sim >= 0.85;
    
    if (isCorrect) {
      setPhase15Complete(true);
      setPhase15IsWrong(false);
    } else {
      setPhase15IsWrong(true);
    }
  };

  // Check scramble correctness automatically
  useEffect(() => {
    if (isScrambleMode && selectedEnglish.length === targetEnglishWords.length && selectedEnglish.length > 0) {
      const isCorrect = selectedEnglish.every((w, i) => w.word === targetEnglishWords[i]);
      if (isCorrect) {
        setPhase15Complete(true);
        setPhase15IsWrong(false);
      } else {
        setPhase15IsWrong(true);
      }
    } else if (isScrambleMode) {
      setPhase15IsWrong(false);
    }
  }, [selectedEnglish, targetEnglishWords, isScrambleMode]);

  const handleSelectWord = (wordObj: ScrambleWord) => {
    if (phase15Complete) return;
    if (!selectedEnglish.find(w => w.id === wordObj.id)) {
      setSelectedEnglish([...selectedEnglish, wordObj]);
    }
  };

  const handleDeselectWord = (wordObj: ScrambleWord) => {
    if (phase15Complete) return;
    setSelectedEnglish(selectedEnglish.filter(w => w.id !== wordObj.id));
  };

  const handleBlankSubmit = (blankId: string, answer: string) => {
    const blank = sentence.blanks[blankId];
    const isCorrect = answer.toLowerCase().trim() === blank.word.toLowerCase();
    
    // Track stats
    if (!isCorrect) {
      recordMissedWord(blank.word);
      // Only record case/gender if it applies to this word
      if (blank.case && blank.gender) {
         recordAttempt([`case_${blank.case}`, `gender_${blank.gender}`], false);
      } else if (blank.type) {
         recordAttempt([`type_${blank.type}`], false);
      }
    } else {
      if (blank.case && blank.gender) {
         recordAttempt([`case_${blank.case}`, `gender_${blank.gender}`], true);
      } else if (blank.type) {
         recordAttempt([`type_${blank.type}`], true);
      }
    }

    setBlankFeedback(prev => ({
      ...prev,
      [blankId]: {
        isCorrect,
        hint: isCorrect ? "Correct!" : (blank.hints[answer] || "Incorrect, try again.")
      }
    }));
  };

  const handleQuestionSubmit = (option: string) => {
    if (questionAnswered) return;
    
    setSelectedOption(option);
    const isCorrect = option === activeQuestion.correctAnswer;
    
    recordAttempt(activeQuestion.conceptTags, isCorrect);
    
    setQuestionFeedback({
      isCorrect,
      explanation: activeQuestion.explanation
    });
    setQuestionAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < sentence.phase2Questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionAnswered(false);
      setQuestionFeedback(null);
      setSelectedOption(null);
    } else {
      onNext();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      
      {/* Phase 1: Sentence Blanks */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Phase 1: Fill in the Blanks</h2>
        
        <div className="text-xl md:text-2xl font-medium leading-loose flex flex-wrap items-end gap-y-4">
          {tokens.map(({ token, matchedBlankId }, idx) => {
              if (matchedBlankId) {
                const blank = sentence.blanks[matchedBlankId];
                const isActiveBlank = validActiveBlanks.includes(matchedBlankId);
                const fb = blankFeedback[matchedBlankId];
                const isAnsweredCorrectly = fb?.isCorrect;

                if (!isActiveBlank) {
                  return (
                    <div key={idx} className="inline-flex flex-col items-center mx-1 relative group cursor-help">
                      <span className="pb-1 font-bold text-gray-900 dark:text-gray-200 border-b-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {blank.word}
                      </span>
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10 shadow-sm">
                        {blank.englishHint}
                        <svg className="absolute text-gray-900 dark:text-gray-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="inline-flex flex-col items-center mx-1 relative group">
                    {isAnsweredCorrectly ? (
                      <span className="text-green-600 font-bold border-b-2 border-green-600 px-2 pb-1">
                        {blank.word}
                      </span>
                    ) : (
                      <div className="relative flex flex-col items-center">
                        <select 
                          className={cn(
                            "appearance-none bg-gray-50 border-b-2 border-gray-300 px-4 py-1 pb-1 outline-none text-center font-bold text-blue-600 cursor-pointer min-w-[80px]",
                            fb && !fb.isCorrect && "border-red-500 text-red-600"
                          )}
                          value={blankAnswers[matchedBlankId] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBlankAnswers(prev => ({ ...prev, [matchedBlankId]: val }));
                            if (val) handleBlankSubmit(matchedBlankId, val);
                          }}
                        >
                          <option value="" disabled>___</option>
                          {Array.from(new Set([blank.word, ...blank.wrongOptions])).sort().map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        
                        {fb && !fb.isCorrect && (
                          <div className="absolute top-full mt-2 w-48 p-3 bg-red-50 dark:bg-red-900/90 text-red-800 dark:text-red-200 text-xs rounded-md shadow-lg z-10 border border-red-200 dark:border-red-800">
                            {fb.hint}
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{blank.englishHint}</span>
                  </div>
                );
              }

              // Check if we have a word translation
              const translation = sentence.wordTranslations?.[token] || sentence.wordTranslations?.[token.toLowerCase()];

              // Normal text/punctuation/spaces
              if (translation) {
                return (
                  <span key={idx} className="pb-1 mx-1 relative group cursor-help inline-flex flex-col items-center">
                    <span className="border-b-2 border-dotted border-gray-300 dark:border-gray-600 group-hover:border-gray-500 dark:group-hover:border-gray-400 transition-colors">
                      {token}
                    </span>
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10 shadow-sm">
                      {translation}
                      <svg className="absolute text-gray-800 dark:text-gray-700 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                    </div>
                  </span>
                );
              }

              return <span key={idx} className="pb-1 whitespace-pre-wrap dark:text-gray-200">{token}</span>;
          })}
        </div>
        
      {/* Phase 1.5: English Translation */}
      {phase1Complete && (
        <div className="mb-8 mt-8 pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phase 1.5: Translate to English</h2>
            {!phase15Complete && (
              <button 
                onClick={() => {
                  setIsScrambleMode(!isScrambleMode);
                  setPhase15IsWrong(false);
                }}
                className="text-xs font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                {isScrambleMode ? "Use Keyboard" : "Use Word Bank"}
              </button>
            )}
          </div>
          
          {isScrambleMode ? (
            <div>
              <div className={cn(
                "min-h-[60px] p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 mb-6 flex flex-wrap gap-2 items-center transition-colors",
                phase15IsWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"
              )}>
                {selectedEnglish.length === 0 && <span className="text-gray-500 dark:text-gray-400 italic">Click words to construct the translation...</span>}
                {selectedEnglish.map((wordObj) => (
                  <button
                    key={`selected-${wordObj.id}`}
                    onClick={() => handleDeselectWord(wordObj)}
                    className={cn(
                      "px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm font-medium transition-colors hover:border-gray-400 dark:hover:border-gray-500 dark:text-gray-200 cursor-pointer",
                      phase15Complete && "border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 pointer-events-none",
                      phase15IsWrong && "border-red-300 dark:border-red-500 text-red-700 dark:text-red-400"
                    )}
                  >
                    {wordObj.word}
                  </button>
                ))}
              </div>

              {!phase15Complete && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {scrambledEnglish.map((wordObj) => {
                    const isSelected = selectedEnglish.some(w => w.id === wordObj.id);
                    return (
                      <button
                        key={`bank-${wordObj.id}`}
                        onClick={() => handleSelectWord(wordObj)}
                        disabled={isSelected}
                        className={cn(
                          "px-4 py-2 border-2 rounded-lg shadow-sm font-medium transition-all duration-200 cursor-pointer dark:text-gray-200",
                          isSelected 
                            ? "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 pointer-events-none"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        )}
                      >
                        {wordObj.word}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={typedEnglish}
                onChange={(e) => setTypedEnglish(e.target.value)}
                disabled={phase15Complete}
                placeholder="Type the English translation..."
                className={cn(
                  "w-full p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 transition-colors text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2",
                  phase15Complete ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100" 
                  : phase15IsWrong ? "border-red-400 focus:ring-red-500 focus:border-red-500" 
                  : "border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckTranslation();
                }}
              />
              
              {!phase15Complete && (
                <div className="flex gap-2 self-end">
                  <button
                    onClick={() => {
                      setTypedEnglish(sentence.english);
                      setPhase15Complete(true);
                      setPhase15IsWrong(false);
                    }}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleCheckTranslation}
                    disabled={typedEnglish.trim().length === 0 || isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors min-w-[100px] flex justify-center items-center"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 transform -rotate-90 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"></circle>
                          <circle 
                            cx="12" cy="12" r="10" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={62.83}
                            strokeDashoffset={62.83 - (Math.max(progress, 5) / 100) * 62.83}
                            className="transition-all duration-300 ease-out"
                          ></circle>
                        </svg>
                        {progress > 0 && progress < 100 ? `${progress}%` : ''}
                      </span>
                    ) : (
                      "Check"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {phase15IsWrong && !phase15Complete && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400 text-center font-medium">Not quite right, try again or skip!</p>
          )}

          {phase15Complete && (
            <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg font-semibold flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Translation Correct!
            </div>
          )}
        </div>
      )}
      </div>

      {/* Phase 2: Questions */}
      {phase15Complete && activeQuestion && (
        <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-200">
          <h2 className="text-sm font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center">
            Phase 2: Deep Dive
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 py-1 px-2 rounded-full">
              {currentQuestionIndex + 1} / {sentence.phase2Questions.length}
            </span>
          </h2>
          
          <p className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">{activeQuestion.question}</p>
          
          <div className="space-y-3">
            {activeQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt === activeQuestion.correctAnswer;
              
              let btnClass = "border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200";
              
              if (questionAnswered) {
                if (isCorrectOpt) {
                  btnClass = "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-medium";
                } else if (isSelected && !isCorrectOpt) {
                  btnClass = "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400";
                } else {
                  btnClass = "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50 text-gray-500 dark:text-gray-500";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleQuestionSubmit(opt)}
                  disabled={questionAnswered}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex justify-between items-center cursor-pointer disabled:cursor-default",
                    btnClass
                  )}
                >
                  <span>{opt}</span>
                  {questionAnswered && isCorrectOpt && <CheckCircle2 className="text-green-500 w-5 h-5" />}
                  {questionAnswered && isSelected && !isCorrectOpt && <XCircle className="text-red-500 w-5 h-5" />}
                </button>
              );
            })}
          </div>

          {questionAnswered && questionFeedback && (
            <div className={cn(
              "mt-4 p-4 rounded-lg",
              questionFeedback.isCorrect ? "bg-green-100 text-green-800" : "bg-blue-50 text-blue-800 border border-blue-100"
            )}>
              <p className="font-semibold mb-1">
                {questionFeedback.isCorrect ? "Spot on!" : "Here's why:"}
              </p>
              <p className="text-sm">{questionFeedback.explanation}</p>
              
              <button 
                onClick={handleNextQuestion}
                className="mt-4 flex items-center justify-center w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {currentQuestionIndex < sentence.phase2Questions.length - 1 ? 'Next Question' : 'Next Sentence'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      )}
      
      {phase2Complete && !activeQuestion && (
        <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-200">
           <button 
                onClick={onNext}
                className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md cursor-pointer"
              >
                Continue to Next Sentence
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
        </div>
      )}
      
    </div>
  );
}
