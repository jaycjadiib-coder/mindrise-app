import React, { useState } from 'react';
import {
  Repeat,
  Check,
  Plus,
  Flame,
  Calendar,
  Sparkles,
  Trash2,
  CheckCircle2,
  Circle,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';

export const HabitTracker: React.FC = () => {
  const { habits, habitLogs, toggleHabit, addHabit, deleteHabit } = useData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Discipline');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');

  // Compute the past 7 days (today is the last)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dayNumber: d.getDate(),
      isToday: i === 6,
    };
  });

  const todayStr = days[6].dateStr;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({
      name: name.trim(),
      category,
      frequency,
      color: 'emerald',
    });

    confetti({ particleCount: 40, spread: 60 });
    setName('');
    setShowAddModal(false);
  };

  const completedTodayCount = habits.filter((h) => habitLogs[`${h.id}_${todayStr}`]).length;
  const progressPercent = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-emerald-950/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Habits & Daily Systems
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            “You do not rise to the level of your goals. You fall to the level of your systems.”
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-emerald-950/50 hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          <span>New Keystone Habit</span>
        </button>
      </div>

      {/* Progress Card */}
      <div className="rounded-3xl border border-emerald-950/80 bg-gradient-to-br from-[#0a140f] to-[#060b08] p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Today's Execution Velocity
            </span>
            <div className="mt-2 font-serif text-3xl font-bold text-white">
              {completedTodayCount} of {habits.length} Habits Locked
            </div>
            <p className="mt-1 text-xs text-stone-400">
              {progressPercent === 100
                ? 'All non-negotiable rituals completed today! Impeccable execution.'
                : `${habits.length - completedTodayCount} rituals remaining today.`}
            </p>
          </div>

          <div className="w-full sm:w-64">
            <div className="flex justify-between text-xs font-mono text-emerald-300 mb-1.5">
              <span>Completion</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-stone-900 border border-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Habits 7-Day Matrix Table */}
      <div className="overflow-hidden rounded-3xl border border-stone-800/80 bg-[#080d0a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800/80 bg-stone-900/30 text-stone-400">
                <th className="p-4 pl-6 font-medium">HABIT & RITUAL</th>
                <th className="p-4 font-medium">CATEGORY</th>
                <th className="p-4 text-center font-medium">STREAK</th>
                {days.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`p-4 text-center font-medium ${
                      d.isToday ? 'text-emerald-400 font-bold' : 'text-stone-500'
                    }`}
                  >
                    <div>{d.dayName}</div>
                    <div className="text-[10px] font-mono">{d.dayNumber}</div>
                  </th>
                ))}
                <th className="p-4 pr-6 text-right font-medium">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {(habits || []).map((habit) => (
                <tr
                  key={habit.id}
                  className="transition-colors hover:bg-stone-900/20"
                >
                  <td className="p-4 pl-6">
                    <div className="font-serif text-sm font-semibold text-stone-100">
                      {habit.name}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-emerald-950/60 px-2.5 py-1 text-[10px] font-medium text-emerald-300 border border-emerald-800/40">
                      {habit.category}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-400">
                      <Flame className="h-3.5 w-3.5 fill-amber-500" />
                      {habit.currentStreak}d
                    </span>
                  </td>

                  {days.map((d) => {
                    const logKey = `${habit.id}_${d.dateStr}`;
                    const isChecked = !!habitLogs[logKey];

                    return (
                      <td key={d.dateStr} className="p-4 text-center">
                        <button
                          onClick={() => toggleHabit(habit.id, d.dateStr)}
                          className={`flex h-8 w-8 mx-auto items-center justify-center rounded-xl border transition-all ${
                            isChecked
                              ? 'border-emerald-500 bg-emerald-500 text-black shadow-md shadow-emerald-950/40 scale-105'
                              : 'border-stone-800 bg-stone-900/40 text-transparent hover:border-stone-600'
                          }`}
                        >
                          <Check className={`h-4 w-4 stroke-[3] ${isChecked ? 'text-black' : 'opacity-0'}`} />
                        </button>
                      </td>
                    );
                  })}

                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                      title="Delete habit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-emerald-900/60 bg-[#070c09] p-6 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg font-bold text-white">
                Add Keystone Habit
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-400 mb-4">
              Select a micro-action that builds identity and aligns with your reading.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Habit Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 20m Deep Reading, Morning Silence, Cold Walk"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-white outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                  >
                    <option value="Discipline">Discipline</option>
                    <option value="Mindset">Mindset</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Health">Health</option>
                    <option value="Reading">Reading</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-stone-800 px-4 py-2 text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400"
                >
                  Establish Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
