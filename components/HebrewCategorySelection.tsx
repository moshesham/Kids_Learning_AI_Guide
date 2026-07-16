import React from 'react';
import { User, HebrewCategory } from '../types';
import SubjectCard from './SubjectCard';
import HebrewIcon from './icons/HebrewIcon';
import AdditionIcon from './icons/AdditionIcon';
import VocabularyIcon from './icons/VocabularyIcon';

interface HebrewCategorySelectionProps {
  user: User;
  onSelectCategory: (category: HebrewCategory) => void;
  onBack: () => void;
}

const HebrewCategorySelection: React.FC<HebrewCategorySelectionProps> = ({ user, onSelectCategory, onBack }) => {
  const categories: { cat: HebrewCategory, title: string, desc: string, icon: React.ReactNode, color: 'blue' | 'green' | 'purple' }[] = [
    { cat: 'social_scripting', title: 'Social Scripting', desc: 'Practice social interactions with an AI peer.', icon: <HebrewIcon />, color: 'purple' },
    { cat: 'gematria', title: 'Gematria Bridge', desc: 'Calculate the numerical value of Hebrew words.', icon: <AdditionIcon />, color: 'blue' },
    { cat: 'shoresh_tree', title: 'Shoresh Tree', desc: 'Discover how Hebrew words grow from 3-letter roots.', icon: <HebrewIcon />, color: 'purple' },
    { cat: 'vocabulary', title: 'Vocabulary', desc: 'Learn new Hebrew words and meanings.', icon: <VocabularyIcon />, color: 'green' },
  ];

  return (
    <div className="text-center relative">
      <button 
        onClick={onBack}
        className="absolute top-0 left-0 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        &larr; Back to Subjects
      </button>
      <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">Hebrew Topics</h1>
      <p className="text-lg text-slate-600 mb-12">What would you like to practice today, {user.name}?</p>
      <div className="category-selection grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {categories.map(({ cat, title, desc, icon, color }) => (
            <SubjectCard 
                key={cat}
                subject="hebrew"
                title={title}
                description={desc}
                icon={icon}
                color={color}
                progress={0}
                onClick={() => onSelectCategory(cat)}
            />
        ))}
      </div>
    </div>
  );
};

export default HebrewCategorySelection;
