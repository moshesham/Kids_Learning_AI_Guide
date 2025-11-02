import React, { useState, useEffect } from 'react';
import { User, Subject, Progress, Grade, SessionSummaryData } from './types';
import UserSelection from './components/UserSelection';
import Dashboard from './components/Dashboard';
import SubjectView from './components/SubjectView';
import SessionSummary from './components/SessionSummary';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);

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

  const handleAddUser = (name: string, grade: Grade) => {
    const newUser: User = { id: Date.now().toString(), name, grade };
    setUsers(prev => [...prev, newUser]);
    setProgress(prev => ({
      ...prev,
      [newUser.id]: { math: 0, english: 0, hebrew: 0 }
    }));
    setCurrentUser(newUser);
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
        />
      );
    }

    return (
      <Dashboard
        user={currentUser}
        onSelectSubject={handleSelectSubject}
        progress={progress[currentUser.id] || { math: 0, english: 0, hebrew: 0 }}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <main className="container mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
