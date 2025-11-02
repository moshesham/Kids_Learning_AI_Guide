
import React from 'react';
import { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple';
  progress: number;
  onClick: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    hoverBg: 'hover:bg-blue-200',
    progressBg: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    hoverBg: 'hover:bg-green-200',
    progressBg: 'bg-green-500',
  },
  purple: {
    bg: 'bg-purple-100',
    border: 'border-purple-500',
    hoverBg: 'hover:bg-purple-200',
    progressBg: 'bg-purple-500',
  },
};

const SubjectCard: React.FC<SubjectCardProps> = ({ title, description, icon, color, progress, onClick }) => {
  const classes = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-2 ${classes.bg} border-b-8 ${classes.border} ${classes.hoverBg}`}
    >
      <div className="mb-4 w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-white shadow-md">
        {icon}
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-slate-600 mb-4">{description}</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${classes.progressBg} h-2.5 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
      </div>
      <span className="text-sm mt-1 text-slate-500">{Math.min(progress, 100)}% Complete</span>
    </div>
  );
};

export default SubjectCard;
