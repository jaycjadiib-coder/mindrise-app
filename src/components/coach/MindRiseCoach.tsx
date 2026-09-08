import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  RotateCcw,
  BookOpen,
  Target,
  Zap,
  Shield,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const MindRiseCoach: React.FC = () => {
  const { user } = useAuth();
  const { coachPromptInitial, openCoachWithPrompt, books, stats } = useData();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Greetings, ${user?.name?.split(' ')[0] || 'Scholar'}. I am your **MindRise Free Query Bot & Scholar Assistant**.\n\nWhether you need a breakdown of any book or passage, a 30-day discipline protocol, or recommendations from our 8.5M+ library—I am completely free and ready to help. What book, topic, or challenge would you like to query?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle incoming initial prompt from context (e.g. from reader selection or dashboard)
  useEffect(() => {
    if (coachPromptInitial && coachPromptInitial.trim() !== '') {
      const promptToRun = coachPromptInitial;
      openCoachWithPrompt(''); // clear immediately
      sendMessage(promptToRun);
    }
  }, [coachPromptInitial]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickStarters = [
    'Give me today’s personal growth plan',
    'Recommend 3 books based on my focus',
    'How do I overcome procrastination today?',
    'Create a 30-day Stoic discipline protocol',
    'Explain how small habits compound mathematically',
  ];

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Send conversation history to Express backend with Free Query Bot engine
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: conversationHistory,
          userContext: {
            name: user?.name || 'Scholar',
            streak: stats?.currentStreak || user?.currentStreak || 1,
            interests: user?.interests || ['Discipline', 'Mindset'],
            booksRead: stats?.booksCompleted || 2,
          },
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Wisdom requires contemplation. Let us examine this further.';

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      const fallbackMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `Here is a foundational principle to address this:\n\n1. **Acknowledge the Friction**: Resistance is not a sign to quit, but the very obstacle showing the way forward.\n2. **Break Down the First Step**: Make the starting threshold under 2 minutes (e.g., read 1 paragraph, do 5 pushups).\n3. **Decouple Emotion from Execution**: Do not wait to "feel motivated". Action generates the emotional momentum, not the reverse.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Sanctuary refreshed. What wisdom or execution challenge shall we tackle next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-3xl border border-emerald-950/80 bg-[#070d09] overflow-hidden shadow-2xl">
      {/* Coach Header */}
      <div className="flex items-center justify-between border-b border-emerald-950/80 bg-[#080f0b] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-900 border border-emerald-400/30 text-emerald-300 shadow-md">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <span>MindRise Query Bot</span>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-800/40">
                100% Free Engine
              </span>
            </h2>
            <p className="text-[11px] text-stone-400">
              Instant book summaries, habit routines & library queries — no API key or subscription needed
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/40 px-3 py-1.5 text-xs text-stone-400 hover:text-white transition-colors"
          title="Clear conversation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Session</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {(messages || []).map((m, idx) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`relative max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed sm:max-w-xl ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-stone-950 font-medium'
                  : 'border border-stone-800/80 bg-[#09110d] text-stone-200'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                {m.text}
              </div>

              <div
                className={`mt-2 flex items-center justify-between text-[10px] ${
                  m.sender === 'user' ? 'text-black/60' : 'text-stone-500'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.sender === 'assistant' && (
                  <button
                    onClick={() => handleCopy(m.text, idx)}
                    className="p-1 hover:text-emerald-400 transition-colors"
                    title="Copy response"
                  >
                    {copiedIndex === idx ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-stone-300">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 animate-pulse">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div className="rounded-2xl border border-stone-800 bg-[#09110d] px-4 py-3 text-xs text-stone-400 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Synthesizing philosophical guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="border-t border-stone-800/60 bg-[#070c09] px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {quickStarters.map((starter) => (
            <button
              key={starter}
              onClick={() => sendMessage(starter)}
              disabled={loading}
              className="whitespace-nowrap rounded-full border border-stone-800 bg-stone-900/50 px-3 py-1 text-[11px] text-stone-400 hover:border-emerald-700 hover:text-emerald-300 disabled:opacity-40 transition-all"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-emerald-950/80 bg-[#080e0b] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your MindRise AI Mentor anything (books, habits, philosophy)..."
            disabled={loading}
            className="flex-1 rounded-2xl border border-stone-800 bg-stone-900/50 px-4 py-3 text-xs text-white placeholder-stone-500 outline-none focus:border-emerald-600 focus:bg-emerald-950/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-black shadow-lg shadow-emerald-950/60 transition-all hover:bg-emerald-400 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
