
import React, { useState, useEffect } from 'react';
import { User, Exercise, Feedback, Subject, MathCategory, EnglishCategory, HebrewCategory, SessionSummaryData, VisualMathExercise, VisualSyntaxExercise, PatternMathExercise, GematriaExercise, SocialScriptingExercise, ShoreshExercise } from '../types';
import { getFeedbackForAnswer } from '../services/geminiService';
import AiFeedback from './AiFeedback';
import MathVisualization from './MathVisualization';
import ReadAloudButton from './ReadAloudButton';

const QUESTIONS_PER_SESSION = 5;

interface TextExerciseViewProps {
  user: User;
  subject: Subject;
  category?: MathCategory | EnglishCategory;
  onBack: () => void;
  onSessionComplete: (summary: SessionSummaryData, newProgress: number) => void;
  onUpdateUser: (user: User) => void;
  exerciseGenerator: (previousCorrectness?: 'correct' | 'incorrect' | 'first', previousStoryContext?: string) => Promise<Exercise>;
  initialProgress: number;
}

const TextExerciseView: React.FC<TextExerciseViewProps> = ({
  user,
  subject,
  category,
  onBack,
  onSessionComplete,
  onUpdateUser,
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
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState(0);
  const [previousStoryContext, setPreviousStoryContext] = useState<string | undefined>(undefined);
  const [difficultyNotification, setDifficultyNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speakingWordKey, setSpeakingWordKey] = useState<string | null>(null);

  const fetchExercise = async (previousCorrectness?: 'correct' | 'incorrect' | 'first', prevStory?: string) => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    setUserAnswer('');
    try {
      const ex = await exerciseGenerator(previousCorrectness, prevStory);
      setExercise(ex);
      if ('story_context' in ex && typeof ex.story_context === 'string') {
        setPreviousStoryContext(ex.story_context);
      }
    } catch (err) {
      setError('Oops! We had trouble generating a question. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercise('first');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const cleanedWord = wordText ? wordText.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "") : "";
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
    if (!exercise || isSubmitting || !userAnswer || !userAnswer.trim()) return;

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
      setConsecutiveCorrect(prev => prev + 1);
      setConsecutiveIncorrect(0);
    } else {
      setConsecutiveCorrect(0);
      setConsecutiveIncorrect(prev => prev + 1);
    }
    setIsSubmitting(false);
  };

  const handleNextQuestion = () => {
    const wasCorrect = feedback?.isCorrect;
    const nextQuestionNumber = questionCount + 1;
    
    // AI-driven difficulty adjustment
    let currentDifficulty = user.difficultyLevel || 5;
    let difficultyChanged = false;
    
    if (consecutiveCorrect >= 3 && currentDifficulty < 10) {
        currentDifficulty += 1;
        difficultyChanged = true;
        setConsecutiveCorrect(0);
    } else if (consecutiveIncorrect >= 3 && currentDifficulty > 1) {
        currentDifficulty -= 1;
        difficultyChanged = true;
        setConsecutiveIncorrect(0);
    }

    if (difficultyChanged) {
        onUpdateUser({ ...user, difficultyLevel: currentDifficulty });
        if (currentDifficulty > (user.difficultyLevel || 5)) {
            setDifficultyNotification("You're doing great! Difficulty increased. 🚀");
        } else {
            setDifficultyNotification("Let's take it a bit easier. Difficulty decreased. 🎈");
        }
        // Clear notification after 3 seconds
        setTimeout(() => setDifficultyNotification(null), 3000);
    }

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
      fetchExercise(wasCorrect ? 'correct' : 'incorrect', previousStoryContext);
    }
  };
  
  const renderExerciseContent = () => {
    if (!exercise) return null;
    if (subject === 'math' && exercise.type === 'visual') {
        const visualExercise = exercise as VisualMathExercise;
        if (visualExercise.visualization) {
            return <MathVisualization 
                visualization={visualExercise.visualization} 
                isIncorrect={!!feedback && !feedback.isCorrect}
            />;
        }
    }
    if (subject === 'english' && exercise.type === 'visual_syntax') {
        const visualSyntax = exercise as VisualSyntaxExercise;
        const colors: Record<string, string> = {
            'Noun': 'bg-blue-100 border-blue-400 text-blue-800',
            'Verb': 'bg-red-100 border-red-400 text-red-800',
            'Adjective': 'bg-green-100 border-green-400 text-green-800',
            'Article': 'bg-yellow-100 border-yellow-400 text-yellow-800',
            'Preposition': 'bg-purple-100 border-purple-400 text-purple-800',
        };

        return (
            <div className="flex flex-wrap justify-center gap-4 my-8">
                {visualSyntax.sentence_parts.map((part, i) => (
                    <div 
                        key={i}
                        className={`px-4 py-2 rounded-lg border-2 shadow-sm font-bold text-lg ${colors[part.part_of_speech] || 'bg-slate-100 border-slate-400'}`}
                    >
                        {part.text}
                        <div className="text-[10px] uppercase opacity-60 mt-1">{part.part_of_speech}</div>
                    </div>
                ))}
            </div>
        );
    }
    if (subject === 'math' && exercise.type === 'pattern') {
        const patternExercise = exercise as PatternMathExercise;
        return (
            <div className="flex flex-wrap justify-center gap-4 my-8">
                {patternExercise.pattern_sequence.map((emoji, i) => (
                    <div 
                        key={i}
                        className={`w-16 h-16 flex items-center justify-center text-4xl rounded-xl border-2 shadow-sm ${emoji === '?' ? 'bg-yellow-50 border-yellow-400 text-yellow-600 animate-pulse' : 'bg-white border-slate-200'}`}
                    >
                        {emoji}
                    </div>
                ))}
            </div>
        );
    }
    if (subject === 'hebrew' && exercise.type === 'gematria') {
        const gematria = exercise as GematriaExercise;
        return (
            <div className="flex flex-col items-center gap-6 my-8">
                <div className="text-6xl font-bold text-blue-600 mb-4" dir="rtl">
                    {gematria.word}
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    {gematria.letter_values.map((lv, i) => (
                        <div key={i} className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-2xl font-bold text-blue-800">{lv.letter}</span>
                            <span className="text-sm text-blue-500">={lv.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (exercise.type === 'social_scripting') {
        const social = exercise as SocialScriptingExercise;
        return (
            <div className="flex flex-col gap-4 my-8 max-w-xl mx-auto text-left">
                {social.peerEmotionEmoji && (
                    <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-full text-6xl shadow-inner border-4 border-slate-200 animate-bounce">
                            {social.peerEmotionEmoji}
                        </div>
                    </div>
                )}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Scenario</div>
                      <div className="text-slate-700 font-medium">{social.scenario}</div>
                    </div>
                    <ReadAloudButton text={social.scenario} user={user} className="mt-1" />
                </div>
                
                {social.bodySignals && (
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex gap-3 items-start">
                        <span className="text-xl">👀</span>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">Body Signals</div>
                            <div className="text-sm text-slate-700">{social.bodySignals}</div>
                        </div>
                        <ReadAloudButton text={social.bodySignals} user={user} className="mt-1" />
                    </div>
                )}

                {social.emotionalRegulationHint && (
                    <div className="bg-green-50 p-3 rounded-xl border border-green-200 flex gap-3 items-start">
                        <span className="text-xl">🧘</span>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1">Stay Calm</div>
                            <div className="text-sm text-slate-700">{social.emotionalRegulationHint}</div>
                        </div>
                        <ReadAloudButton text={social.emotionalRegulationHint} user={user} className="mt-1" />
                    </div>
                )}

                {social.conflictResolutionHint && (
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 flex gap-3 items-start">
                        <span className="text-xl">🤝</span>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Solve the Problem</div>
                            <div className="text-sm text-slate-700">{social.conflictResolutionHint}</div>
                        </div>
                        <ReadAloudButton text={social.conflictResolutionHint} user={user} className="mt-1" />
                    </div>
                )}

                <div className="mt-4 space-y-3 flex flex-col">
                    {social.dialogue.map((line, i) => (
                        <div 
                            key={i}
                            className={`p-4 rounded-2xl max-w-[80%] flex items-start gap-2 ${line.speaker === 'You' ? 'bg-blue-600 text-white self-end rounded-tr-none ml-auto' : 'bg-slate-100 text-slate-800 self-start rounded-tl-none mr-auto'}`}
                        >
                            <div className="flex-1">
                                <div className={`text-[10px] uppercase opacity-60 mb-1 ${line.speaker === 'You' ? 'text-blue-200' : 'text-slate-500'}`}>{line.speaker}</div>
                                <div className="text-lg font-medium">{line.text}</div>
                            </div>
                            <ReadAloudButton 
                                text={line.text} 
                                user={user} 
                                className={line.speaker === 'You' ? 'text-blue-200 hover:text-white hover:bg-blue-500' : ''} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    if (subject === 'hebrew' && exercise.type === 'shoresh') {
        const shoresh = exercise as ShoreshExercise;
        return (
            <div className="flex flex-col items-center gap-8 my-8">
                <div className="relative">
                    <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg z-10 relative" dir="rtl">
                        {shoresh.root}
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-purple-200 rounded-full border-dashed animate-spin-slow"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
                    {shoresh.derived_words.map((dw, i) => (
                        <div key={i} className="flex flex-col items-center p-4 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-2xl font-bold text-purple-800 mb-1" dir="rtl">{dw.word}</span>
                            <span className="text-xs text-purple-500 text-center">{dw.meaning}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
  }
  
  const renderInput = () => {
    if (!exercise) return null;
    // FIX: Check for 'options' property before accessing it to satisfy TypeScript for the union type 'Exercise'.
    if ('options' in exercise && exercise.options && exercise.options.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" dir={subject === 'hebrew' ? 'rtl' : 'ltr'}>
          {exercise.options.map((option, index) => (
            <div key={index} className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  if (!feedback) setUserAnswer(String(option));
                }}
                className={`flex-1 p-4 rounded-lg text-lg transition-colors border-2 ${
                  userAnswer === String(option)
                    ? 'bg-blue-500 text-white border-blue-700'
                    : 'bg-white hover:bg-blue-100 border-slate-300'
                } ${feedback ? 'cursor-not-allowed' : ''}`}
                disabled={!!feedback}
              >
                {option}
              </button>
              <div className="flex items-center justify-center">
                <ReadAloudButton text={String(option)} user={user} />
              </div>
            </div>
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
          dir={subject === 'hebrew' ? 'rtl' : 'ltr'}
        />
    )
  }
  
  // FIX: Property 'story' does not exist on any exercise type, causing type errors. Only check for 'passage'.
  const storyOrPassage = (exercise && 'passage' in exercise && typeof exercise.passage === 'string') 
    ? exercise.passage 
    : null;

  const storyContext = (exercise && 'story_context' in exercise && typeof exercise.story_context === 'string')
    ? exercise.story_context
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

      {difficultyNotification && (
        <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md animate-fade-in z-50">
            {difficultyNotification}
        </div>
      )}

      {isLoading && <div className="p-8 text-lg text-slate-600">Loading your question...</div>}
      {error && <div className="p-8 text-lg text-red-600">{error}</div>}
      
      {!isLoading && !error && exercise && (
        <form onSubmit={handleSubmit}>
          {storyContext && (
            <div className="text-left text-lg md:text-xl text-indigo-800 mb-6 leading-relaxed bg-indigo-50 p-6 rounded-xl border-l-4 border-indigo-500 font-serif italic shadow-sm flex items-start gap-3">
                <div className="flex-1">{storyContext}</div>
                <ReadAloudButton text={storyContext} user={user} className="mt-1" />
            </div>
          )}
          {storyOrPassage && (
            <>
              <div className="text-sm text-slate-500 mb-2 flex items-center justify-center gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                  <span className="text-xl">💡</span> Click any word in the passage to hear it read aloud
              </div>
              <div className="text-left text-lg md:text-xl text-slate-700 mb-6 leading-relaxed bg-slate-50 p-4 rounded-lg">
                  {storyOrPassage.split(/(\s+)/).map((segment, index) => {
                      const key = `word-${index}`;
                      const isClickable = segment && segment.trim().length > 0;
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
            </>
          )}
          
          {/* FIX: Add a type guard to ensure exercise has a question before rendering it. */}
          {'question' in exercise && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 
                className="text-2xl md:text-3xl font-semibold text-slate-800 m-0" 
                style={{ whiteSpace: 'pre-wrap' }}
                dir={subject === 'hebrew' ? 'rtl' : 'ltr'}
              >
                {exercise.question}
              </h2>
              <ReadAloudButton text={exercise.question} user={user} />
            </div>
          )}

          {renderExerciseContent()}

          <div className="my-6">
            {renderInput()}
          </div>

          {!feedback && (
             <button 
                type="submit"
                className="w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
                disabled={!userAnswer || !userAnswer.trim() || isSubmitting}
              >
                {isSubmitting ? 'Checking...' : 'Check Answer'}
              </button>
          )}
        </form>
      )}

      {feedback && (
        <div className="mt-6 flex flex-col items-center gap-4">
            <AiFeedback feedback={feedback} user={user} />
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
