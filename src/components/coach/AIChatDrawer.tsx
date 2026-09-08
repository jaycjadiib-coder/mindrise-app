import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  User,
  Bot,
  RotateCcw,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Check,
  Copy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { stats, books } = useData();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Namaste & Welcome, ${user?.name?.split(' ')[0] || 'Reader'}! 📚\n\nI am your **MindRise Free Query Bot & Scholar Assistant**. I am completely free and unlimited — no subscriptions, accounts, or paid API keys needed.\n\nYou can query any book, get summaries, ask for study/habit routines, search authors, or get explanations in English, Hindi, or Hinglish.\n\nWhat would you like to query or explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const quickStarters = [
    'How do I build a habit of reading 20 mins daily?',
    'Mujhe trading psychology ke liye best book batao',
    'Explain the compound effect of small habits',
    'Suggest 3 books to master focus and overcome phone addiction'
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
            interests: user?.interests || ['Discipline', 'Mindset', 'Habits'],
            booksRead: stats?.booksCompleted || 2,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Focus on your highest priority action today.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: 'Daily discipline compounds into character. Start with 15 minutes of uninterrupted reading today and note 1 takeaway.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer animate-in fade-in duration-150 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-md flex-col bg-[#1A1A1A] text-[#F9F7F2] shadow-2xl border-l border-[#333] cursor-default animate-in slide-in-from-right duration-200 font-sans"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#2A2A2A] bg-[#202020] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 text-black shadow-md font-bold">
              <Bot className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-base font-medium text-white">MindRise Query Bot</h3>
                <span className="rounded-full bg-emerald-950 border border-emerald-500/40 px-2 py-0.2 text-[9px] text-emerald-400 font-mono">
                  100% Free
                </span>
              </div>
              <p className="text-[11px] text-[#888]">Instant book queries, habits & literary answers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-full p-2 text-[#888] hover:bg-[#333] hover:text-white transition-colors"
            title="Close Assistant (ESC or tap outside)"
            aria-label="Close Assistant"
          >
            <span className="text-xs px-2 py-0.5 rounded border border-[#444] bg-[#222]">ESC</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {(messages || []).map((m, idx) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`group relative max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-black font-medium rounded-tr-xs'
                    : 'bg-[#242424] text-[#E0E0E0] border border-[#333] rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px] opacity-70">
                  <span>{m.timestamp}</span>
                  {m.sender === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(m.text, idx)}
                      className="hover:opacity-100 flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-700 text-white text-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-xs text-[#888]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-[#242424] px-4 py-2.5 border border-[#333]">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-100" />
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-200" />
                <span className="ml-2 text-[11px] text-[#AAA]">Query Bot is processing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2 border-t border-[#262626] pt-2 space-y-1.5">
            <p className="text-[10px] uppercase font-mono text-[#777] tracking-wider">Suggested Queries</p>
            <div className="flex flex-col gap-1.5">
              {quickStarters.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-xl border border-[#333] bg-[#222] px-3 py-1.5 text-left text-[11px] text-[#BBB] hover:border-emerald-500/50 hover:bg-[#282828] hover:text-white transition-all truncate"
                >
                  🔍 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-[#2A2A2A] bg-[#202020] p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query any book, author or ask advice (English / Hindi)..."
              className="flex-1 rounded-xl border border-[#3A3A3A] bg-[#161616] px-3.5 py-2.5 text-xs text-white placeholder-[#777] outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 transition-colors shadow-sm"
              title="Send query"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#777] px-1">
            <span>Tap outside or press ESC to close</span>
            <span className="text-emerald-400 font-medium">100% Free Scholar Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
