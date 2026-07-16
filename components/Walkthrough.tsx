import React, { useMemo } from 'react';
import { Joyride, Step, STATUS, EventData } from 'react-joyride';

export type AppView = 'user-selection' | 'dashboard' | 'subject-view' | 'session-summary';

interface WalkthroughProps {
  run: boolean;
  onFinish: () => void;
  view: AppView;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ run, onFinish, view }) => {
  const steps = useMemo(() => {
    switch (view) {
      case 'user-selection':
        return [
          {
            target: '.user-selection-container',
            content: 'Welcome to EduHelper! This is the profile selection screen.',
            placement: 'center' as const,
            disableBeacon: true,
          },
          {
            target: '.add-user-btn',
            content: 'Click here to create a new student profile and set their preferences.',
            placement: 'bottom' as const,
          }
        ];
      case 'dashboard':
        return [
          {
            target: '.dashboard-settings',
            content: 'Customize the learning experience here! Adjust difficulty, story mode, dyslexia font, and read-aloud options.',
            placement: 'bottom' as const,
            disableBeacon: true,
          },
          {
            target: '.subject-cards',
            content: 'Choose a subject (Math, English, or Hebrew) to begin practicing.',
            placement: 'top' as const,
          },
          {
            target: '.progress-section',
            content: 'Track the student\'s progress across different subjects.',
            placement: 'top' as const,
          }
        ];
      case 'subject-view':
        return [
          {
            target: '.category-selection',
            content: 'Select a specific topic to practice in this subject.',
            placement: 'center' as const,
            disableBeacon: true,
          }
        ];
      case 'session-summary':
        return [
          {
            target: '.session-summary-container',
            content: 'Great job! Here you can review the results of your practice session.',
            placement: 'center' as const,
            disableBeacon: true,
          },
          {
            target: '.back-to-dashboard-btn',
            content: 'Click here to return to the main dashboard.',
            placement: 'bottom' as const,
          }
        ];
      default:
        return [];
    }
  }, [view]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  if (!steps.length) return null;

  return (
    <Joyride
      key={view}
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      options={{
        showProgress: true,
        primaryColor: "#2563eb",
        zIndex: 10000
      }}
    />
  );
};

export default Walkthrough;
