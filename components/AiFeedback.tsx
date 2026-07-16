
import React from 'react';
import { Feedback, User } from '../types';
import ReadAloudButton from './ReadAloudButton';

interface AiFeedbackProps {
  feedback: Feedback;
  user: User;
}

const AiFeedback: React.FC<AiFeedbackProps> = ({ feedback, user }) => {
  const bgColor = feedback.isCorrect ? 'bg-green-100' : 'bg-orange-100';
  const borderColor = feedback.isCorrect ? 'border-green-500' : 'border-orange-500';
  const textColor = feedback.isCorrect ? 'text-green-800' : 'text-orange-800';
  const icon = feedback.isCorrect ? '🎉' : '🤔';

  return (
    <div className={`p-4 rounded-lg border-l-4 ${borderColor} ${bgColor} ${textColor} shadow-md text-left`}>
      <div className="flex">
        <div className="text-2xl mr-3">{icon}</div>
        <div className="flex-1">
          <p className="font-bold">{feedback.isCorrect ? 'Great job!' : 'Almost there!'}</p>
          <p>{feedback.feedbackText}</p>
        </div>
        <ReadAloudButton text={feedback.feedbackText} user={user} className="mt-1" />
      </div>
    </div>
  );
};

export default AiFeedback;
