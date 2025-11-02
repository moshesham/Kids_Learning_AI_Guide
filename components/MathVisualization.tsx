import React from 'react';
import { VisualMathExercise } from '../types';

interface MathVisualizationProps {
  visualization: VisualMathExercise['visualization'];
}

const MathVisualization: React.FC<MathVisualizationProps> = ({ visualization }) => {
  const { elements, operation } = visualization;

  return (
    <div className="flex items-center justify-center space-x-4 md:space-x-6 my-6">
      {elements.map((element, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: element.count }).map((_, i) => (
              <span key={i} className="text-4xl md:text-6xl" role="img" aria-label={element.emoji}>
                {element.emoji}
              </span>
            ))}
          </div>
          {index < elements.length - 1 && (
            <span className="text-4xl md:text-6xl font-bold text-blue-500">
              {operation}
            </span>
          )}
        </React.Fragment>
      ))}
       <span className="text-4xl md:text-6xl font-bold text-slate-500">= ?</span>
    </div>
  );
};

export default MathVisualization;
