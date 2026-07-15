
import React from 'react';
import { VisualMathExercise } from '../types';

interface MathVisualizationProps {
  visualization: VisualMathExercise['visualization'];
  isIncorrect?: boolean;
}

const MathVisualization: React.FC<MathVisualizationProps> = ({ visualization, isIncorrect }) => {
  const { elements, operation } = visualization;

  return (
    <div className={`flex items-center justify-center space-x-4 md:space-x-6 my-6 p-6 rounded-2xl transition-all duration-500 border-4 ${isIncorrect ? 'bg-red-100 border-red-500 shadow-md' : 'bg-transparent border-transparent'}`}>
      {elements.map((element, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: element.count }).map((_, i) => (
              <span key={i} className={`text-4xl md:text-6xl select-none transition-all duration-300 hover:scale-110 cursor-default rounded-xl p-1 ${isIncorrect ? 'ring-4 ring-red-500 animate-pulse bg-red-50' : ''}`} role="img" aria-label={element.emoji}>
                {element.emoji}
              </span>
            ))}
          </div>
          {index < elements.length - 1 && (
            <span className={`font-bold transition-all duration-300 ${isIncorrect ? 'text-6xl md:text-8xl text-red-600 animate-pulse scale-110' : 'text-4xl md:text-6xl text-blue-500'}`}>
              {operation}
            </span>
          )}
        </React.Fragment>
      ))}
       <span className={`font-bold transition-all duration-300 ${isIncorrect ? 'text-6xl md:text-8xl text-red-600' : 'text-4xl md:text-6xl text-slate-500'}`}>= ?</span>
    </div>
  );
};

export default MathVisualization;
