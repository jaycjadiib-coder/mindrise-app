import React from 'react';
import {
  BarChart3,
  Flame,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  PieChart,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const GrowthAnalytics: React.FC = () => {
  const { stats, books, habits, journalEntries } = useData();

  const totalMins = typeof stats?.totalReadingTimeMinutes === 'number' && !isNaN(stats.totalReadingTimeMinutes)
    ? stats.totalReadingTimeMinutes
    : 840;
  const hoursRead = (totalMins / 60).toFixed(1);

  // Weekly breakdown mock distribution (realistic)
  const weeklyData = [
    { day: 'Mon', minutes: 35 },
    { day: 'Tue', minutes: 45 },
    { day: 'Wed', minutes: 20 },
    { day: 'Thu', minutes: 50 },
    { day: 'Fri', minutes: 30 },
    { day: 'Sat', minutes: 65 },
    { day: 'Sun', minutes: 40 },
  ];
  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 1);

  // Category distribution
  const categoryStats = [
    { name: 'Philosophy', percent: 45, color: 'bg-emerald-500' },
    { name: 'Discipline & Habits', percent: 30, color: 'bg-amber-400' },
    { name: 'Productivity & Focus', percent: 15, color: 'bg-blue-400' },
    { name: 'Wealth & Psychology', percent: 10, color: 'bg-purple-400' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-3 py-1 text-[11px] font-medium text-emerald-300">
          <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Intellectual Momentum & Velocity</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Growth Analytics
        </h1>
        <p className="mt-1 text-xs text-stone-400">
          Quantify the compounding effect of your daily reading, reflections, and discipline loops.
        </p>
      </div>

      {/* Big KPI Numbers Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-5">
          <div className="flex items-center gap-2 text-stone-400 text-xs mb-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Lifetime Immersion</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">{hoursRead} <span className="text-sm font-sans text-stone-500">Hours</span></div>
          <p className="mt-1 text-[11px] text-emerald-400">+2.4h this week</p>
        </div>

        <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-5">
          <div className="flex items-center gap-2 text-stone-400 text-xs mb-2">
            <Flame className="h-4 w-4 text-amber-400 fill-amber-500" />
            <span>Active Streak</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">{stats?.currentStreak ?? 12} <span className="text-sm font-sans text-stone-500">Days</span></div>
          <p className="mt-1 text-[11px] text-stone-400">Longest: {stats?.longestStreak ?? 18} days</p>
        </div>

        <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-5">
          <div className="flex items-center gap-2 text-stone-400 text-xs mb-2">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span>Masterworks Finished</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">{stats?.booksCompleted ?? 4} <span className="text-sm font-sans text-stone-500">Books</span></div>
          <p className="mt-1 text-[11px] text-stone-400">~240 pages/book avg</p>
        </div>

        <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-5">
          <div className="flex items-center gap-2 text-stone-400 text-xs mb-2">
            <Award className="h-4 w-4 text-purple-400" />
            <span>Reflections Logged</span>
          </div>
          <div className="font-serif text-3xl font-bold text-white">{journalEntries.length} <span className="text-sm font-sans text-stone-500">Entries</span></div>
          <p className="mt-1 text-[11px] text-purple-300">{stats?.highlightsCount ?? 18} highlights</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Weekly Minutes Bar Chart (7 cols) */}
        <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div>
              <h3 className="font-serif text-base font-bold text-white">This Week's Reading Time</h3>
              <p className="text-xs text-stone-400">Daily minutes recorded across sessions</p>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-400">285 total mins</span>
          </div>

          <div className="mt-8 flex h-48 items-end justify-between gap-3 px-2">
            {weeklyData.map((w) => {
              const heightPercent = Math.round((w.minutes / maxMinutes) * 100);
              return (
                <div key={w.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-stone-400">{w.minutes}m</span>
                  <div className="h-32 w-full max-w-[36px] rounded-t-xl bg-stone-900 overflow-hidden flex items-end">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-stone-300">{w.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Knowledge Distribution (5 cols) */}
        <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-white">Intellectual Distribution</h3>
            <p className="text-xs text-stone-400">Breakdown of content consumed by domain</p>
          </div>

          <div className="mt-6 space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-300 font-medium">{cat.name}</span>
                  <span className="font-mono text-stone-400">{cat.percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-900 overflow-hidden border border-stone-800">
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-950/60 bg-emerald-950/20 p-3.5 text-xs text-stone-300">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Growth Insight</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Your philosophical foundation is rock-solid. To achieve complete balance, consider increasing reading in Wealth & Strategic leverage by 15%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
