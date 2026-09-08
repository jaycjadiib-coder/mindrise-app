import React, { useState } from 'react';
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  BookOpen,
  Volume2,
  BarChart3,
  Shield,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';

export const PremiumView: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    await updateUserProfile({ premium: true });
    setUpgrading(false);
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
  };

  const handleDowngrade = async () => {
    await updateUserProfile({ premium: false });
  };

  const perks = [
    { title: 'Unlimited Digital Library', desc: 'Full access to every public domain classic, commentary, and protocol.' },
    { title: 'MindRise Query Bot', desc: 'Unlimited scholar conversations, passage explanations, and custom daily plans.' },
    { title: 'AI Reflection Analysis', desc: 'Deep psychological synthesis and theme extraction from your daily journal.' },
    { title: 'Full Data Export', desc: 'Export your highlighted knowledge vault and journal entries to Markdown anytime.' },
    { title: 'Exclusive MindRise Originals', desc: 'Curated tactical playbooks on digital detox, sleep architecture, and leverage.' },
    { title: 'Immersion Audio Synthesis', desc: 'High-definition narration and focus soundscapes for deep reading.' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/20 px-3.5 py-1.5 text-xs text-amber-300">
          <Crown className="h-4 w-4 text-amber-400" />
          <span>MindRise Black Membership</span>
        </div>
        <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Ascend to Unrestricted Mastery
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-stone-400 leading-relaxed">
          Remove all intellectual friction. Access unlimited mentor dialogues, complete book vaults, and advanced cognitive systems.
        </p>

        {/* Annual / Monthly Toggle */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-stone-800 bg-[#080d0a] p-1.5">
          <button
            onClick={() => setBillingCycle('annual')}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              billingCycle === 'annual'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Annual (Save 33%)
          </button>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {/* Free Plan */}
        <div className="rounded-3xl border border-stone-800 bg-[#080d0a] p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-stone-400">Initiate</span>
            <div className="mt-3 font-serif text-3xl font-bold text-white">$0</div>
            <p className="mt-1 text-xs text-stone-500">Free forever</p>
            <p className="mt-4 text-xs text-stone-400">Essential reading and habit tracking for independent scholars.</p>
            <ul className="mt-6 space-y-2.5 text-xs text-stone-300">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Access to core public domain titles</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>5 Keystone daily habits</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Standard distraction-free reader</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 border-t border-stone-800 pt-4">
            <button
              disabled
              className="w-full rounded-xl border border-stone-800 bg-stone-900/50 py-2.5 text-xs text-stone-400"
            >
              Current Baseline
            </button>
          </div>
        </div>

        {/* Premium Plan (Featured) */}
        <div className="relative rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-[#0e1810] to-[#070d09] p-6 flex flex-col justify-between shadow-2xl shadow-amber-950/30 md:-translate-y-2">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
            Most Popular
          </span>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-amber-300">MindRise Black</span>
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-3 font-serif text-4xl font-bold text-white">
              {billingCycle === 'annual' ? '$8' : '$12'}
              <span className="text-sm font-sans font-normal text-stone-400">/ month</span>
            </div>
            <p className="mt-1 text-xs text-stone-400">
              {billingCycle === 'annual' ? 'Billed annually ($96/year)' : 'Billed monthly'}
            </p>

            <ul className="mt-6 space-y-3 text-xs text-stone-200">
              {perks.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white">{p.title}</strong>
                    <span className="text-[11px] text-stone-400">{p.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-emerald-950/60 pt-4">
            {user?.premium ? (
              <button
                onClick={handleDowngrade}
                className="w-full rounded-xl border border-stone-800 py-3 text-xs font-semibold text-stone-400 hover:text-rose-400"
              >
                Cancel Black Membership
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-xs font-bold text-black shadow-lg shadow-amber-950/60 hover:scale-105 transition-all"
              >
                {upgrading ? 'Upgrading...' : 'Ascend to MindRise Black'}
              </button>
            )}
          </div>
        </div>

        {/* Lifetime Patron */}
        <div className="rounded-3xl border border-stone-800 bg-[#080d0a] p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-purple-400">Lifetime Patron</span>
            <div className="mt-3 font-serif text-3xl font-bold text-white">$249</div>
            <p className="mt-1 text-xs text-stone-500">One-time investment</p>
            <p className="mt-4 text-xs text-stone-400">Perpetual lifetime access to all future MindRise upgrades, protocols, and AI releases.</p>
            <ul className="mt-6 space-y-2.5 text-xs text-stone-300">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-400" />
                <span>Everything in MindRise Black</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-400" />
                <span>Lifetime VIP Patron Badge</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-400" />
                <span>Direct influence on book acquisitions</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 border-t border-stone-800 pt-4">
            <button
              onClick={handleUpgrade}
              className="w-full rounded-xl border border-purple-800/60 bg-purple-950/30 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/40"
            >
              Claim Lifetime Seat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
