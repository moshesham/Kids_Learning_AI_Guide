export type Subject = 'math' | 'english' | 'hebrew';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export interface User {
  id: string;
  name: string;
  grade: Grade;
  interest?: string; // e.g., 'Space', 'Dinosaurs', 'Trains'
  difficultyLevel?: number; // 1-10
  storyMode?: boolean;
  dyslexiaFont?: boolean;
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
export type MathCategory = 'counting' | 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fractions' | 'visual_exercises' | 'pattern_architect' | 'logic_lab' | 'social_scripting';

export interface VisualMathExercise {
  type: 'visual';
  question: string;
  visualization: {
    elements: { emoji: string; count: number }[];
    operation: '+' | '-' | '×' | '÷';
  };
  answer: number | string;
  story_context?: string;
}

export interface TextMathExercise {
    type: 'text';
    question: string;
    options?: (string|number)[];
    answer: number | string;
    story_context?: string;
}

export interface PatternMathExercise {
    type: 'pattern';
    question: string;
    pattern_sequence: (string | number)[];
    answer: string | number;
    options: (string | number)[];
    story_context?: string;
}

export type MathExercise = VisualMathExercise | TextMathExercise | PatternMathExercise | SocialScriptingExercise;

// English types
export type EnglishCategory = 'reading_practice' | 'vocabulary' | 'comprehension' | 'visual_syntax' | 'social_scripting';

export interface ReadingPracticeExercise {
    type: 'reading_practice';
    sentence: string;
    story_context?: string;
}

export interface VocabularyExercise {
    type: 'vocabulary';
    word: string;
    definition: string;
    question: string; // e.g., "Which sentence uses the word '{word}' correctly?"
    options: string[];
    answer: string;
    story_context?: string;
}

export interface ComprehensionExercise {
    type: 'comprehension';
    passage: string;
    question: string;
    options: string[];
    answer: string; 
    story_context?: string;
}

export interface VisualSyntaxExercise {
    type: 'visual_syntax';
    question: string;
    sentence_parts: { text: string; part_of_speech: string }[];
    answer: string;
    story_context?: string;
}

export interface SocialScriptingExercise {
    type: 'social_scripting';
    scenario: string;
    dialogue: { speaker: string; text: string }[];
    question: string;
    options: string[];
    answer: string;
    bodySignals?: string;
    peerEmotionEmoji?: string;
    emotionalRegulationHint?: string;
    conflictResolutionHint?: string;
    story_context?: string;
}

export type EnglishExercise = ReadingPracticeExercise | VocabularyExercise | ComprehensionExercise | VisualSyntaxExercise | SocialScriptingExercise;

// Hebrew types
export type HebrewCategory = 'gematria' | 'shoresh_tree' | 'nikkud_master' | 'vocabulary' | 'social_scripting';

export interface GematriaExercise {
    type: 'gematria';
    question: string;
    word: string;
    letter_values: { letter: string; value: number }[];
    answer: number;
    options: number[];
    story_context?: string;
}

export interface StandardHebrewExercise {
    type: 'text';
    question: string; // in Hebrew
    options: string[]; // in Hebrew
    answer: string; // in Hebrew
    story_context?: string;
}

export interface ShoreshExercise {
    type: 'shoresh';
    root: string;
    derived_words: { word: string; meaning: string }[];
    question: string;
    options: string[];
    answer: string;
    story_context?: string;
}

export type HebrewExercise = GematriaExercise | StandardHebrewExercise | ShoreshExercise | SocialScriptingExercise;

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
