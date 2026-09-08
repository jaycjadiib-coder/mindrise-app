import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  User,
  Bot,
  RotateCcw,
  Square,
  Copy,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  CornerDownLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your AI assistant inside MindRise. Ask me anything about books, summaries, reading habits, philosophy, or study protocols. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Auto-scroll to bottom on new messages or streaming tokens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isStreaming, isOpen]);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  if (!isOpen) return null;

  const quickStarters = [
    'How do I build a habit of reading 20 mins daily?',
    'Summarize the core principles of Marcus Aurelius’ Meditations',
    'What are the 4 laws of behavior change in Atomic Habits?',
    'Recommend 3 books on focus and overcoming digital distraction'
  ];

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setLoading(false);
  };

  const clearChat = () => {
    stopGeneration();
    setErrorMessage(null);
    setMessages([]);
  };

  const newChat = () => {
    stopGeneration();
    setErrorMessage(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Hello ${user?.name ? user.name.split(' ')[0] : 'Scholar'}! Starting a new conversation. What would you like to explore or learn about today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setInput('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (textToSend?: string, isRegenerate = false) => {
    const query = (textToSend || input).trim();
    if (!query && !isRegenerate) return;
    if (loading || isStreaming) return;

    setErrorMessage(null);

    let currentMessages = [...messages];
    if (isRegenerate) {
      // Find last user message
      const lastUserIndex = [...currentMessages].reverse().findIndex((m) => m.role === 'user');
      if (lastUserIndex === -1) return;
      const actualIndex = currentMessages.length - 1 - lastUserIndex;
      currentMessages = currentMessages.slice(0, actualIndex + 1);
    } else {
      const userMsg: ChatMessage = {
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
    const assistantMsg: ChatMessage = {
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
      // Prepare payload adhering strictly to POST /api/chat { messages: [{ role, content }] }
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
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // ignore json parse hiccups for partial tokens
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
      if (err.name === 'AbortError') {
        // User manually stopped generation
        return;
      }
      console.error('Chat error:', err);
      const friendlyError = 'AI is temporarily unavailable. Please try again.';
      setErrorMessage(friendlyError);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: friendlyError }
            : msg
        )
      );
    } finally {
      setLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      id="ai-chat-drawer-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer animate-in fade-in duration-150 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="ai-chat-drawer-container"
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-lg flex-col bg-[#121620] text-[#F9F7F2] shadow-2xl border-l border-[#242D40] cursor-default animate-in slide-in-from-right duration-200 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242D40] bg-[#161C2C] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-md font-bold">
              <Bot className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-medium text-white">MindRise AI Assistant</h3>
                <span className="rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[9px] text-emerald-400 font-mono font-medium">
                  Groq API
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">Powered by Groq High-Speed Inference</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="ai-new-chat-btn"
              onClick={newChat}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[#94A3B8] hover:bg-[#20293D] hover:text-white transition-colors"
              title="Start New Chat"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button
              id="ai-clear-chat-btn"
              onClick={clearChat}
              className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#20293D] hover:text-rose-400 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              id="ai-close-drawer-btn"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#20293D] hover:text-white transition-colors ml-1"
              title="Close (ESC)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div id="ai-chat-messages-scroll" className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
              <div className="h-12 w-12 rounded-2xl bg-[#1C2436] flex items-center justify-center text-emerald-400 mb-3 border border-[#2D3A54]">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-medium text-white">MindRise AI Chat</h4>
              <p className="text-xs text-[#94A3B8] mt-1 max-w-xs">
                Ask questions about your books, notes, habit routines, or deep philosophical insights.
              </p>
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={m.id}
              id={`chat-msg-${m.id}`}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`group relative max-w-[85%] rounded-2xl p-3.5 leading-relaxed transition-all ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white font-normal rounded-tr-xs shadow-md'
                    : 'bg-[#1C2333] text-[#E2E8F0] border border-[#2B374E] rounded-tl-xs shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{m.content || (loading && idx === messages.length - 1 ? 'Thinking...' : '')}</div>
                
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#94A3B8] pt-1 border-t border-white/10">
                  <span>{m.timestamp}</span>
                  {m.role === 'assistant' && m.content && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                        title="Copy message"
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
                          className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2A344A] text-white text-xs border border-[#3A4866]">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && !isStreaming && (
            <div className="flex gap-2.5 items-center text-xs text-[#94A3B8]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-[#1C2333] px-4 py-2.5 border border-[#2B374E]">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-100" />
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce delay-200" />
                <span className="ml-2 text-[11px] text-[#94A3B8]">Generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries when conversation is fresh */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 border-t border-[#1F2738] pt-2.5 space-y-1.5">
            <p className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider">Suggested Inquiries</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickStarters.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-xl border border-[#2A344A] bg-[#161C2C] px-3 py-2 text-left text-[11px] text-[#CBD5E1] hover:border-emerald-500/50 hover:bg-[#1E263A] hover:text-white transition-all truncate"
                >
                  💡 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-[#242D40] bg-[#161C2C] p-3">
          {/* Stop Generation Button when active */}
          {(loading || isStreaming) && (
            <div className="mb-2 flex justify-center">
              <button
                id="ai-stop-generation-btn"
                onClick={stopGeneration}
                className="flex items-center gap-1.5 rounded-full bg-[#20293D] border border-[#3A4866] text-[#CBD5E1] px-3 py-1 text-xs hover:bg-[#2A354E] hover:text-white transition-all shadow-sm"
              >
                <Square className="h-3 w-3 fill-current text-rose-400" />
                <span>Stop Generation</span>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 bg-[#0E1320] border border-[#2A344A] rounded-2xl p-2 focus-within:border-emerald-500 transition-colors">
            <textarea
              id="ai-chat-input-textarea"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
              className="flex-1 max-h-32 resize-none bg-transparent px-2 py-1 text-xs text-white placeholder-[#64748B] outline-none"
            />
            <button
              id="ai-chat-send-btn"
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
              title="Send Message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-[#64748B] px-1">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" /> Enter to send • Shift+Enter for new line
            </span>
            <span className="text-emerald-400 font-mono">Groq Cloud AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
