import React, { useState } from 'react';
import {
  Target,
  Flame,
  Clock,
  BookOpen,
  Trophy,
  Calendar,
  Plus,
  TrendingUp,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const ReadingGoals: React.FC = () => {
  const { user } = useAuth();
  const { goals, updateGoal, stats } = useData();

  const [logMinutes, setLogMinutes] = useState(20);
  const [showLogModal, setShowLogModal] = useState(false);

  const dailyGoal = goals.find((g) => g.id === 'goal-daily-reading') || {
    id: 'goal-daily-reading',
    title: 'Daily Reading',
    target: 30,
    current: 24,
    unit: 'minutes',
    period: 'daily',
  };

  const monthlyGoal = goals.find((g) => g.id === 'goal-monthly-books') || {
    id: 'goal-monthly-books',
    title: 'Monthly Reading',
    target: 2,
    current: 1,
    unit: 'books',
    period: 'monthly',
  };

  const yearlyGoal = goals.find((g) => g.id === 'goal-yearly-books') || {
    id: 'goal-yearly-books',
    title: '2026 Reading Challenge',
    target: 24,
    current: 4,
    unit: 'books',
    period: 'yearly',
  };

  const handleLogReading = (e: React.FormEvent) => {
    e.preventDefault();
    const newCurrent = dailyGoal.current + Number(logMinutes);
    updateGoal(dailyGoal.id, newCurrent);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setShowLogModal(false);
  };

  // Generate 28-day reading activity heatmap
  const daysInGrid = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const intensity = i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
    return {
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      intensity, // 0 = none, 1 = 15m, 2 = 30m, 3 = 60m+
    };
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-emerald-950/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Reading Goals & Momentum
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Compound your knowledge through calibrated daily reading targets and lifetime progress metrics.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-emerald-950/50 hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          <span>Log Reading Session</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-800/80 bg-[#080d0a] p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
            <Flame className="h-4 w-4 fill-amber-500" />
            <span className="text-xs uppercase tracking-wider font-semibold">Streak</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">
            {stats?.currentStreak ?? user?.currentStreak ?? 12} <span className="text-xs text-stone-500">Days</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Best: {stats?.longestStreak ?? 28} Days</div>
        </div>

        <div className="rounded-2xl border border-stone-800/80 bg-[#080d0a] p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider font-semibold">Time Read</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">
            {Math.round((stats?.totalReadingTimeMinutes ?? 840) / 60)} <span className="text-xs text-stone-500">Hours</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-400">{stats?.totalReadingTimeMinutes ?? 840} total mins</div>
        </div>

        <div className="rounded-2xl border border-stone-800/80 bg-[#080d0a] p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-stone-300 mb-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider font-semibold">Finished</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">
            {stats?.booksCompleted ?? 4} <span className="text-xs text-stone-500">Titles</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Curated Library</div>
        </div>

        <div className="rounded-2xl border border-stone-800/80 bg-[#080d0a] p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
            <Trophy className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider font-semibold">Highlights</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">
            {stats?.highlightsCount ?? 18} <span className="text-xs text-stone-500">Passages</span>
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Saved in Vault</div>
        </div>
      </div>

      {/* Target Progress Bars */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-white">Active Reading Targets</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Daily Goal */}
          <div className="rounded-2xl border border-emerald-950/80 bg-[#080d0a] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-emerald-400">Daily Target</span>
              <span className="text-xs text-stone-400 font-mono">
                {dailyGoal.current} / {dailyGoal.target} min
              </span>
            </div>
            <div className="mt-4 h-2.5 w-full rounded-full bg-stone-900 overflow-hidden border border-stone-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, (dailyGoal.target > 0 ? (dailyGoal.current / dailyGoal.target) : 0) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              {dailyGoal.current >= dailyGoal.target
                ? 'Target achieved today! Outstanding discipline.'
                : `${Math.max(0, dailyGoal.target - dailyGoal.current)} more minutes to hit today's quota.`}
            </p>
          </div>

          {/* Monthly Goal */}
          <div className="rounded-2xl border border-emerald-950/80 bg-[#080d0a] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-amber-400">Monthly Target</span>
              <span className="text-xs text-stone-400 font-mono">
                {monthlyGoal.current} / {monthlyGoal.target} books
              </span>
            </div>
            <div className="mt-4 h-2.5 w-full rounded-full bg-stone-900 overflow-hidden border border-stone-800">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${Math.min(100, (monthlyGoal.target > 0 ? (monthlyGoal.current / monthlyGoal.target) : 0) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              {monthlyGoal.target > 0 ? Math.round((monthlyGoal.current / monthlyGoal.target) * 100) : 0}% of your monthly goal accomplished.
            </p>
          </div>

          {/* Yearly Goal */}
          <div className="rounded-2xl border border-emerald-950/80 bg-[#080d0a] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-purple-400">2026 Challenge</span>
              <span className="text-xs text-stone-400 font-mono">
                {yearlyGoal.current} / {yearlyGoal.target} books
              </span>
            </div>
            <div className="mt-4 h-2.5 w-full rounded-full bg-stone-900 overflow-hidden border border-stone-800">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${Math.min(100, (yearlyGoal.target > 0 ? (yearlyGoal.current / yearlyGoal.target) : 0) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              On track to finish {yearlyGoal.target} profound masterworks this year.
            </p>
          </div>
        </div>
      </div>

      {/* 28-Day Consistency Heatmap */}
      <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h2 className="font-serif text-base font-bold text-white">
              28-Day Reading Consistency Matrix
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <span>Less</span>
            <div className="h-2.5 w-2.5 rounded-sm bg-stone-900 border border-stone-800" />
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-950" />
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-700" />
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            <span>More</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 sm:grid-cols-14 gap-2">
          {daysInGrid.map((d, i) => {
            const bgClass =
              d.intensity === 3
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/30'
                : d.intensity === 2
                ? 'bg-emerald-700'
                : d.intensity === 1
                ? 'bg-emerald-950 border border-emerald-900/60'
                : 'bg-stone-900/50 border border-stone-800';

            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all hover:scale-105 ${bgClass}`}
                title={`${d.date}: ${d.intensity > 0 ? d.intensity * 20 : 0} minutes`}
              >
                <span className={`text-[10px] font-mono ${d.intensity === 3 ? 'text-black font-bold' : 'text-stone-400'}`}>
                  {d.date.slice(-2)}
                </span>
                <span className={`text-[9px] ${d.intensity === 3 ? 'text-black/80' : 'text-stone-500'}`}>
                  {d.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Reading Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-900/60 bg-[#070c09] p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white mb-2">
              Log Offline Reading Session
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Did you read a physical book or listen to an audio chapter? Add your minutes to keep your streak blazing.
            </p>

            <form onSubmit={handleLogReading} className="space-y-4">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Minutes Read</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLogMinutes(m)}
                      className={`rounded-xl border py-2 text-xs font-semibold transition-all ${
                        logMinutes === m
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                          : 'border-stone-800 bg-stone-900/40 text-stone-400 hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="rounded-xl border border-stone-800 px-4 py-2 text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
                >
                  Confirm & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
