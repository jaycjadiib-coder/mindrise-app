import React, { useState } from 'react';
import {
  User,
  Settings,
  Flame,
  Clock,
  BookOpen,
  Award,
  Crown,
  Shield,
  LogOut,
  Save,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { BackButton } from '../common/BackButton';

interface UserProfileProps {
  onBack?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const { user, isAdmin, logout, updateUserProfile } = useAuth();
  const { stats } = useData();

  const [name, setName] = useState(user?.name || '');
  const [dailyGoal, setDailyGoal] = useState(user?.dailyReadingGoal || 20);
  const [interests, setInterests] = useState<string[]>(user?.interests || ['Discipline', 'Mindset', 'Productivity']);
  const [saved, setSaved] = useState(false);

  const interestPillars = [
    'Discipline',
    'Mindset',
    'Productivity',
    'Focus',
    'Health',
    'Fitness',
    'Wealth',
    'Relationships',
    'Confidence',
    'Psychology',
    'Career',
    'Leadership',
    'Spirituality',
    'Reading',
  ];

  const toggleInterest = (pill: string) => {
    if (interests.includes(pill)) {
      if (interests.length > 1) {
        setInterests(interests.filter((i) => i !== pill));
      }
    } else {
      setInterests([...interests, pill]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name,
      dailyReadingGoal: Number(dailyGoal),
      interests,
    });
    setSaved(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-emerald-950/40 pb-6 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Scholar Profile & Settings
            </h1>
            <p className="mt-1 text-xs text-stone-400">
              Manage your intellectual identity, daily reading quotas, and personalized growth vectors.
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/20 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Identity Card */}
      <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={user?.name || 'Profile'}
              className="h-24 w-24 rounded-full object-cover border-2 border-emerald-500/60 shadow-xl"
            />
            {user?.premium && (
              <span className="absolute bottom-0 right-0 rounded-full bg-amber-400 p-1.5 text-black shadow-md" title="MindRise Black Member">
                <Crown className="h-4 w-4 fill-black" />
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-serif text-2xl font-bold text-white">{user?.name}</h2>
              {user?.premium ? (
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  Black Member
                </span>
              ) : (
                <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-[10px] font-medium text-stone-400">
                  Free Scholar
                </span>
              )}
              {isAdmin && (
                <span className="rounded-full bg-purple-900/60 px-2.5 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-700/50 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-400">{user?.email}</p>
            <p className="mt-2 text-xs text-emerald-400 font-medium">
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-stone-800/80 pt-6 sm:grid-cols-4">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider text-stone-500">Current Streak</span>
            <div className="font-serif text-2xl font-bold text-amber-400 flex items-center justify-center gap-1 mt-1">
              <Flame className="h-4 w-4 fill-amber-500" />
              {stats?.currentStreak ?? user?.currentStreak ?? 0}d
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider text-stone-500">Longest Streak</span>
            <div className="font-serif text-2xl font-bold text-stone-200 mt-1">
              {stats?.longestStreak ?? user?.longestStreak ?? 0}d
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider text-stone-500">Total Reading</span>
            <div className="font-serif text-2xl font-bold text-emerald-400 mt-1">
              {Math.round((stats?.totalReadingTimeMinutes ?? user?.totalReadingMinutes ?? 0) / 60)}h
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-wider text-stone-500">Masterworks</span>
            <div className="font-serif text-2xl font-bold text-purple-400 mt-1">
              {stats?.booksCompleted ?? user?.totalBooksCompleted ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-6 sm:p-8 space-y-6">
        <h3 className="font-serif text-lg font-bold text-white border-b border-stone-800 pb-3">
          Preferences & Quota Calibration
        </h3>

        <div>
          <label className="block text-xs font-medium text-stone-300 mb-1">Scholar Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900/50 p-2.5 text-xs text-white outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <div className="flex justify-between max-w-md text-xs font-medium text-stone-300 mb-2">
            <span>Daily Reading Goal</span>
            <span className="text-emerald-400 font-bold">{dailyGoal} Minutes</span>
          </div>
          <div className="flex gap-2 max-w-md">
            {[10, 20, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyGoal(mins)}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                  dailyGoal === mins
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                    : 'border-stone-800 bg-stone-900/40 text-stone-400 hover:text-stone-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Growth Vectors */}
        <div>
          <label className="block text-xs font-medium text-stone-300 mb-2">
            Active Growth Vectors (MindRise Coach Focus)
          </label>
          <div className="flex flex-wrap gap-2">
            {interestPillars.map((pill) => {
              const isSelected = interests.includes(pill);
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => toggleInterest(pill)}
                  className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                    isSelected
                      ? 'border border-emerald-500 bg-emerald-950/80 text-emerald-300 font-semibold'
                      : 'border border-stone-800 bg-stone-900/30 text-stone-500 hover:border-stone-700 hover:text-stone-300'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-stone-800/80 pt-4">
          {saved && <span className="text-xs text-emerald-400 font-medium">Changes saved successfully!</span>}
          <div className="ml-auto">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-semibold text-black shadow-lg shadow-emerald-950/60 hover:bg-emerald-400"
            >
              <Save className="h-4 w-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
