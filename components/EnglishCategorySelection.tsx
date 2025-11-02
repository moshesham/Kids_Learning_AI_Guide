import React from 'react';
import { User, EnglishCategory } from '../types';
import SubjectCard from './SubjectCard';
import ReadingIcon from './icons/ReadingIcon';
import VocabularyIcon from './icons/VocabularyIcon';
import ComprehensionIcon from './icons/ComprehensionIcon';
import MicIcon from './icons/MicIcon';

interface EnglishCategorySelectionProps {
  user: User;
  onSelectCategory: (category: EnglishCategory) => void;
  onBack: () => void;
}

const EnglishCategorySelection: React.FC<EnglishCategorySelectionProps> = ({ user, onSelectCategory, onBack }) => {
  const categories: { cat: EnglishCategory, title: string, desc: string, icon: React.ReactNode, color: 'blue' | 'green' | 'purple' }[] = [
    { cat: 'reading_practice', title: 'Reading Practice', desc: 'Read a sentence out loud and get feedback.', icon: <MicIcon />, color: 'blue' },
    { cat: 'vocabulary', title: 'Vocabulary', desc: 'Learn new words and their meanings.', icon: <VocabularyIcon />, color: 'green' },
    { cat: 'comprehension', title: 'Reading Comprehension', desc: 'Read a passage and answer questions.', icon: <ComprehensionIcon />, color: 'purple' },
  ];

  return (
    <div className="text-center relative">
      <button 
        onClick={onBack}
        className="absolute top-0 left-0 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        &larr; Back to Subjects
      </button>
      <h1 className="text-4xl md:text-5xl font-bold text-green-600 mb-4">English Topics</h1>
      <p className="text-lg text-slate-600 mb-12">What would you like to practice today, {user.name}?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map(({ cat, title, desc, icon, color }) => (
            <SubjectCard 
                key={cat}
                subject="english"
                title={title}
                description={desc}
                icon={icon}
                color={color}
                progress={0} // Progress is tracked on the main subject, not sub-category
                onClick={() => onSelectCategory(cat)}
            />
        ))}
      </div>
    </div>
  );
};

export default EnglishCategorySelection;
