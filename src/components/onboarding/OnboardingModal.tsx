import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  Target,
  Brain
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);

  const interestOptions = [
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

  const timeOptions = [
    { label: '10 min', value: 10, desc: 'A swift daily spark' },
    { label: '20 min', value: 20, desc: 'Recommended baseline (1 book/month)' },
    { label: '30 min', value: 30, desc: 'Deep contemplation pace' },
    { label: '60 min', value: 60, desc: 'Serious intellectual immersion' },
    { label: '90+ min', value: 90, desc: 'Scholarly discipline summit' },
  ];

  const goalOptions = [
    'Read more consistently without friction',
    'Become ruthlessly disciplined in daily execution',
    'Improve attention span and deep focus',
    'Build keystone habits and eliminate bad loops',
    'Reduce mindless smartphone screen time',
    'Become more confident and master communication',
    'Learn high-leverage frameworks and philosophy',
  ];

  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Discipline', 'Mindset', 'Productivity']);
  const [selectedTime, setSelectedTime] = useState<number>(20);
  const [selectedGoal, setSelectedGoal] = useState<string>(goalOptions[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    await completeOnboarding({
      interests: selectedInterests,
      dailyGoal: selectedTime,
      mainGoal: selectedGoal,
    });
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-900/60 bg-[#070d09] p-6 shadow-2xl sm:p-8 cursor-default"
      >
        {/* Skip / Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-900 hover:text-white transition-colors"
          title="Skip onboarding"
        >
          <span className="text-xs font-mono">✕ Skip</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-black">
              {step}
            </span>
            <span className="text-xs font-medium text-stone-400">Step {step} of 3</span>
          </div>
          <div className="flex gap-1.5">
            <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-stone-800'}`} />
            <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-stone-800'}`} />
            <div className={`h-1.5 w-8 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-stone-800'}`} />
          </div>
        </div>

        {/* Step 1: Interests */}
        {step === 1 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <Brain className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Growth Vectors</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">
              What do you want to improve?
            </h2>
            <p className="mt-1 text-xs text-stone-400">
              Select all pillars that matter to you. We calibrate your recommendations around these.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 max-h-60 overflow-y-auto pr-1">
              {interestOptions.map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border border-emerald-500/80 bg-emerald-950/60 text-emerald-200 shadow-sm shadow-emerald-950/50'
                        : 'border border-stone-800 bg-stone-900/30 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Reading Time */}
        {step === 2 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <Clock className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Cadence</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">
              How much time can you read each day?
            </h2>
            <p className="mt-1 text-xs text-stone-400">
              Consistency compounds exponentially. Start manageable and expand.
            </p>

            <div className="mt-6 space-y-2.5">
              {timeOptions.map((t) => {
                const isSelected = selectedTime === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedTime(t.value)}
                    className={`flex w-full items-center justify-between rounded-2xl p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border border-emerald-500/80 bg-emerald-950/50 text-white'
                        : 'border border-stone-800/80 bg-stone-900/30 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-stone-600'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-black" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-200">{t.label}</div>
                        <div className="text-[11px] text-stone-400">{t.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Main Goal */}
        {step === 3 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <Target className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">North Star</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">
              What is your primary breakthrough goal?
            </h2>
            <p className="mt-1 text-xs text-stone-400">
              MindRise Coach uses this to formulate your personalized daily focus plan.
            </p>

            <div className="mt-6 space-y-2 max-h-64 overflow-y-auto pr-1">
              {goalOptions.map((g) => {
                const isSelected = selectedGoal === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGoal(g)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      isSelected
                        ? 'border border-emerald-500/80 bg-emerald-950/50 text-emerald-200'
                        : 'border border-stone-800/80 bg-stone-900/30 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-stone-600'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-black" />}
                    </div>
                    <span className="text-xs font-medium">{g}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-stone-800/80 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/50 px-4 py-2 text-xs font-medium text-stone-300 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-black hover:bg-emerald-400"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-2.5 text-xs font-semibold text-black shadow-lg shadow-emerald-950/60 hover:scale-105 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{submitting ? 'Calibrating...' : 'Enter Sanctuary'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
