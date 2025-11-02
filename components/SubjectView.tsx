import React, { useState } from 'react';
import { User, Subject, MathCategory, EnglishCategory, SessionSummaryData } from '../types';
import MathCategorySelection from './MathCategorySelection';
import EnglishCategorySelection from './EnglishCategorySelection';
import TextExerciseView from './TextExerciseView';
import ReadingView from './ReadingView';
import { generateMathExercise, generateEnglishExercise, generateHebrewExercise } from '../services/geminiService';

interface SubjectViewProps {
  user: User;
  subject: Subject;
  initialProgress: number;
  onBack: () => void;
  onSessionComplete: (summary: SessionSummaryData, newProgress: number) => void;
}

const SubjectView: React.FC<SubjectViewProps> = ({ user, subject, initialProgress, onBack, onSessionComplete }) => {
  const [mathCategory, setMathCategory] = useState<MathCategory | null>(null);
  const [englishCategory, setEnglishCategory] = useState<EnglishCategory | null>(null);
  
  const handleBackToCategories = () => {
      setMathCategory(null);
      setEnglishCategory(null);
  }

  const handleSessionComplete = (summary: SessionSummaryData, newProgress: number) => {
    // Pass up to App.tsx
    onSessionComplete(summary, newProgress);
  }

  if (subject === 'math') {
    if (!mathCategory) {
      return <MathCategorySelection user={user} onSelectCategory={setMathCategory} onBack={onBack} />;
    }
    return (
      <TextExerciseView
        user={user}
        subject="math"
        category={mathCategory}
        onBack={handleBackToCategories}
        onSessionComplete={handleSessionComplete}
        exerciseGenerator={(prevCorrectness) => generateMathExercise(user, mathCategory, prevCorrectness)}
        initialProgress={initialProgress}
      />
    );
  }
  
  if (subject === 'english') {
    if (!englishCategory) {
      return <EnglishCategorySelection user={user} onSelectCategory={setEnglishCategory} onBack={onBack} />;
    }
    if (englishCategory === 'reading_practice') {
        return (
            <ReadingView 
                user={user}
                onBack={handleBackToCategories}
                onSessionComplete={handleSessionComplete}
                initialProgress={initialProgress}
            />
        );
    }
     return (
      <TextExerciseView
        user={user}
        subject="english"
        category={englishCategory}
        onBack={handleBackToCategories}
        onSessionComplete={handleSessionComplete}
        exerciseGenerator={(prevCorrectness) => generateEnglishExercise(user, englishCategory, prevCorrectness)}
        initialProgress={initialProgress}
      />
    );
  }
  
  if (subject === 'hebrew') {
    return (
       <TextExerciseView
        user={user}
        subject="hebrew"
        onBack={onBack}
        onSessionComplete={handleSessionComplete}
        exerciseGenerator={(prevCorrectness) => generateHebrewExercise(user, prevCorrectness)}
        initialProgress={initialProgress}
      />
    );
  }

  return <div>Subject not found</div>;
};

export default SubjectView;
