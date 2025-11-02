import React, { useState } from 'react';
import { User, Grade } from '../types';
import UserIcon from './icons/UserIcon';
import AddUserIcon from './icons/AddUserIcon';

interface UserSelectionProps {
  users: User[];
  onSelectUser: (userId: string) => void;
  onAddUser: (name: string, grade: Grade) => void;
}

const gradeOptions: Grade[] = [1, 2, 3, 4, 5, 6];

const UserSelection: React.FC<UserSelectionProps> = ({ users, onSelectUser, onAddUser }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserGrade, setNewUserGrade] = useState<Grade>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onAddUser(newUserName.trim(), newUserGrade);
      setNewUserName('');
      setNewUserGrade(1);
      setShowAddForm(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-3xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-4">Who is learning today?</h1>
      <p className="text-lg text-slate-600 mb-12">Please select your profile to continue.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {users.map(user => (
          <div 
            key={user.id} 
            onClick={() => onSelectUser(user.id)}
            className="p-4 flex flex-col items-center justify-center rounded-2xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-2 bg-slate-100 hover:bg-blue-100 border-b-4 border-slate-300 hover:border-blue-500"
          >
            <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-full bg-white shadow-md">
                <UserIcon />
            </div>
            <span className="font-bold text-xl text-slate-800">{user.name}</span>
            <span className="text-sm text-slate-500">Grade {user.grade}</span>
          </div>
        ))}

        <div 
            onClick={() => setShowAddForm(true)}
            className="p-4 flex flex-col items-center justify-center rounded-2xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-2 bg-green-100 hover:bg-green-200 border-b-4 border-green-300 hover:border-green-500"
        >
            <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-full bg-white shadow-md">
                <AddUserIcon />
            </div>
            <span className="font-bold text-xl text-green-800">Add User</span>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full relative">
            <button onClick={() => setShowAddForm(false)} className="absolute top-2 right-4 text-3xl text-slate-500 hover:text-slate-800">&times;</button>
            <h2 className="text-2xl font-bold text-blue-600 mb-6">Create New Profile</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-left font-bold text-slate-700 mb-1">Name</label>
                <input
                  id="name"
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full p-3 text-lg border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Learner's Name"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="grade" className="block text-left font-bold text-slate-700 mb-1">Grade</label>
                <select
                  id="grade"
                  value={newUserGrade}
                  onChange={e => setNewUserGrade(parseInt(e.target.value) as Grade)}
                  className="w-full p-3 text-lg border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  {gradeOptions.map(grade => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
                disabled={!newUserName.trim()}
              >
                Start Learning
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelection;
