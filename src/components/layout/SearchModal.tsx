import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  BookOpen,
  ArrowRight,
  Compass,
  Sparkles,
  Quote,
  Flame,
  Check,
  Library
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getSearchRecommendations } from '../../services/internetArchiveService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectTab }) => {
  const { books, categories, quotes, openBookDetails, setArchiveSearchQuery } = useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or shortcut
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(cleanQuery) ||
      b.author.toLowerCase().includes(cleanQuery) ||
      b.category.toLowerCase().includes(cleanQuery) ||
      b.tags.some((t) => t.toLowerCase().includes(cleanQuery))
  );

  const matchingCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(cleanQuery) ||
      c.description.toLowerCase().includes(cleanQuery)
  );

  const matchingQuotes = quotes.filter(
    (q) =>
      q.text.toLowerCase().includes(cleanQuery) ||
      q.author.toLowerCase().includes(cleanQuery)
  );

  const quickActions = [
    { label: 'MindRise AI Coach', tab: 'coach', icon: Sparkles, hint: 'Ask for guidance or book plan' },
    { label: 'Daily Journal Reflection', tab: 'journal', icon: BookOpen, hint: 'Answer today\'s 5 prompts' },
    { label: 'Habits & Routine Matrix', tab: 'habits', icon: Check, hint: 'Track non-negotiables' },
    { label: 'Explore 8.5M+ Archive Books', tab: 'explore', icon: Compass, hint: 'Search live Internet Archive' }
  ].filter((a) => cleanQuery === '' || a.label.toLowerCase().includes(cleanQuery));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-xs cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E5E2DA] bg-[#F9F7F2] text-[#1A1A1A] shadow-2xl animate-in fade-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[#E5E2DA] bg-white px-4 py-3">
          <Search className="h-4 w-4 text-[#888]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search publications, authors, themes, quotes..."
            className="ml-3 flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder-[#888] outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#888] hover:text-[#1A1A1A]"
              title="Clear text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 flex items-center gap-1.5 rounded-lg border border-[#E5E2DA] bg-[#F9F7F2] px-2 py-1 text-[11px] font-sans text-[#666] hover:bg-[#E5E2DA] hover:text-[#1A1A1A] transition-colors"
            title="Close search (ESC)"
          >
            <span>Close</span>
            <kbd className="text-[10px] font-mono text-[#888]">ESC</kbd>
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-6 font-sans">
          {/* Books match */}
          {matchingBooks.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#888] mb-2">
                Publications ({matchingBooks.length})
              </h3>
              <div className="space-y-1.5">
                {matchingBooks.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      openBookDetails(b.id);
                      onClose();
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E5E2DA] bg-white p-2.5 transition-all hover:border-[#1A1A1A]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="h-12 w-9 rounded-md object-cover border border-[#E5E2DA]"
                      />
                      <div>
                        <h4 className="text-xs font-serif font-medium text-[#1A1A1A]">{b.title}</h4>
                        <p className="text-[11px] text-[#666]">{b.author}</p>
                        <span className="mt-1 inline-block rounded-full bg-[#F9F7F2] px-2 py-0.5 text-[9px] text-[#666] border border-[#E5E2DA]">
                          {b.category}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#888]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#888] mb-2">
                Curated Pathways
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.tab}
                      onClick={() => {
                        onSelectTab(act.tab);
                        onClose();
                      }}
                      className="flex items-center gap-3 rounded-xl border border-[#E5E2DA] bg-white p-2.5 text-left transition-all hover:border-[#1A1A1A]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E2DA] bg-[#F9F7F2] text-[#1A1A1A]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#1A1A1A]">{act.label}</div>
                        <div className="text-[10px] text-[#888]">{act.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          {matchingCategories.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#888] mb-2">
                Themes & Fields
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchingCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectTab('categories');
                      onClose();
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#E5E2DA] bg-white px-3 py-1.5 text-xs text-[#666] transition-all hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                  >
                    <Compass className="h-3.5 w-3.5 text-[#1A1A1A]" />
                    <span>{c.name}</span>
                    <span className="text-[10px] text-[#888]">({c.bookCount})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quotes */}
          {cleanQuery && matchingQuotes.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#888] mb-2">
                Passages
              </h3>
              <div className="space-y-2">
                {matchingQuotes.slice(0, 3).map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-[#E5E2DA] bg-white p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Quote className="h-3.5 w-3.5 text-[#1A1A1A] shrink-0 mt-0.5" />
                      <p className="font-reading text-sm italic text-[#333]">
                        "{q.text}"
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-[#888] pl-6 font-sans">
                      — {q.author} {q.source ? `(${q.source})` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free Archive Books & Topics Discovery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#888]">
                Free Archive Books & Classics
              </h3>
              {cleanQuery && (
                <button
                  onClick={() => {
                    setArchiveSearchQuery(cleanQuery);
                    onSelectTab('explore');
                    onClose();
                  }}
                  className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <span>Explore "{cleanQuery}"</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getSearchRecommendations(query, 6).map((rec, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setArchiveSearchQuery(rec.query);
                    onSelectTab('explore');
                    onClose();
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#E5E2DA] bg-white p-2.5 text-left text-xs text-[#1A1A1A] hover:border-amber-600 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <BookOpen className="h-4 w-4 text-amber-700 shrink-0" />
                    <div className="truncate min-w-0">
                      <div className="font-semibold text-stone-900 truncate">{rec.title}</div>
                      <div className="text-[10px] text-stone-500 truncate">लेखक: {rec.author}</div>
                    </div>
                  </div>
                  <span className="shrink-0 ml-2 text-[10px] text-amber-900 bg-amber-500/15 rounded-md px-1.5 py-0.5 border border-amber-500/30 font-medium">
                    Book
                  </span>
                </button>
              ))}
            </div>
          </div>

          {matchingBooks.length === 0 &&
            matchingCategories.length === 0 &&
            matchingQuotes.length === 0 &&
            quickActions.length === 0 &&
            !cleanQuery && (
              <div className="py-12 text-center font-sans">
                <BookOpen className="mx-auto h-8 w-8 text-[#AAA]" />
                <p className="mt-2 text-xs text-[#666]">
                  No matches found for "{query}".
                </p>
                <p className="mt-1 text-[11px] text-[#888]">
                  Try searching for "Marcus", "Discipline", "Focus", or "Habits".
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
