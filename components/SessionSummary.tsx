import React from 'react';
import { SessionSummaryData } from '../types';

interface SessionSummaryProps {
  summary: SessionSummaryData;
  onBack: () => void;
}

const subjectTitles: Record<string, string> = {
  math: 'Math',
  english: 'English',
  hebrew: 'Hebrew'
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ summary, onBack }) => {
  const { correct, incorrect, subject, wpm, accuracy } = summary;
  const total = correct + incorrect;
  const score = (wpm !== undefined && accuracy !== undefined) ? accuracy : (total > 0 ? Math.round((correct / total) * 100) : 0);

  let emoji = '🤔';
  let message = "Good effort! Keep practicing.";
  if (score >= 90) {
    emoji = '🎉';
    message = "Amazing work! You're a superstar!";
  } else if (score >= 70) {
    emoji = '👍';
    message = "Great job! You're making fantastic progress.";
  } else if (score >= 50) {
    emoji = '😊';
    message = "Nice work! You're on the right track.";
  }

  const isReadingPractice = wpm !== undefined && accuracy !== undefined;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">Session Complete!</h1>
      <p className="text-lg text-slate-600 mb-8">You finished your {subjectTitles[subject]} practice.</p>
      
      <div className="text-7xl mb-6">{emoji}</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">{message}</h2>
      
      <div className="flex justify-center gap-8 my-8 text-center">
        {isReadingPractice ? (
            <>
                <div>
                    <p className="text-4xl font-bold text-blue-500">{wpm}</p>
                    <p className="text-slate-500">Avg. WPM</p>
                </div>
                <div>
                    <p className="text-4xl font-bold text-green-500">{accuracy}%</p>
                    <p className="text-slate-500">Avg. Accuracy</p>
                </div>
            </>
        ) : (
            <>
                <div>
                    <p className="text-4xl font-bold text-green-500">{correct}</p>
                    <p className="text-slate-500">Correct</p>
                </div>
                <div>
                    <p className="text-4xl font-bold text-red-500">{incorrect}</p>
                    <p className="text-slate-500">Incorrect</p>
                </div>
                <div>
                    <p className="text-4xl font-bold text-blue-500">{score}%</p>
                    <p className="text-slate-500">Score</p>
                </div>
            </>
        )}
      </div>
      
      <button 
        onClick={onBack}
        className="w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default SessionSummary;
