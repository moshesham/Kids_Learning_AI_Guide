import React from 'react';
import { Subject, Progress, User } from '../types';
import SubjectCard from './SubjectCard';
import MathIcon from './icons/MathIcon';
import EnglishIcon from './icons/EnglishIcon';
import HebrewIcon from './icons/HebrewIcon';

interface DashboardProps {
  user: User;
  onSelectSubject: (subject: Subject) => void;
  progress: Progress;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSelectSubject, progress, onLogout }) => {
  return (
    <div className="text-center relative">
      <button 
        onClick={onLogout}
        className="absolute top-0 right-0 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        Switch User
      </button>
      <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">Welcome, {user.name}!</h1>
      <p className="text-lg text-slate-600 mb-12">Choose a subject to start your adventure.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SubjectCard
          subject="math"
          title="Math"
          description="Let's solve some fun number puzzles!"
          icon={<MathIcon />}
          color="blue"
          progress={progress.math}
          onClick={() => onSelectSubject('math')}
        />
        <SubjectCard
          subject="english"
          title="English"
          description="Read stories and learn new words."
          icon={<EnglishIcon />}
          color="green"
          progress={progress.english}
          onClick={() => onSelectSubject('english')}
        />
        <SubjectCard
          subject="hebrew"
          title="Hebrew"
          description="Explore reading and understanding Hebrew."
          icon={<HebrewIcon />}
          color="purple"
          progress={progress.hebrew}
          onClick={() => onSelectSubject('hebrew')}
        />
      </div>
    </div>
  );
};

export default Dashboard;
