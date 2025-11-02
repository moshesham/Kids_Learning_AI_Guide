
import React from 'react';
import { Feedback } from '../types';

interface AiFeedbackProps {
  feedback: Feedback;
}

const AiFeedback: React.FC<AiFeedbackProps> = ({ feedback }) => {
  const bgColor = feedback.isCorrect ? 'bg-green-100' : 'bg-orange-100';
  const borderColor = feedback.isCorrect ? 'border-green-500' : 'border-orange-500';
  const textColor = feedback.isCorrect ? 'text-green-800' : 'text-orange-800';
  const icon = feedback.isCorrect ? '🎉' : '🤔';

  return (
    <div className={`p-4 rounded-lg border-l-4 ${borderColor} ${bgColor} ${textColor} shadow-md text-left`}>
      <div className="flex">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <p className="font-bold">{feedback.isCorrect ? 'Great job!' : 'Almost there!'}</p>
          <p>{feedback.feedbackText}</p>
        </div>
      </div>
    </div>
  );
};

export default AiFeedback;
