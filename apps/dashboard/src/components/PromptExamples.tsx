import React from 'react';
import { LightBulbIcon, SparklesIcon, EyeIcon } from '@heroicons/react/24/outline';

interface PromptExample {
  label: string;
  prompt: string;
  difficulty: string;
  language: string;
  tags: string[];
}

const PROMPT_EXAMPLES: PromptExample[] = [
  {
    label: "String Reversal",
    prompt: "Create a function that reverses a string without using built-in reverse methods",
    difficulty: "easy",
    language: "javascript",
    tags: ["strings", "loops", "basic"]
  },
  {
    label: "Binary Search",
    prompt: "Implement binary search algorithm to find an element in a sorted array",
    difficulty: "medium",
    language: "python",
    tags: ["algorithms", "search", "arrays"]
  },
  {
    label: "Calculator with History",
    prompt: "Build a calculator that performs basic operations and keeps a history of calculations",
    difficulty: "medium",
    language: "javascript",
    tags: ["objects", "methods", "state"]
  },
  {
    label: "Fibonacci Sequence",
    prompt: "Create a function that generates the first n numbers in the Fibonacci sequence",
    difficulty: "easy",
    language: "python",
    tags: ["recursion", "mathematics", "sequences"]
  },
  {
    label: "Todo List Manager",
    prompt: "Build a todo list that can add, remove, and mark items as complete",
    difficulty: "medium",
    language: "javascript",
    tags: ["arrays", "objects", "crud"]
  },
  {
    label: "Password Validator",
    prompt: "Create a function that validates passwords based on security criteria",
    difficulty: "easy",
    language: "python",
    tags: ["regex", "validation", "security"]
  }
];

interface PromptExamplesProps {
  currentLanguage: string;
  currentDifficulty: string;
  onSelectExample: (prompt: string, difficulty: string, language: string) => void;
}

export function PromptExamples({ 
  currentLanguage, 
  currentDifficulty, 
  onSelectExample 
}: PromptExamplesProps) {
  // Filter examples based on current settings or show variety
  const relevantExamples = PROMPT_EXAMPLES
    .filter(example => 
      example.language.toLowerCase() === currentLanguage.toLowerCase() ||
      example.difficulty.toLowerCase() === currentDifficulty.toLowerCase()
    )
    .slice(0, 3);

  // If no relevant examples, show first 3
  const examplesToShow = relevantExamples.length > 0 ? relevantExamples : PROMPT_EXAMPLES.slice(0, 3);

  return (
    <div className="mt-3">
      <div className="flex items-center space-x-2 mb-3">
        <SparklesIcon className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-gray-300">Try these examples:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {examplesToShow.map((example, index) => (
          <button
            key={index}
            onClick={() => onSelectExample(example.prompt, example.difficulty, example.language)}
            className="group relative inline-flex items-center px-3 py-2 text-sm bg-gray-800/50 hover:bg-blue-900/30 text-gray-300 hover:text-blue-300 rounded-lg border border-gray-600/50 hover:border-blue-500/50 transition-all duration-200"
            title={`Click to use this example (${example.difficulty} ${example.language})`}
          >
            <LightBulbIcon className="w-4 h-4 mr-2 opacity-60 group-hover:opacity-100" />
            <span className="font-medium">{example.label}</span>
            
            {/* Tags */}
            <div className="ml-2 flex space-x-1">
              {example.tags.slice(0, 2).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="text-xs bg-gray-700/50 group-hover:bg-blue-800/30 text-gray-400 group-hover:text-blue-300 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        💡 Click any example to auto-fill the prompt field and see how to structure requests
      </div>
    </div>
  );
}

interface QuickActionsProps {
  onReset: () => void;
  onPreview: () => void;
  hasContent: boolean;
}

export function QuickActions({ onReset, onPreview, hasContent }: QuickActionsProps) {
  return (
    <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-600/50">
      <button
        onClick={onReset}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
      >
        <span>↺</span>
        <span>Reset to Default</span>
      </button>
      
      {hasContent && (
        <button
          onClick={onPreview}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <EyeIcon className="w-4 h-4" />
          <span>Preview as Learner</span>
        </button>
      )}
    </div>
  );
}