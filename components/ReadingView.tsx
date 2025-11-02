import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, SessionSummaryData, ReadingPracticeExercise, WordStatus } from '../types';
import { generateEnglishExercise } from '../services/geminiService';
import MicIcon from './icons/MicIcon';

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
}

interface SpeechRecognitionEvent extends Event {
  results: {
    isFinal: boolean;
    [key: number]: { transcript: string };
  }[];
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
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
}

const ReadingView: React.FC<ReadingViewProps> = ({ user, initialProgress, onBack, onSessionComplete }) => {
    const [exercise, setExercise] = useState<ReadingPracticeExercise | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [sessionWords, setSessionWords] = useState<{ sentence: string, wpm: number, accuracy: number }[]>([]);
    
    const [status, setStatus] = useState<'idle' | 'listening' | 'finished'>('idle');
    const [wordStatuses, setWordStatuses] = useState<WordStatus[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const originalWords = exercise?.sentence.trim().split(/\s+/) || [];

    const fetchExercise = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setStatus('idle');
        setWordStatuses([]);
        try {
            const ex = await generateEnglishExercise(user, 'reading_practice', questionCount === 0 ? 'first' : undefined);
            if (ex.type === 'reading_practice') {
                setExercise(ex);
                setWordStatuses(new Array(ex.sentence.trim().split(/\s+/).length).fill('pending'));
            } else {
                throw new Error("Generated wrong exercise type.");
            }
        } catch (err) {
            setError('Oops! We had trouble generating a sentence. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [user, questionCount]);

    useEffect(() => {
        fetchExercise();
    }, [fetchExercise]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Sorry, your browser doesn't support speech recognition.");
            return;
        }
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            const spokenWords = finalTranscript.trim().toLowerCase().split(/\s+/);
            const newStatuses: WordStatus[] = [...wordStatuses];
            let changed = false;

            originalWords.forEach((originalWord, index) => {
                const cleanOriginalWord = originalWord.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");
                if (index < spokenWords.length) {
                    if (spokenWords[index] === cleanOriginalWord) {
                        if (newStatuses[index] !== 'correct') {
                            newStatuses[index] = 'correct';
                            changed = true;
                        }
                    } else {
                         if (newStatuses[index] !== 'incorrect') {
                            newStatuses[index] = 'incorrect';
                            changed = true;
                        }
                    }
                }
            });

            if (changed) {
                 setWordStatuses(newStatuses);
            }
        };
        
        recognition.onend = () => {
             if (status === 'listening') {
                // If it stops unexpectedly, restart it.
                recognition.start();
            }
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [originalWords, status]); // Re-create if originalWords changes

    const handleStartReading = () => {
        if (recognitionRef.current) {
            setStartTime(Date.now());
            setStatus('listening');
            setWordStatuses(new Array(originalWords.length).fill('pending'));
            recognitionRef.current.start();
        }
    };

    const handleStopReading = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setStatus('finished');
            
            const endTime = Date.now();
            const durationInMinutes = (endTime - (startTime || endTime)) / 60000;
            const correctCount = wordStatuses.filter(s => s === 'correct').length;
            
            const wpm = durationInMinutes > 0 ? Math.round(correctCount / durationInMinutes) : 0;
            const accuracy = originalWords.length > 0 ? Math.round((correctCount / originalWords.length) * 100) : 0;
            
            setSessionWords(prev => [...prev, { sentence: exercise!.sentence, wpm, accuracy }]);
        }
    };

    const handleNext = () => {
        if (questionCount + 1 >= QUESTIONS_PER_SESSION) {
            // Finish session
            const totalWPM = sessionWords.reduce((acc, s) => acc + s.wpm, 0);
            const totalAccuracy = sessionWords.reduce((acc, s) => acc + s.accuracy, 0);
            const avgWPM = Math.round(totalWPM / sessionWords.length) || 0;
            const avgAccuracy = Math.round(totalAccuracy / sessionWords.length) || 0;
            const newProgress = initialProgress + 20; // 20% for a full session

            onSessionComplete({
                correct: avgAccuracy, // Re-using for summary
                incorrect: 100 - avgAccuracy,
                subject: 'english',
                category: 'reading_practice',
                wpm: avgWPM,
                accuracy: avgAccuracy,
            }, Math.min(100, newProgress));

        } else {
            setQuestionCount(prev => prev + 1);
        }
    }
    
    const renderSentence = () => {
        if (!exercise) return null;
        return originalWords.map((word, index) => {
            const status = wordStatuses[index];
            let colorClass = 'text-slate-800';
            if (status === 'correct') colorClass = 'text-green-600';
            if (status === 'incorrect') colorClass = 'text-red-500 line-through';

            return <span key={index} className={`transition-colors duration-300 ${colorClass}`}>{word} </span>
        });
    }

    const renderButton = () => {
        if (status === 'idle') {
            return (
                <button onClick={handleStartReading} className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-blue-700 transition-colors">
                    <MicIcon /> Start Reading
                </button>
            );
        }
        if (status === 'listening') {
             return (
                <button onClick={handleStopReading} className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-red-700 transition-colors">
                    <div className="animate-pulse">🔴</div> Listening... (Click to Finish)
                </button>
            );
        }
        if (status === 'finished') {
             return (
                <button onClick={handleNext} className="w-full max-w-xs mx-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-green-700 transition-colors">
                    {questionCount + 1 >= QUESTIONS_PER_SESSION ? 'Finish Session' : 'Next Sentence'}
                </button>
            );
        }
        return null;
    }
    
    const results = status === 'finished' ? sessionWords[sessionWords.length - 1] : null;

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto text-center relative">
            <button onClick={onBack} className="absolute top-4 left-4 text-sm text-slate-500 hover:text-blue-600 transition-colors">&larr; Back</button>
            <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(questionCount / QUESTIONS_PER_SESSION) * 100}%` }}></div>
                </div>
                <span className="text-sm text-slate-500 mt-1">Sentence {questionCount + 1} of {QUESTIONS_PER_SESSION}</span>
            </div>

            {isLoading && <div className="p-8 text-lg text-slate-600">Loading your sentence...</div>}
            {error && <div className="p-8 text-lg text-red-600">{error}</div>}
            
            {!isLoading && !error && exercise && (
                <>
                    <h2 className="text-2xl md:text-4xl font-semibold text-slate-800 mb-8 p-4 bg-slate-50 rounded-lg min-h-[100px] flex items-center justify-center">
                        {renderSentence()}
                    </h2>
                    
                    {results && (
                        <div className="flex justify-center gap-8 my-6 text-center animate-fade-in">
                             <div>
                                <p className="text-4xl font-bold text-blue-500">{results.wpm}</p>
                                <p className="text-slate-500">Words Per Minute</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-green-500">{results.accuracy}%</p>
                                <p className="text-slate-500">Accuracy</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="my-6">
                       {renderButton()}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReadingView;
