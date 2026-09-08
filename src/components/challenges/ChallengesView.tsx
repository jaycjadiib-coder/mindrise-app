import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';

export const ChallengesView: React.FC = () => {
  const { challenges, userChallenges, joinChallenge, progressChallenge } = useData();
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  const handleJoin = (id: string) => {
    joinChallenge(id);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handleAdvance = (id: string) => {
    progressChallenge(id);
    confetti({ particleCount: 50, spread: 70 });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/40 bg-amber-950/30 px-3 py-1 text-[11px] font-medium text-amber-300">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span>Voluntary Hardship & Mastery Protocols</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
          MindRise Challenges
        </h1>
        <p className="mt-1 text-xs text-stone-400">
          Commit to structured multi-day covenants. Build unbreakable psychological resilience through daily execution.
        </p>
      </div>

      {/* Grid of Challenges */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {challenges.map((ch) => {
          const userCh = userChallenges[ch.id];
          const hasJoined = !!userCh;
          const currentDay = userCh?.currentDay || 0;
          const isComplete = userCh?.completed || false;
          const progressPercent = Math.round((currentDay / ch.durationDays) * 100);

          return (
            <div
              key={ch.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all ${
                hasJoined
                  ? 'border-emerald-700/60 bg-gradient-to-br from-[#09150f] to-[#060b08] shadow-xl'
                  : 'border-stone-800/80 bg-[#080d0a] hover:border-stone-700'
              }`}
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-stone-800 uppercase tracking-wider">
                    {ch.durationDays} Days Duration
                  </span>
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{ch.participantsCount.toLocaleString()} Scholars</span>
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-xl font-bold text-white">{ch.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-400">{ch.description}</p>

                {/* Daily Non-Negotiable Checklist */}
                <div className="mt-5 rounded-2xl border border-stone-800/80 bg-stone-900/30 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
                    Daily Non-Negotiable Rules:
                  </span>
                  <ul className="space-y-1.5 text-xs text-stone-300">
                    {(ch.rules && ch.rules.length > 0
                      ? ch.rules
                      : (ch.tasks && ch.tasks.length > 0
                          ? ch.tasks.slice(0, 3).map((t) => `${t.title}: ${t.description}`)
                          : [
                              'Read 20+ uninterrupted minutes daily',
                              'Take at least 1 actionable note or highlight',
                              'Record daily reflection in MindRise journal'
                            ]
                        )
                    ).map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Progress Bar if Joined */}
                {hasJoined && (
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-mono text-emerald-300 mb-1.5">
                      <span>
                        Day {currentDay} of {ch.durationDays}
                      </span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stone-900 overflow-hidden border border-stone-800">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6 border-t border-stone-800/80 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-amber-300">
                  <Award className="h-4 w-4" />
                  <span>Unlocks: {ch.rewardBadge}</span>
                </div>

                {!hasJoined ? (
                  <button
                    onClick={() => handleJoin(ch.id)}
                    className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-black shadow-lg shadow-emerald-950/60 hover:bg-emerald-400 transition-all"
                  >
                    Accept Challenge
                  </button>
                ) : isComplete ? (
                  <span className="rounded-xl bg-emerald-950/80 px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-800/60">
                    ✓ Challenge Conquered!
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdvance(ch.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition-all"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Complete Day {currentDay + 1}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
