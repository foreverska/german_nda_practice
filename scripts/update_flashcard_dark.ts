import fs from 'fs';
import path from 'path';

let content = fs.readFileSync(path.join(process.cwd(), 'components/Flashcard.tsx'), 'utf-8');

// Container
content = content.replace('bg-white rounded-xl shadow-lg border border-gray-100', 'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700');

// Phase 1 Header
content = content.replace('text-gray-500 uppercase', 'text-gray-500 dark:text-gray-400 uppercase');

// Phase 1 inactive blanks
content = content.replace('text-gray-700 border-b-2 border-dashed border-gray-300 group-hover:border-blue-400 group-hover:text-blue-600', 'text-gray-700 dark:text-gray-200 border-b-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400');
content = content.replace('bg-gray-900 text-white', 'bg-gray-900 dark:bg-gray-700 text-white');
content = content.replace('text-gray-900 h-2', 'text-gray-900 dark:text-gray-700 h-2');

// Phase 1 active blanks Select
content = content.replace('"text-lg font-bold text-center border-b-2 bg-transparent focus:outline-none appearance-none cursor-pointer transition-colors px-2 pb-1",', '"text-lg font-bold text-center border-b-2 bg-transparent focus:outline-none appearance-none cursor-pointer transition-colors px-2 pb-1 dark:text-gray-100",');
content = content.replace('!fb ? "border-blue-300 text-blue-700 hover:border-blue-500 bg-blue-50" : "border-red-500 text-red-600 bg-red-50"', '!fb ? "border-blue-300 text-blue-700 dark:text-blue-300 hover:border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30"');
content = content.replace('bg-red-50 text-red-800 text-xs rounded-md shadow-lg z-10 border border-red-200', 'bg-red-50 dark:bg-red-900/90 text-red-800 dark:text-red-200 text-xs rounded-md shadow-lg z-10 border border-red-200 dark:border-red-800');

// English hint
content = content.replace('text-gray-400 mt-1', 'text-gray-400 dark:text-gray-500 mt-1');

// Word translations
content = content.replace('border-gray-300 group-hover:border-gray-500', 'border-gray-300 dark:border-gray-600 group-hover:border-gray-500 dark:group-hover:border-gray-400');
content = content.replace('bg-gray-800 text-white', 'bg-gray-800 dark:bg-gray-700 text-white');
content = content.replace('text-gray-800 h-2 w-full', 'text-gray-800 dark:text-gray-700 h-2 w-full');

// Tokens Normal Text
content = content.replace('className="pb-1 whitespace-pre-wrap">{token}</span>', 'className="pb-1 whitespace-pre-wrap dark:text-gray-200">{token}</span>');

// Phase 1.5 Header & Container
content = content.replace('border-gray-200"', 'border-gray-200 dark:border-gray-700"');
content = content.replace('border-gray-200 mb-6 flex flex-wrap gap-2 items-center transition-colors",', 'border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap gap-2 items-center transition-colors",');

// Phase 1.5 Backgrounds
content = content.replace('"min-h-[60px] p-4 bg-gray-50', '"min-h-[60px] p-4 bg-gray-50 dark:bg-gray-900/50');
content = content.replace('phase15IsWrong ? "border-red-400 bg-red-50" : "border-gray-200"', 'phase15IsWrong ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"');
content = content.replace('text-gray-400 italic', 'text-gray-400 dark:text-gray-500 italic');
content = content.replace('"px-4 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm font-medium transition-colors hover:border-gray-400 cursor-pointer",', '"px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm font-medium transition-colors hover:border-gray-400 dark:hover:border-gray-500 dark:text-gray-200 cursor-pointer",');
content = content.replace('phase15Complete && "border-green-500 text-green-700 bg-green-50 pointer-events-none",', 'phase15Complete && "border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 pointer-events-none",');
content = content.replace('phase15IsWrong && "border-red-300 text-red-700"', 'phase15IsWrong && "border-red-300 dark:border-red-500 text-red-700 dark:text-red-400"');

// Phase 1.5 Bank
content = content.replace('"px-4 py-2 border-2 rounded-lg shadow-sm font-medium transition-all duration-200 cursor-pointer",', '"px-4 py-2 border-2 rounded-lg shadow-sm font-medium transition-all duration-200 cursor-pointer dark:text-gray-200",');
content = content.replace('? "bg-gray-100 border-gray-200 text-gray-300 pointer-events-none"', '? "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 pointer-events-none"');
content = content.replace(': "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50"', ': "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"');

// Phase 1.5 Correct
content = content.replace('bg-green-100 text-green-800', 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400');

// Phase 2
content = content.replace('text-blue-500 uppercase', 'text-blue-500 dark:text-blue-400 uppercase');
content = content.replace('bg-blue-100 text-blue-800', 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300');
content = content.replace('text-gray-800">{activeQuestion.question}', 'text-gray-800 dark:text-gray-200">{activeQuestion.question}');
content = content.replace('"w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden",', '"w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden dark:text-gray-200",');
content = content.replace('? "border-green-500 bg-green-50"', '? "border-green-500 bg-green-50 dark:bg-green-900/20"');
content = content.replace(': "border-red-500 bg-red-50"', ': "border-red-500 bg-red-50 dark:bg-red-900/20"');
content = content.replace('isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"', 'isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800"');
content = content.replace('bg-green-100 text-green-900 border border-green-200', 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800');
content = content.replace('bg-red-100 text-red-900 border border-red-200', 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800');
content = content.replace('bg-gray-900 text-white hover:bg-gray-800', 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200');

fs.writeFileSync(path.join(process.cwd(), 'components/Flashcard.tsx'), content);
