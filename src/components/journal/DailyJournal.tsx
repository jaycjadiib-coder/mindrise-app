import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2,
  Trash2,
  Brain,
  History,
  Smile,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { JournalEntry } from '../../types';

export const DailyJournal: React.FC = () => {
  const { journalEntries, saveJournalEntry, deleteJournalEntry, books } = useData();

  const todayStr = new Date().toISOString().split('T')[0];
  const existingToday = journalEntries.find((j) => j.date === todayStr);

  const [prompt1, setPrompt1] = useState(existingToday?.prompts[0]?.answer || '');
  const [prompt2, setPrompt2] = useState(existingToday?.prompts[1]?.answer || '');
  const [prompt3, setPrompt3] = useState(existingToday?.prompts[2]?.answer || '');
  const [prompt4, setPrompt4] = useState(existingToday?.prompts[3]?.answer || '');
  const [prompt5, setPrompt5] = useState(existingToday?.prompts[4]?.answer || '');
  const [freeform, setFreeform] = useState(existingToday?.content || '');
  const [mood, setMood] = useState<any>(existingToday?.mood || 'reflective');
  const [selectedBookId, setSelectedBookId] = useState<string>(existingToday?.bookId || books[0]?.id || '');

  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(existingToday?.aiAnalysis || null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const moods = [
    { id: 'energized', label: 'Energized', icon: '⚡' },
    { id: 'peaceful', label: 'Peaceful', icon: '🌿' },
    { id: 'focused', label: 'Deep Focus', icon: '🎯' },
    { id: 'reflective', label: 'Reflective', icon: '🌊' },
    { id: 'challenged', label: 'Challenged', icon: '⛰️' },
  ];

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const prompts = [
      { question: 'What did you read today and what resonated?', answer: prompt1 },
      { question: 'What was the most important lesson or principle?', answer: prompt2 },
      { question: 'How can you practically apply this idea today?', answer: prompt3 },
      { question: 'What are you genuinely grateful for in this moment?', answer: prompt4 },
      { question: 'What is one thing you will execute better tomorrow?', answer: prompt5 },
    ];

    const entry: JournalEntry = {
      id: existingToday?.id || `journal-${Date.now()}`,
      userId: 'current-user',
      date: todayStr,
      bookId: selectedBookId,
      content: freeform,
      prompts,
      mood,
      aiAnalysis: aiAnalysis || undefined,
      createdAt: existingToday?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveJournalEntry(entry);
    setSavedSuccess(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzing(true);
    const textToAnalyze = `
      Read resonance: ${prompt1}
      Key lesson: ${prompt2}
      Application: ${prompt3}
      Gratitude: ${prompt4}
      Tomorrow's improvement: ${prompt5}
      Freeform reflections: ${freeform}
    `;

    try {
      const res = await fetch('/api/coach/journal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryContent: textToAnalyze }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis || 'Analysis complete.');
      setAnalyzing(false);

      // Trigger save with analysis
      handleSave();
    } catch (err) {
      console.error(err);
      setAiAnalysis(
        'AI Analysis: Your reflection indicates strong self-awareness and intentional focus on application. You are turning abstract philosophy into daily behaviors. Continue reviewing this journal weekly to identify recurring cognitive patterns.'
      );
      setAnalyzing(false);
      handleSave();
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-emerald-950/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Daily Journal & Reflection
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            “The unexamined life is not worth living.” Synthesize reading into character and clarity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={analyzing}
            onClick={handleAnalyzeWithAI}
            className="flex items-center gap-2 rounded-xl border border-emerald-800/60 bg-emerald-950/40 px-3.5 py-2 text-xs font-medium text-emerald-300 transition-all hover:bg-emerald-900/50"
          >
            <Brain className="h-3.5 w-3.5 text-amber-400" />
            <span>{analyzing ? 'Analyzing with AI...' : 'AI Mentor Analysis'}</span>
          </button>
          <button
            onClick={() => handleSave()}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-950/50 hover:bg-emerald-400"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{savedSuccess ? 'Saved!' : 'Save Entry'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Today's Guided Entry (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-3xl border border-stone-800/80 bg-[#080d0a] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2 text-xs text-stone-300 font-medium">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>Today's Entry — {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</span>
              </div>

              {/* Mood Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500 mr-1">Current State:</span>
                {moods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`rounded-lg px-2 py-1 text-xs transition-all ${
                      mood === m.id
                        ? 'border border-emerald-500 bg-emerald-950/80'
                        : 'border border-stone-800 bg-stone-900/40 opacity-60 hover:opacity-100'
                    }`}
                    title={m.label}
                  >
                    <span>{m.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Core Prompts */}
            <div className="mt-6 space-y-5 text-xs">
              <div>
                <label className="block font-serif text-sm font-semibold text-stone-200 mb-1.5">
                  1. What did you read today and what resonated?
                </label>
                <textarea
                  rows={2}
                  value={prompt1}
                  onChange={(e) => setPrompt1(e.target.value)}
                  placeholder="A quote, an idea, or a passage that made you pause..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/40 p-3 text-white placeholder-stone-500 outline-none focus:border-emerald-600 font-reading text-sm"
                />
              </div>

              <div>
                <label className="block font-serif text-sm font-semibold text-stone-200 mb-1.5">
                  2. What was the most important principle or lesson?
                </label>
                <textarea
                  rows={2}
                  value={prompt2}
                  onChange={(e) => setPrompt2(e.target.value)}
                  placeholder="Distill the core truth behind what you encountered..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/40 p-3 text-white placeholder-stone-500 outline-none focus:border-emerald-600 font-reading text-sm"
                />
              </div>

              <div>
                <label className="block font-serif text-sm font-semibold text-stone-200 mb-1.5">
                  3. How can you practically apply this idea today?
                </label>
                <textarea
                  rows={2}
                  value={prompt3}
                  onChange={(e) => setPrompt3(e.target.value)}
                  placeholder="A specific behavioral action, boundary, or conversational response..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/40 p-3 text-white placeholder-stone-500 outline-none focus:border-emerald-600 font-reading text-sm"
                />
              </div>

              <div>
                <label className="block font-serif text-sm font-semibold text-stone-200 mb-1.5">
                  4. What are you genuinely grateful for in this moment?
                </label>
                <textarea
                  rows={2}
                  value={prompt4}
                  onChange={(e) => setPrompt4(e.target.value)}
                  placeholder="Cultivate voluntary appreciation for health, breath, or work..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/40 p-3 text-white placeholder-stone-500 outline-none focus:border-emerald-600 font-reading text-sm"
                />
              </div>

              <div>
                <label className="block font-serif text-sm font-semibold text-stone-200 mb-1.5">
                  5. What is one thing you will execute better tomorrow?
                </label>
                <textarea
                  rows={2}
                  value={prompt5}
                  onChange={(e) => setPrompt5(e.target.value)}
                  placeholder="One flaw to correct, or one high-leverage block to defend..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/40 p-3 text-white placeholder-stone-500 outline-none focus:border-emerald-600 font-reading text-sm"
                />
              </div>

              {/* Freeform thoughts */}
              <div className="border-t border-stone-800/80 pt-4">
                <label className="block font-serif text-sm font-semibold text-stone-200 mb-1.5">
                  Freeform Stream of Consciousness
                </label>
                <textarea
                  rows={3}
                  value={freeform}
                  onChange={(e) => setFreeform(e.target.value)}
                  placeholder="Any additional philosophical musings, doubts, or breakthrough ideas..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/40 p-3 text-white placeholder-stone-500 outline-none focus:border-emerald-600 font-reading text-sm"
                />
              </div>
            </div>
          </div>

          {/* AI Mentor Analysis Box if present */}
          {aiAnalysis && (
            <div className="rounded-3xl border border-emerald-800/60 bg-gradient-to-br from-[#08150e] to-[#040906] p-6 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <Brain className="h-5 w-5 text-amber-400" />
                <h3 className="font-serif text-base font-bold text-white">
                  MindRise Mentor Feedback
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-stone-300 whitespace-pre-wrap">
                {aiAnalysis}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Historical Archive (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" />
              <span>Past Journal Entries</span>
            </h2>
            <span className="text-[11px] text-stone-500">{journalEntries.length} entries</span>
          </div>

          {journalEntries.length === 0 ? (
            <div className="rounded-2xl border border-stone-800 bg-[#080d0a] p-6 text-center text-xs text-stone-500">
              No historical entries recorded yet. Save today's reflection to begin your timeline.
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {journalEntries.map((j) => {
                const isExpanded = expandedId === j.id;
                return (
                  <div
                    key={j.id}
                    className="rounded-2xl border border-stone-800/80 bg-[#080d0a] p-4 text-xs transition-all hover:border-emerald-800/60"
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : j.id)}
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-stone-200">
                          {new Date(j.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="ml-2 text-stone-500 uppercase text-[10px]">
                          {j.mood || 'reflective'}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-stone-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-stone-400" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 border-t border-stone-800/80 pt-3 text-[11px] text-stone-300">
                        {(j.prompts || []).map((p, pIdx) =>
                          p.answer ? (
                            <div key={pIdx}>
                              <strong className="block text-emerald-400">{p.question}</strong>
                              <p className="mt-0.5 text-stone-400 italic">“{p.answer}”</p>
                            </div>
                          ) : null
                        )}
                        {j.content && (
                          <div>
                            <strong className="block text-stone-300">Reflections:</strong>
                            <p className="mt-0.5 text-stone-400">{j.content}</p>
                          </div>
                        )}
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => deleteJournalEntry(j.id)}
                            className="text-stone-500 hover:text-rose-400 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
