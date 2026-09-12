import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Check,
  Square,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

import { BackButton } from '../common/BackButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MindRiseCoachProps {
  onBack?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const MindRiseCoach: React.FC<MindRiseCoachProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { coachPromptInitial, openCoachWithPrompt } = useData();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Greetings, ${user?.name?.split(' ')[0] || 'Scholar'}. I am your **MindRise AI Mentor** (powered by **Groq API**).\n\nWhether you need deep analysis of any book or philosophical passage, a personalized habit blueprint, or advice across our 8.5M+ library—I am at your service. What topic or question would you like to explore?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
  }, [messages, loading, isStreaming]);

  const quickStarters = [
    'Give me today’s personal growth plan',
    'Recommend 3 books on discipline & focus',
    'How do I overcome procrastination today?',
    'Create a 30-day Stoic protocol',
    'Explain how small habits compound mathematically',
  ];

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
  };

  const sendMessage = async (textToSend?: string, isRegenerate = false) => {
    const query = (textToSend || input).trim();
    if (!query && !isRegenerate) return;
    if (loading || isStreaming) return;

    setErrorMessage(null);

    let currentMessages = [...messages];
    if (isRegenerate) {
      const lastUserIndex = [...currentMessages].reverse().findIndex((m) => m.role === 'user');
      if (lastUserIndex === -1) return;
      const actualIndex = currentMessages.length - 1 - lastUserIndex;
      currentMessages = currentMessages.slice(0, actualIndex + 1);
    } else {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      currentMessages.push(userMsg);
      setMessages(currentMessages);
      if (!textToSend) setInput('');
    }

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...currentMessages, assistantMsg]);
    setLoading(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const apiMessages = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: apiMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error('AI is temporarily unavailable. Please try again.');
      }

      const contentType = res.headers.get('content-type') || '';
      let accumulatedText = '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                accumulatedText += parsed.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
                  )
                );
              }
            } catch {
              // ignore partial chunk json errors
            }
          }
        }
      } else {
        const data = await res.json();
        accumulatedText = data.reply || data.content || 'AI is temporarily unavailable. Please try again.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }

      if (!accumulatedText.trim()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: 'AI is temporarily unavailable. Please try again.' }
              : msg
          )
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      const friendlyError = 'AI is temporarily unavailable. Please try again.';
      setErrorMessage(friendlyError);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: friendlyError } : msg
        )
      );
    } finally {
      setLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    stopGeneration();
    setErrorMessage(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Sanctuary refreshed. What wisdom, book inquiry, or execution challenge shall we tackle next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-3xl border border-[#1E2638] bg-[#0E1320] overflow-hidden shadow-2xl font-sans">
      {/* Coach Header */}
      <div className="flex items-center justify-between border-b border-[#1E2638] bg-[#141A29] px-6 py-4">
        <div className="flex items-center gap-3">
          {onBack && <BackButton onClick={onBack} className="mr-1" />}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 border border-emerald-400/30 text-slate-950 shadow-md shrink-0">
            <Sparkles className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <span>MindRise AI Mentor</span>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-800/40">
                Groq API
              </span>
            </h2>
            <p className="text-[11px] text-[#94A3B8]">
              High-speed reasoning, deep literary analysis & habit coaching
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-xl border border-[#2A354E] bg-[#1A2234] px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white transition-colors"
          title="Clear conversation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Session</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`relative max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed sm:max-w-xl ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white font-normal shadow-md'
                  : 'border border-[#242E42] bg-[#161D2C] text-[#E2E8F0] shadow-sm'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-invert max-w-none text-xs sm:text-[13px] leading-relaxed space-y-2 [&>p]:mb-2.5 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:text-base [&>h1]:font-bold [&>h2]:text-sm [&>h2]:font-bold [&>h3]:text-xs [&>h3]:font-semibold [&>blockquote]:border-l-2 [&>blockquote]:border-emerald-500 [&>blockquote]:pl-3 [&>blockquote]:italic [&_strong]:text-emerald-300">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {m.content || (loading && idx === messages.length - 1 ? 'Generating response...' : '')}
                  </Markdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                  {m.content}
                </div>
              )}

              <div
                className={`mt-2 flex items-center justify-between text-[10px] ${
                  m.role === 'user' ? 'text-white/70' : 'text-[#64748B]'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.role === 'assistant' && m.content && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="p-1 hover:text-emerald-400 transition-colors flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    {idx === messages.length - 1 && !loading && (
                      <button
                        onClick={() => sendMessage(undefined, true)}
                        className="p-1 hover:text-emerald-400 transition-colors flex items-center gap-1"
                        title="Regenerate response"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#20293D] text-white border border-[#2D3A54]">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && !isStreaming && (
          <div className="flex gap-3 justify-start items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 animate-pulse">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="rounded-2xl border border-[#242E42] bg-[#161D2C] px-4 py-3 text-xs text-[#94A3B8] flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Synthesizing response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Stop Generation Bar */}
      {(loading || isStreaming) && (
        <div className="flex justify-center py-1 bg-[#101524]">
          <button
            onClick={stopGeneration}
            className="flex items-center gap-1.5 rounded-full bg-[#1C2436] border border-[#313E58] text-[#CBD5E1] px-3 py-1 text-xs hover:bg-[#253046] transition-all shadow-sm"
          >
            <Square className="h-3 w-3 fill-current text-rose-400" />
            <span>Stop Generation</span>
          </button>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="border-t border-[#1E2638] bg-[#101524] px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {quickStarters.map((starter) => (
            <button
              key={starter}
              onClick={() => sendMessage(starter)}
              disabled={loading}
              className="whitespace-nowrap rounded-full border border-[#273248] bg-[#182030] px-3 py-1 text-[11px] text-[#94A3B8] hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-40 transition-all"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-[#1E2638] bg-[#141A29] p-4">
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
            className="flex-1 rounded-2xl border border-[#273248] bg-[#0E1320] px-4 py-3 text-xs text-white placeholder-[#64748B] outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg transition-all hover:bg-emerald-400 disabled:opacity-40 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
