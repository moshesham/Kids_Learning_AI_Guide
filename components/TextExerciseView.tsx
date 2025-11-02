import React, { useState, useEffect } from 'react';
import { User, Exercise, Feedback, Subject, MathCategory, EnglishCategory, SessionSummaryData, VisualMathExercise } from '../types';
import { getFeedbackForAnswer } from '../services/geminiService';
import AiFeedback from './AiFeedback';
import MathVisualization from './MathVisualization';

const QUESTIONS_PER_SESSION = 5;

interface TextExerciseViewProps {
  user: User;
  subject: Subject;
  category?: MathCategory | EnglishCategory;
  onBack: () => void;
  onSessionComplete: (summary: SessionSummaryData, newProgress: number) => void;
  exerciseGenerator: (previousCorrectness?: 'correct' | 'incorrect' | 'first') => Promise<Exercise>;
  initialProgress: number;
}

const TextExerciseView: React.FC<TextExerciseViewProps> = ({
  user,
  subject,
  category,
  onBack,
  onSessionComplete,
  exerciseGenerator,
  initialProgress
}) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speakingWordKey, setSpeakingWordKey] = useState<string | null>(null);

  const fetchExercise = async (previousCorrectness?: 'correct' | 'incorrect' | 'first') => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    setUserAnswer('');
    try {
      const ex = await exerciseGenerator(previousCorrectness);
      setExercise(ex);
    } catch (err) {
      setError('Oops! We had trouble generating a question. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercise('first');
  }, [exerciseGenerator]);

  // Clean up speech synthesis on component unmount or when exercise changes
  useEffect(() => {
    return () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    };
  }, [exercise]);

  const handleWordClick = (wordText: string, key: string) => {
    if (!('speechSynthesis' in window)) {
        console.warn("Browser does not support text-to-speech.");
        return;
    }

    window.speechSynthesis.cancel(); // Stop any current speech

    const cleanedWord = wordText.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");
    if (!cleanedWord) return;

    const utterance = new SpeechSynthesisUtterance(cleanedWord);
    
    utterance.onstart = () => {
        setSpeakingWordKey(key);
    };
    utterance.onend = () => {
        setSpeakingWordKey(null);
    };
    utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setSpeakingWordKey(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise || isSubmitting || !userAnswer.trim()) return;

    // FIX: Add a type guard to ensure the exercise has question and answer properties.
    // This handles the case of `ReadingPracticeExercise` which shouldn't be in this view.
    if (!('question' in exercise) || !('answer' in exercise)) {
      console.error("Invalid exercise for this view:", exercise);
      return;
    }

    setIsSubmitting(true);
    const fb = await getFeedbackForAnswer(user, exercise.question, userAnswer, exercise.answer);
    setFeedback(fb);

    if (fb.isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    setIsSubmitting(false);
  };

  const handleNextQuestion = () => {
    const wasCorrect = feedback?.isCorrect;
    const nextQuestionNumber = questionCount + 1;
    if (nextQuestionNumber >= QUESTIONS_PER_SESSION) {
      // Session over
      const finalCorrect = correctCount + (wasCorrect && !feedback ? 1 : 0);
      const newProgress = initialProgress + (finalCorrect / QUESTIONS_PER_SESSION) * 20; // 20% progress for a full session
      onSessionComplete({
          correct: finalCorrect,
          incorrect: QUESTIONS_PER_SESSION - finalCorrect,
          subject: subject,
          category: category,
      }, Math.min(100, newProgress));
    } else {
      setQuestionCount(nextQuestionNumber);
      fetchExercise(wasCorrect ? 'correct' : 'incorrect');
    }
  };
  
  const renderExerciseContent = () => {
    if (!exercise) return null;
    if (subject === 'math' && exercise.type === 'visual') {
        const visualExercise = exercise as VisualMathExercise;
        if (visualExercise.visualization) {
            return <MathVisualization visualization={visualExercise.visualization} />;
        }
    }
    return null;
  }
  
  const renderInput = () => {
    if (!exercise) return null;
    // FIX: Check for 'options' property before accessing it to satisfy TypeScript for the union type 'Exercise'.
    if ('options' in exercise && exercise.options && exercise.options.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {exercise.options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (!feedback) setUserAnswer(String(option));
              }}
              className={`p-4 rounded-lg text-lg transition-colors border-2 ${
                userAnswer === String(option)
                  ? 'bg-blue-500 text-white border-blue-700'
                  : 'bg-white hover:bg-blue-100 border-slate-300'
              } ${feedback ? 'cursor-not-allowed' : ''}`}
              disabled={!!feedback}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }
    return (
       <input
          type={subject === 'math' ? 'number' : 'text'}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full max-w-md mx-auto p-4 text-2xl border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center"
          placeholder="Type your answer here"
          disabled={!!feedback}
        />
    )
  }
  
  // FIX: Property 'story' does not exist on any exercise type, causing type errors. Only check for 'passage'.
  const storyOrPassage = (exercise && 'passage' in exercise && typeof exercise.passage === 'string') 
    ? exercise.passage 
    : null;

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto text-center relative">
       <button 
        onClick={onBack}
        className="absolute top-4 left-4 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        &larr; Back
      </button>

      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((questionCount) / QUESTIONS_PER_SESSION) * 100}%` }}></div>
        </div>
        <span className="text-sm text-slate-500 mt-1">Question {questionCount + 1} of {QUESTIONS_PER_SESSION}</span>
      </div>


      {isLoading && <div className="p-8 text-lg text-slate-600">Loading your question...</div>}
      {error && <div className="p-8 text-lg text-red-600">{error}</div>}
      
      {!isLoading && !error && exercise && (
        <form onSubmit={handleSubmit}>
          {storyOrPassage && (
            <div className="text-left text-lg md:text-xl text-slate-700 mb-6 leading-relaxed bg-slate-50 p-4 rounded-lg">
                {storyOrPassage.split(/(\s+)/).map((segment, index) => {
                    const key = `word-${index}`;
                    const isClickable = segment.trim().length > 0;
                    if (isClickable) {
                        return (
                            <span
                                key={key}
                                onClick={() => handleWordClick(segment, key)}
                                className={`cursor-pointer transition-colors rounded p-0.5 -m-0.5 ${speakingWordKey === key ? 'bg-yellow-300' : 'hover:bg-yellow-100'}`}
                            >
                                {segment}
                            </span>
                        );
                    }
                    return <span key={key}>{segment}</span>;
                })}
            </div>
          )}
          
          {/* FIX: Add a type guard to ensure exercise has a question before rendering it. */}
          {'question' in exercise && (
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-6" style={{ whiteSpace: 'pre-wrap' }}>{exercise.question}</h2>
          )}

          {renderExerciseContent()}

          <div className="my-6">
            {renderInput()}
          </div>

          {!feedback && (
             <button 
                type="submit"
                className="w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
                disabled={!userAnswer.trim() || isSubmitting}
              >
                {isSubmitting ? 'Checking...' : 'Check Answer'}
              </button>
          )}
        </form>
      )}

      {feedback && (
        <div className="mt-6 flex flex-col items-center gap-4">
            <AiFeedback feedback={feedback} />
            <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full max-w-xs mx-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-green-700 transition-colors"
            >
                {questionCount + 1 >= QUESTIONS_PER_SESSION ? 'Finish Session' : 'Next Question'}
            </button>
        </div>
      )}
    </div>
  );
};

export default TextExerciseView;