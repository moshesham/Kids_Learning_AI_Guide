import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
  onUpdateUser: (user: User) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSelectSubject, progress, onLogout, onUpdateUser }) => {
  const [sliderFeedback, setSliderFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (sliderFeedback) {
      const timer = setTimeout(() => setSliderFeedback(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [sliderFeedback]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    const oldValue = user.difficultyLevel || 5;
    
    if (newValue > oldValue) {
      setSliderFeedback('Harder 📈');
    } else if (newValue < oldValue) {
      setSliderFeedback('Easier 📉');
    }
    
    onUpdateUser({ ...user, difficultyLevel: newValue });
  };

  const handleStoryModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateUser({ ...user, storyMode: e.target.checked });
  };

  const handleDyslexiaFontToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateUser({ ...user, dyslexiaFont: e.target.checked });
  };

  const handleReadAloudToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateUser({ ...user, readAloudEnabled: e.target.checked });
  };

  const handleReadAloudSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateUser({ ...user, readAloudSpeed: parseFloat(e.target.value) });
  };

  const chartData = [
    { name: 'Math', score: progress.math || 0, color: '#3b82f6' }, // blue-500
    { name: 'English', score: progress.english || 0, color: '#22c55e' }, // green-500
    { name: 'Hebrew', score: progress.hebrew || 0, color: '#a855f7' }, // purple-500
  ];

  // Calculate Badges
  const badges = [];
  if ((progress.math || 0) >= 20) badges.push({ id: 'math1', title: 'Math Explorer', icon: '🔢', color: 'bg-blue-100 text-blue-800 border-blue-300' });
  if ((progress.math || 0) >= 80) badges.push({ id: 'math2', title: 'Math Master', icon: '🏆', color: 'bg-blue-200 text-blue-900 border-blue-400' });
  if ((progress.english || 0) >= 20) badges.push({ id: 'eng1', title: 'Word Wizard', icon: '📚', color: 'bg-green-100 text-green-800 border-green-300' });
  if ((progress.english || 0) >= 80) badges.push({ id: 'eng2', title: 'Reading Star', icon: '🌟', color: 'bg-green-200 text-green-900 border-green-400' });
  if ((progress.hebrew || 0) >= 20) badges.push({ id: 'heb1', title: 'Hebrew Beginner', icon: 'א', color: 'bg-purple-100 text-purple-800 border-purple-300' });
  if ((progress.hebrew || 0) >= 80) badges.push({ id: 'heb2', title: 'Hebrew Scholar', icon: '📜', color: 'bg-purple-200 text-purple-900 border-purple-400' });

  return (
    <div className="text-center relative max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">Welcome, {user.name}!</h1>
          <p className="text-lg text-slate-600">Grade {user.grade} {user.interest ? `• Loves ${user.interest}` : ''}</p>
        </div>
        <button 
          onClick={onLogout}
          className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200"
        >
          Switch Profile
        </button>
      </div>

      <div className="dashboard-settings bg-white p-6 rounded-2xl shadow-md mb-12 flex flex-col items-stretch gap-6 border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
          <div className="flex-1 w-full relative">
            <label htmlFor="dash-difficulty" className="block text-left font-bold text-slate-700 mb-2">
              Difficulty Level: <span className="text-blue-600">{user.difficultyLevel || 5}</span>
              {sliderFeedback && (
                <span className="ml-3 text-sm font-semibold text-blue-500 animate-fade-in bg-blue-50 px-2 py-1 rounded-md">
                  {sliderFeedback}
                </span>
              )}
            </label>
            <input
              id="dash-difficulty"
              type="range"
              min="1"
              max="10"
              value={user.difficultyLevel || 5}
              onChange={handleDifficultyChange}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
              <span>Easy</span>
              <span>Advanced</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 items-center justify-center">
            <div className="flex items-center gap-3">
              <label htmlFor="dash-story" className="font-bold text-slate-700 cursor-pointer">Story Mode</label>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  name="toggle" 
                  id="dash-story" 
                  checked={user.storyMode !== false}
                  onChange={handleStoryModeToggle}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-6 checked:border-blue-600 border-slate-300"
                />
                <label htmlFor="dash-story" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${user.storyMode !== false ? 'bg-blue-600' : 'bg-slate-300'}`}></label>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <label htmlFor="dash-dyslexia" className="font-bold text-slate-700 cursor-pointer">Dyslexia Font</label>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  name="toggle-dyslexia" 
                  id="dash-dyslexia" 
                  checked={user.dyslexiaFont === true}
                  onChange={handleDyslexiaFontToggle}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-6 checked:border-blue-600 border-slate-300"
                />
                <label htmlFor="dash-dyslexia" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${user.dyslexiaFont === true ? 'bg-blue-600' : 'bg-slate-300'}`}></label>
              </div>
            </div>
             <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <label htmlFor="dash-readaloud" className="font-bold text-slate-700 cursor-pointer">Read Aloud</label>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  name="toggle-readaloud" 
                  id="dash-readaloud" 
                  checked={user.readAloudEnabled === true}
                  onChange={handleReadAloudToggle}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-6 checked:border-blue-600 border-slate-300"
                />
                <label htmlFor="dash-readaloud" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${user.readAloudEnabled === true ? 'bg-blue-600' : 'bg-slate-300'}`}></label>
              </div>
            </div>
          </div>
        </div>
        
        {user.readAloudEnabled && (
          <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
             <label htmlFor="dash-readspeed" className="font-bold text-slate-700 whitespace-nowrap">
                Reading Speed: <span className="text-blue-600">{user.readAloudSpeed || 1}x</span>
              </label>
              <div className="flex-1 w-full max-w-md flex items-center gap-3">
                <span className="text-sm text-slate-500">Slow</span>
                <input
                  id="dash-readspeed"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={user.readAloudSpeed || 1}
                  onChange={handleReadAloudSpeedChange}
                  className="w-full accent-blue-600"
                />
                <span className="text-sm text-slate-500">Fast</span>
              </div>
          </div>
        )}
      </div>

      <div className="subject-cards grid grid-cols-1 md:grid-cols-3 gap-8">
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

      <div className="progress-section grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col">
          <h2 className="text-2xl font-bold text-slate-700 mb-6 text-left">Your Progress</h2>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={14} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col">
          <h2 className="text-2xl font-bold text-slate-700 mb-6 text-left">Achievements</h2>
          {badges.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-lg">
              Complete more exercises to earn badges!
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-start">
              {badges.map(badge => (
                <div key={badge.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${badge.color} shadow-sm animate-fade-in`}>
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="font-bold text-sm">{badge.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
