import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Download,
  Filter,
  Trash2,
  Share2,
  BookOpen,
  Plus,
  Sparkles,
  Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { BackButton } from '../common/BackButton';

interface NotesVaultProps {
  onBack?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const NotesVault: React.FC<NotesVaultProps> = ({ onBack }) => {
  const { notes, books, deleteNote, addNote, openCoachWithPrompt } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookId, setNewBookId] = useState(books[0]?.id || '');
  const [newSelectedText, setNewSelectedText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.note && n.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.bookTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBook = selectedBook === 'all' || n.bookId === selectedBook;
    const matchesColor = selectedColor === 'all' || n.color === selectedColor;

    return matchesSearch && matchesBook && matchesColor;
  });

  const handleExportMarkdown = () => {
    const content = filteredNotes
      .map(
        (n) =>
          `### ${n.bookTitle} (Page ${n.page})\n\n> "${n.selectedText}"\n\n${
            n.note ? `*Reflection:* ${n.note}\n` : ''
          }\n---\n`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindRise-Highlights-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const handleCopyNote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find((b) => b.id === newBookId);
    if (!book || !newSelectedText.trim()) return;

    addNote({
      bookId: book.id,
      bookTitle: book.title,
      page: 1,
      selectedText: newSelectedText.trim(),
      note: newNoteText.trim() || undefined,
      color: 'emerald',
      type: 'note',
    });

    setShowAddModal(false);
    setNewSelectedText('');
    setNewNoteText('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-emerald-950/40 pb-6 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Notes & Knowledge Vault
            </h1>
            <p className="mt-1 text-xs text-stone-400">
              Synthesize golden passages, Stoic insights, and personalized marginalia into lasting wisdom.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/50 px-3.5 py-2 text-xs font-medium text-stone-300 hover:border-emerald-700 hover:text-white"
            title="Export all to Markdown"
          >
            <Download className="h-4 w-4" />
            <span>Export (.md)</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-950/50 hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            <span>New Insight</span>
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-emerald-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all highlighted insights..."
            className="w-full rounded-2xl border border-stone-800 bg-[#080d0a] py-2.5 pl-10 pr-4 text-xs text-stone-200 placeholder-stone-500 outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter by Book */}
          <select
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="rounded-xl border border-stone-800 bg-[#080d0a] px-3 py-2 text-xs text-stone-300 outline-none hover:border-emerald-700"
          >
            <option value="all">All Books ({notes.length})</option>
            {(books || []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>

          {/* Filter by Color */}
          <div className="flex items-center gap-1 rounded-xl border border-stone-800 bg-[#080d0a] p-1">
            {['all', 'emerald', 'amber', 'blue', 'purple'].map((col) => (
              <button
                key={col}
                onClick={() => setSelectedColor(col)}
                className={`h-6 rounded-lg px-2 text-[10px] capitalize transition-all ${
                  selectedColor === col
                    ? 'bg-stone-800 text-emerald-300 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-stone-800 bg-[#080d0a] p-12 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-stone-600" />
          <h3 className="mt-3 font-serif text-lg font-bold text-stone-200">
            No highlights or notes found
          </h3>
          <p className="mt-1 text-xs text-stone-400 max-w-sm mx-auto">
            While reading any book in MindRise, select text to instantly create highlights and capture margin thoughts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(filteredNotes || []).map((n) => {
            const colorBorder = {
              emerald: 'border-emerald-500/40 bg-emerald-950/10',
              amber: 'border-amber-500/40 bg-amber-950/10',
              blue: 'border-blue-500/40 bg-blue-950/10',
              purple: 'border-purple-500/40 bg-purple-950/10',
            }[n.color || 'emerald'];

            return (
              <div
                key={n.id}
                className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:border-emerald-700/60 ${colorBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2">
                    <span className="font-serif font-semibold text-emerald-300 truncate max-w-[200px]">
                      {n.bookTitle}
                    </span>
                    <span>Page {n.page}</span>
                  </div>

                  <blockquote className="font-reading text-base italic leading-relaxed text-stone-100">
                    “{n.selectedText}”
                  </blockquote>

                  {n.note && (
                    <div className="mt-3 rounded-xl border border-stone-800/80 bg-stone-900/40 p-3 text-xs text-stone-300">
                      <span className="block text-[10px] uppercase font-bold text-emerald-400 mb-0.5">
                        Your Reflection:
                      </span>
                      {n.note}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-800/60 pt-3 text-xs text-stone-500">
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        openCoachWithPrompt(
                          `In "${n.bookTitle}", I took this note: "${n.selectedText}". How can I operationalize this into my daily habits?`
                        )
                      }
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Ask Coach</span>
                    </button>
                    <button
                      onClick={() => handleCopyNote(n.id, n.selectedText)}
                      className="p-1 hover:text-stone-300"
                      title="Copy quote"
                    >
                      {copiedId === n.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="p-1 hover:text-rose-400"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Insight Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-900/60 bg-[#070c09] p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white mb-4">
              Add New Philosophical Insight
            </h3>
            <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Source Book</label>
                <select
                  value={newBookId}
                  onChange={(e) => setNewBookId(e.target.value)}
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Passage / Core Idea *</label>
                <textarea
                  rows={3}
                  required
                  value={newSelectedText}
                  onChange={(e) => setNewSelectedText(e.target.value)}
                  placeholder="Paste or write the quote / principle..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Your Reflection / Marginalia</label>
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="How does this apply to your life?"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-white outline-none focus:border-emerald-600"
                />
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
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
