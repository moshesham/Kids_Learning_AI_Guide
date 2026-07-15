import React, { useState } from 'react';
import { User, Subject, MathCategory, EnglishCategory, HebrewCategory, SessionSummaryData } from '../types';
import MathCategorySelection from './MathCategorySelection';
import EnglishCategorySelection from './EnglishCategorySelection';
import HebrewCategorySelection from './HebrewCategorySelection';
import TextExerciseView from './TextExerciseView';
import ReadingView from './ReadingView';
import { generateMathExercise, generateEnglishExercise, generateHebrewExercise } from '../services/geminiService';

interface SubjectViewProps {
  user: User;
  subject: Subject;
  initialProgress: number;
  onBack: () => void;
  onSessionComplete: (summary: SessionSummaryData, newProgress: number) => void;
  onUpdateUser: (user: User) => void;
}

const SubjectView: React.FC<SubjectViewProps> = ({ user, subject, initialProgress, onBack, onSessionComplete, onUpdateUser }) => {
  const [mathCategory, setMathCategory] = useState<MathCategory | null>(null);
  const [englishCategory, setEnglishCategory] = useState<EnglishCategory | null>(null);
  const [hebrewCategory, setHebrewCategory] = useState<HebrewCategory | null>(null);
  
  const handleBackToCategories = () => {
      setMathCategory(null);
      setEnglishCategory(null);
      setHebrewCategory(null);
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
        onUpdateUser={onUpdateUser}
        exerciseGenerator={(prevCorrectness, prevStory) => generateMathExercise(user, mathCategory, prevCorrectness, prevStory)}
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
                onUpdateUser={onUpdateUser}
                initialProgress={initialProgress}
            />
        );
    }
    if (englishCategory === 'visual_syntax') {
        return (
            <TextExerciseView
                user={user}
                subject="english"
                category={englishCategory}
                onBack={handleBackToCategories}
                onSessionComplete={handleSessionComplete}
                onUpdateUser={onUpdateUser}
                exerciseGenerator={(prevCorrectness, prevStory) => generateEnglishExercise(user, englishCategory, prevCorrectness, prevStory)}
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
        onUpdateUser={onUpdateUser}
        exerciseGenerator={(prevCorrectness, prevStory) => generateEnglishExercise(user, englishCategory, prevCorrectness, prevStory)}
        initialProgress={initialProgress}
      />
    );
  }
  
  if (subject === 'hebrew') {
    if (!hebrewCategory) {
      return <HebrewCategorySelection user={user} onSelectCategory={setHebrewCategory} onBack={onBack} />;
    }
    return (
       <TextExerciseView
        user={user}
        subject="hebrew"
        category={hebrewCategory}
        onBack={handleBackToCategories}
        onSessionComplete={handleSessionComplete}
        onUpdateUser={onUpdateUser}
        exerciseGenerator={(prevCorrectness, prevStory) => generateHebrewExercise(user, hebrewCategory, prevCorrectness, prevStory)}
        initialProgress={initialProgress}
      />
    );
  }

  return <div>Subject not found</div>;
};

export default SubjectView;
