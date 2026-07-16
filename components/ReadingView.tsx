
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, SessionSummaryData, ReadingPracticeExercise, WordStatus } from '../types';
import { generateEnglishExercise } from '../services/geminiService';
import MicIcon from './icons/MicIcon';
import ReadAloudButton from './ReadAloudButton';

const QUESTIONS_PER_SESSION = 5;

// Web Speech API interfaces
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    isFinal: boolean;
    [key: number]: { transcript: string };
    length: number;
  }[];
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ReadingViewProps {
  user: User;
  initialProgress: number;
  onBack: () => void;
  onSessionComplete: (summary: SessionSummaryData, newProgress: number) => void;
  onUpdateUser: (user: User) => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ user, initialProgress, onBack, onSessionComplete, onUpdateUser }) => {
    const [exercise, setExercise] = useState<ReadingPracticeExercise | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [sessionWords, setSessionWords] = useState<{ sentence: string, wpm: number, accuracy: number }[]>([]);
    
    const [isListening, setIsListening] = useState(false);
    const [wordStatuses, setWordStatuses] = useState<WordStatus[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    
    const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
    const [consecutiveIncorrect, setConsecutiveIncorrect] = useState(0);
    const [previousStoryContext, setPreviousStoryContext] = useState<string | undefined>(undefined);
    const [difficultyNotification, setDifficultyNotification] = useState<string | null>(null);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const originalWords = exercise?.sentence ? exercise.sentence.trim().split(/\s+/) : [];

    const fetchExercise = async (previousCorrectness?: 'correct' | 'incorrect' | 'first', prevStory?: string) => {
        setIsLoading(true);
        setError(null);
        setIsListening(false);
        setWordStatuses([]);
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        try {
            const ex = await generateEnglishExercise(user, 'reading_practice', previousCorrectness, prevStory);
            if (ex.type === 'reading_practice') {
                setExercise(ex);
                setWordStatuses(new Array(ex.sentence ? ex.sentence.trim().split(/\s+/).length : 0).fill('pending'));
                if ('story_context' in ex && typeof ex.story_context === 'string') {
                    setPreviousStoryContext(ex.story_context);
                }
            } else {
                throw new Error("Generated wrong exercise type.");
            }
        } catch (err) {
            setError('Oops! We had trouble generating a sentence. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExercise('first');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize SpeechRecognition when exercise changes
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Sorry, your browser doesn't support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                fullTranscript += event.results[i][0].transcript;
            }
            
            // Normalize speech and target
            const spokenWords = fullTranscript ? fullTranscript.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0) : [];
            
            if (!exercise || !exercise.sentence) return;
             const currentOriginalWords = exercise.sentence.trim().split(/\s+/);
             const newStatuses: WordStatus[] = new Array(currentOriginalWords.length).fill('pending');

             currentOriginalWords.forEach((originalWord, index) => {
                const cleanOriginalWord = originalWord.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");
                if (index < spokenWords.length) {
                    if (spokenWords[index] === cleanOriginalWord) {
                        newStatuses[index] = 'correct';
                    } else {
                        newStatuses[index] = 'incorrect';
                    }
                }
            });
            
            setWordStatuses(newStatuses);
        };
        
        recognition.onend = () => {
             setIsListening(false);
        };
        
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                setError("Microphone access denied. Please allow microphone access to use this feature.");
            }
            setIsListening(false);
        };

        return () => {
            recognition.abort();
        };
    }, [exercise]); 

    const handleStartReading = () => {
        if (recognitionRef.current) {
            try {
                // Determine if we are restarting or starting fresh
                setStartTime(Date.now());
                setIsListening(true);
                setWordStatuses(new Array(originalWords.length).fill('pending'));
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start recognition", e);
                // Sometimes it throws if already started, safe to ignore or handle
            }
        }
    };

    const handleStopReading = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            
            const endTime = Date.now();
            const durationInMinutes = (endTime - (startTime || endTime)) / 60000;
            const correctCount = wordStatuses.filter(s => s === 'correct').length;
            
            // Avoid division by zero and unrealistic numbers for very short durations
            const effectiveDuration = Math.max(durationInMinutes, 0.05); // min 3 seconds
            const wpm = Math.round(correctCount / effectiveDuration);
            const accuracy = originalWords.length > 0 ? Math.round((correctCount / originalWords.length) * 100) : 0;
            
            setSessionWords(prev => [...prev, { sentence: exercise!.sentence, wpm, accuracy }]);
        }
    };

    const handleManualOverride = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
        // Assume they read it perfectly to avoid penalizing them for tech issues
        setSessionWords(prev => [...prev, { sentence: exercise!.sentence, wpm: 100, accuracy: 100 }]);
    };

    const handleNext = () => {
        const currentResult = sessionWords[questionCount];
        const isCorrect = currentResult && currentResult.accuracy >= 80;
        
        let newConsecutiveCorrect = consecutiveCorrect;
        let newConsecutiveIncorrect = consecutiveIncorrect;

        if (isCorrect) {
            newConsecutiveCorrect += 1;
            newConsecutiveIncorrect = 0;
        } else {
            newConsecutiveCorrect = 0;
            newConsecutiveIncorrect += 1;
        }

        setConsecutiveCorrect(newConsecutiveCorrect);
        setConsecutiveIncorrect(newConsecutiveIncorrect);

        // AI-driven difficulty adjustment
        let currentDifficulty = user.difficultyLevel || 5;
        let difficultyChanged = false;
        
        if (newConsecutiveCorrect >= 3 && currentDifficulty < 10) {
            currentDifficulty += 1;
            difficultyChanged = true;
            setConsecutiveCorrect(0);
        } else if (newConsecutiveIncorrect >= 3 && currentDifficulty > 1) {
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

        if (questionCount + 1 >= QUESTIONS_PER_SESSION) {
            // Finish session
            const totalWPM = sessionWords.reduce((acc, s) => acc + s.wpm, 0);
            const totalAccuracy = sessionWords.reduce((acc, s) => acc + s.accuracy, 0);
            const avgWPM = sessionWords.length > 0 ? Math.round(totalWPM / sessionWords.length) : 0;
            const avgAccuracy = sessionWords.length > 0 ? Math.round(totalAccuracy / sessionWords.length) : 0;
            const newProgress = initialProgress + 20; // 20% for a full session

            onSessionComplete({
                correct: avgAccuracy, // Re-using for summary score
                incorrect: 100 - avgAccuracy,
                subject: 'english',
                category: 'reading_practice',
                wpm: avgWPM,
                accuracy: avgAccuracy,
            }, Math.min(100, newProgress));

        } else {
            setQuestionCount(prev => prev + 1);
            fetchExercise(isCorrect ? 'correct' : 'incorrect', previousStoryContext);
        }
    }
    
    const renderSentence = () => {
        if (!exercise) return null;
        return originalWords.map((word, index) => {
            const status = wordStatuses[index];
            let colorClass = 'text-slate-800';
            if (status === 'correct') colorClass = 'text-green-600 font-bold';
            if (status === 'incorrect') colorClass = 'text-red-500 line-through opacity-70';
            // Pending remains default

            return <span key={index} className={`transition-all duration-200 mx-1 ${colorClass}`}>{word}</span>
        });
    }

    const renderButton = () => {
        // Check if we have results for the current sentence (meaning the user finished reading it)
        const currentSentenceResult = sessionWords.length === questionCount + 1;

        if (currentSentenceResult) {
             return (
                <button onClick={handleNext} className="w-full max-w-xs mx-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-green-700 transition-colors shadow-lg">
                    {questionCount + 1 >= QUESTIONS_PER_SESSION ? 'Finish Session' : 'Next Sentence'}
                </button>
            );
        }

        if (isListening) {
             return (
                <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                    <button onClick={handleStopReading} className="flex items-center justify-center gap-3 w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-red-700 transition-colors shadow-lg animate-pulse">
                        <span>🛑</span> Stop
                    </button>
                    <button onClick={handleManualOverride} className="text-sm text-slate-500 hover:text-blue-600 transition-colors underline">
                        I read it! (Skip Mic)
                    </button>
                </div>
            );
        }
        
        return (
            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                <button onClick={handleStartReading} className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-blue-700 transition-colors shadow-lg">
                    <MicIcon /> Start Reading
                </button>
                <button onClick={handleManualOverride} className="text-sm text-slate-500 hover:text-blue-600 transition-colors underline">
                    I read it! (Skip Mic)
                </button>
            </div>
        );
    }
    
    const results = sessionWords.length === questionCount + 1 ? sessionWords[questionCount] : null;

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto text-center relative">
            <button onClick={onBack} className="absolute top-4 left-4 text-sm text-slate-500 hover:text-blue-600 transition-colors">&larr; Back</button>
            <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(questionCount / QUESTIONS_PER_SESSION) * 100}%` }}></div>
                </div>
                <span className="text-sm text-slate-500 mt-1">Sentence {questionCount + 1} of {QUESTIONS_PER_SESSION}</span>
            </div>

            {difficultyNotification && (
                <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md animate-fade-in z-50">
                    {difficultyNotification}
                </div>
            )}

            {isLoading && <div className="p-8 text-lg text-slate-600 animate-pulse">Generating a reading challenge for you...</div>}
            {error && <div className="p-8 text-lg text-red-600 bg-red-50 rounded-lg border border-red-200">{error}</div>}
            
            {!isLoading && !error && exercise && (
                <>
                    {exercise.story_context && (
                        <div className="text-left text-lg md:text-xl text-indigo-800 mb-6 leading-relaxed bg-indigo-50 p-6 rounded-xl border-l-4 border-indigo-500 font-serif italic shadow-sm flex items-start gap-3">
                            <div className="flex-1">{exercise.story_context}</div>
                            <ReadAloudButton text={exercise.story_context} user={user} className="mt-1" />
                        </div>
                    )}
                    <div className="text-3xl md:text-5xl font-medium text-slate-800 mb-8 p-8 bg-slate-50 rounded-xl min-h-[160px] flex items-center justify-center flex-wrap shadow-inner border border-slate-100">
                        {renderSentence()}
                    </div>
                    
                    {results && (
                        <div className="flex justify-center gap-8 my-6 text-center animate-fade-in bg-slate-50 p-4 rounded-lg">
                             <div>
                                <p className="text-4xl font-bold text-blue-500">{results.wpm}</p>
                                <p className="text-sm text-slate-500 uppercase tracking-wide">WPM</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-green-500">{results.accuracy}%</p>
                                <p className="text-sm text-slate-500 uppercase tracking-wide">Accuracy</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="my-6">
                       {renderButton()}
                    </div>
                    
                    {isListening && (
                        <p className="text-slate-500 italic mt-4">Read the sentence aloud...</p>
                    )}
                </>
            )}
        </div>
    );
};

export default ReadingView;
