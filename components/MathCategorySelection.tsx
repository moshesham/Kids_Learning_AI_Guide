import React from 'react';
import { User, MathCategory } from '../types';
import SubjectCard from './SubjectCard'; // Reusing for consistent UI
import AdditionIcon from './icons/AdditionIcon';
import SubtractionIcon from './icons/SubtractionIcon';
import MultiplicationIcon from './icons/MultiplicationIcon';
import DivisionIcon from './icons/DivisionIcon';
import FractionsIcon from './icons/FractionsIcon';

interface MathCategorySelectionProps {
  user: User;
  onSelectCategory: (category: MathCategory) => void;
  onBack: () => void;
}

const categoriesByGrade: Record<number, { cat: MathCategory, title: string, desc: string, icon: React.ReactNode, color: 'blue' | 'green' | 'purple' }[]> = {
  1: [
    { cat: 'counting', title: 'Counting', desc: 'Let\'s count some fun objects!', icon: <AdditionIcon />, color: 'blue' },
    { cat: 'addition', title: 'Addition', desc: 'Putting numbers together.', icon: <AdditionIcon />, color: 'green' },
    { cat: 'subtraction', title: 'Subtraction', desc: 'Taking numbers away.', icon: <SubtractionIcon />, color: 'purple' },
  ],
  2: [
    { cat: 'addition', title: 'Addition', desc: 'Putting numbers together.', icon: <AdditionIcon />, color: 'blue' },
    { cat: 'subtraction', title: 'Subtraction', desc: 'Taking numbers away.', icon: <SubtractionIcon />, color: 'green' },
  ],
  3: [
    { cat: 'addition', title: 'Addition', desc: 'Getting faster with bigger numbers.', icon: <AdditionIcon />, color: 'blue' },
    { cat: 'subtraction', title: 'Subtraction', desc: 'Solving tricky takeaways.', icon: <SubtractionIcon />, color: 'green' },
    { cat: 'multiplication', title: 'Multiplication', desc: 'Learning about groups.', icon: <MultiplicationIcon />, color: 'purple' },
  ],
  4: [
    { cat: 'multiplication', title: 'Multiplication', desc: 'Mastering the times tables.', icon: <MultiplicationIcon />, color: 'blue' },
    { cat: 'division', title: 'Division', desc: 'Sharing numbers equally.', icon: <DivisionIcon />, color: 'green' },
  ],
  5: [
    { cat: 'multiplication', title: 'Multiplication', desc: 'Working with larger numbers.', icon: <MultiplicationIcon />, color: 'blue' },
    { cat: 'division', title: 'Division', desc: 'Solving division puzzles.', icon: <DivisionIcon />, color: 'green' },
    { cat: 'fractions', title: 'Fractions', desc: 'Understanding parts of a whole.', icon: <FractionsIcon />, color: 'purple' },
  ],
  6: [
    { cat: 'division', title: 'Division', desc: 'Advanced division problems.', icon: <DivisionIcon />, color: 'blue' },
    { cat: 'fractions', title: 'Fractions', desc: 'Adding and subtracting fractions.', icon: <FractionsIcon />, color: 'green' },
  ],
};

const MathCategorySelection: React.FC<MathCategorySelectionProps> = ({ user, onSelectCategory, onBack }) => {
  const availableCategories = categoriesByGrade[user.grade] || categoriesByGrade[1];

  return (
    <div className="text-center relative">
      <button 
        onClick={onBack}
        className="absolute top-0 left-0 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      >
        &larr; Back to Subjects
      </button>
      <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">Math Topics</h1>
      <p className="text-lg text-slate-600 mb-12">What would you like to practice today, {user.name}?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {availableCategories.map(({ cat, title, desc, icon, color }) => (
            <SubjectCard 
                key={cat}
                subject="math"
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

export default MathCategorySelection;