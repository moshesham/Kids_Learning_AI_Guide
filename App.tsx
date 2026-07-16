import React, { useState, useEffect } from 'react';
import { User, Subject, Progress, Grade, SessionSummaryData } from './types';
import UserSelection from './components/UserSelection';
import Dashboard from './components/Dashboard';
import SubjectView from './components/SubjectView';
import SessionSummary from './components/SessionSummary';
import Walkthrough, { AppView } from './components/Walkthrough';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);
  const [runTour, setRunTour] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('learnify-users');
      const savedProgress = localStorage.getItem('learnify-progress');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('learnify-users', JSON.stringify(users));
      localStorage.setItem('learnify-progress', JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [users, progress]);

  const handleAddUser = (name: string, grade: Grade, interest: string, difficultyLevel: number, storyMode: boolean, dyslexiaFont: boolean = false) => {
    const newUser: User = { id: Date.now().toString(), name, grade, interest, difficultyLevel, storyMode, dyslexiaFont };
    setUsers(prev => [...prev, newUser]);
    setProgress(prev => ({
      ...prev,
      [newUser.id]: { math: 0, english: 0, hebrew: 0 }
    }));
    setCurrentUser(newUser);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  const handleSelectUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentSubject(null);
    setSessionSummary(null);
  };
  
  const handleSelectSubject = (subject: Subject) => {
    setCurrentSubject(subject);
  };

  const handleBackToDashboard = () => {
    setCurrentSubject(null);
    setSessionSummary(null);
  };

  const handleSessionComplete = (summary: SessionSummaryData, newProgress: number) => {
      if (currentUser) {
        setSessionSummary(summary);
        setProgress(prev => ({
            ...prev,
            [currentUser.id]: {
                ...prev[currentUser.id],
                [summary.subject]: newProgress,
            }
        }));
      }
  };

  const currentAppView: AppView = !currentUser 
    ? 'user-selection' 
    : sessionSummary 
      ? 'session-summary' 
      : currentSubject 
        ? 'subject-view' 
        : 'dashboard';

  const renderContent = () => {
    if (!currentUser) {
      return <UserSelection users={users} onSelectUser={handleSelectUser} onAddUser={handleAddUser} />;
    }
    
    if (sessionSummary) {
      return <SessionSummary summary={sessionSummary} onBack={handleBackToDashboard} />
    }

    if (currentSubject) {
      return (
        <SubjectView
          user={currentUser}
          subject={currentSubject}
          onBack={handleBackToDashboard}
          onSessionComplete={handleSessionComplete}
          initialProgress={progress[currentUser.id]?.[currentSubject] ?? 0}
          onUpdateUser={handleUpdateUser}
        />
      );
    }

    return (
      <Dashboard
        user={currentUser}
        onSelectSubject={handleSelectSubject}
        progress={progress[currentUser.id] || { math: 0, english: 0, hebrew: 0 }}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
      />
    );
  };

  return (
    <div className={`bg-slate-50 min-h-screen flex flex-col relative ${currentUser?.dyslexiaFont ? 'font-lexend' : 'font-sans'}`}>
      <button 
        onClick={() => setRunTour(true)} 
        className="absolute top-4 right-4 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-full font-bold shadow-sm z-50 flex items-center gap-2 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        Walkthrough
      </button>
      <Walkthrough run={runTour} onFinish={() => setRunTour(false)} view={currentAppView} />
      <main className="container mx-auto flex-1 flex items-center justify-center p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
