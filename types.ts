export type Subject = 'math' | 'english' | 'hebrew';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export interface User {
  id: string;
  name: string;
  grade: Grade;
}

export interface Progress {
  math: number;
  english: number;
  hebrew: number;
}

export interface Feedback {
  isCorrect: boolean;
  feedbackText: string;
}

// Math types
export type MathCategory = 'counting' | 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fractions';

export interface VisualMathExercise {
  type: 'visual';
  question: string;
  visualization: {
    elements: { emoji: string; count: number }[];
    operation: '+' | '-' | '×' | '÷';
  };
  answer: number;
}

export interface TextMathExercise {
    type: 'text';
    question: string;
    options?: (string|number)[];
    answer: number;
}

export type MathExercise = VisualMathExercise | TextMathExercise;

// English types
export type EnglishCategory = 'reading_practice' | 'vocabulary' | 'comprehension';

export interface ReadingPracticeExercise {
    type: 'reading_practice';
    sentence: string;
}

export interface VocabularyExercise {
    type: 'vocabulary';
    word: string;
    definition: string;
    question: string; // e.g., "Which sentence uses the word '{word}' correctly?"
    options: string[];
    answer: string;
}

export interface ComprehensionExercise {
    type: 'comprehension';
    passage: string;
    question: string;
    options: string[];
    answer: string; 
}

export type EnglishExercise = ReadingPracticeExercise | VocabularyExercise | ComprehensionExercise;

// Hebrew types
export interface HebrewExercise {
    type: 'text';
    question: string; // in Hebrew
    options: string[]; // in Hebrew
    answer: string; // in Hebrew
}

export type Exercise = MathExercise | EnglishExercise | HebrewExercise;

export interface SessionSummaryData {
    correct: number;
    incorrect: number;
    subject: Subject;
    category?: MathCategory | EnglishCategory;
    wpm?: number;
    accuracy?: number;
}

export type WordStatus = 'pending' | 'correct' | 'incorrect';
