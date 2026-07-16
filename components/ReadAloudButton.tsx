import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface ReadAloudButtonProps {
  text: string;
  user: User;
  className?: string;
}

const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({ text, user, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!('speechSynthesis' in window)) {
      console.warn("Browser does not support text-to-speech.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Create an utterance with all the text we want to read
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = user.readAloudSpeed || 1;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!user.readAloudEnabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'} ${className}`}
      title={isPlaying ? "Stop reading" : "Read aloud"}
      aria-label={isPlaying ? "Stop reading" : "Read aloud"}
    >
      {isPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
};

export default ReadAloudButton;
