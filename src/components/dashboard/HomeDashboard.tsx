import React, { useState, useMemo } from 'react';
import {
  Flame,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  Headphones,
  Star,
  Compass,
  Play,
  Share2,
  Bookmark,
  Quote,
  Layers,
  ChevronRight,
  Sparkle,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ReadingProgress, Book } from '../../types';

interface HomeDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ setActiveTab }) => {
  const { user, updateUserProfile } = useAuth();
  const {
    books,
    readingProgress,
    dailyQuote,
    rotateQuote,
    openReader,
    openBookDetails,
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

  // Literary Sanctuary Headings
  const sanctuaryGreeting = useMemo(() => {
    const headlines = [
      'Welcome to Your Reading Sanctuary',
      'Universal Wisdom & Knowledge Sanctuary',
      'Your Literary Sanctuary & Desk',
      'Explore Timeless World Masterworks',
    ];
    const slot = Math.floor((Date.now() / (1000 * 60 * 60 * 4)) % headlines.length);
    return headlines[slot];
  }, []);

  const handleSaveName = async () => {
    if (editedName.trim()) {
      await updateUserProfile({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  // Find active book to continue reading
  const activeProgEntry = (Object.entries(readingProgress) as [string, ReadingProgress][]).find(([_, p]) => !p.completed);
  const activeBook = activeProgEntry ? books.find((b) => b.id === activeProgEntry[0]) : books[0];
  const activeProg: ReadingProgress | null = activeProgEntry ? activeProgEntry[1] : null;

  // Categories list
  const categoryFilters = [
    'all',
    'Literature',
    'Philosophy',
    'Mindset',
    'Habits',
    'Wealth',
    'Poetry',
    'Stories',
    'Spirituality'
  ];

  // Filtered books based on selected category pill
  const filteredBooks = useMemo(() => {
    const list = books || [];
    if (selectedCategory === 'all') return list;
    return list.filter(
      (b) =>
        (b.category && b.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (Array.isArray(b.categories) && b.categories.some((c) => c && c.toLowerCase() === selectedCategory.toLowerCase()))
    );
  }, [books, selectedCategory]);

  const handleCopyQuote = () => {
    if (!dailyQuote) return;
    navigator.clipboard.writeText(`"${dailyQuote.text}" — ${dailyQuote.author}`);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="space-y-10 pb-20 font-sans">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-6 sm:p-8 shadow-2xs">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-0.5 text-[10px] font-mono font-semibold text-stone-700 dark:text-stone-300">
                OPEN DIGITAL LIBRARY • 8.5M+ BOOKS
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-mono font-semibold">
                <Flame className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
                <span>{user?.currentStreak || 0} Day Streak</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 dark:text-white tracking-tight">
                {sanctuaryGreeting}, {user?.name?.split(' ')[0] || 'Scholar'}.
              </h1>
              {!isEditingName ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(user?.name || '');
                    setIsEditingName(true);
                  }}
                  className="rounded-full p-1 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title="Edit your display name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-transparent text-xs font-semibold px-2 py-0.5 outline-none w-28 sm:w-36 text-stone-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-black p-1 transition"
                    title="Save name"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="rounded-lg p-1 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                    title="Cancel"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xl">
              Your universal sanctuary of 8.5 Million+ open books across all languages, world literature, philosophy, and sciences. Read distraction-free, listen to audio chapters, or track habits in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('coach')}
              className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-2.5 text-xs font-semibold text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              <span>Ask AI Coach</span>
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className="flex items-center gap-2 rounded-xl bg-stone-900 dark:bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white dark:text-black hover:scale-105 transition shadow-xs"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Explore Books</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-900 dark:text-amber-300 font-semibold">
            Browse By Category
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
            {filteredBooks.length} books available
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryFilters.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-black shadow-xs'
                    : 'border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Reading / Active Book Card */}
      {activeBook && (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                onClick={() => openBookDetails(activeBook.id)}
                className="cursor-pointer h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-900 shadow-xs"
              >
                <img
                  src={activeBook.coverUrl}
                  alt={activeBook.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40 px-2 py-0.5 text-[10px] font-mono font-semibold">
                  CURRENTLY READING
                </span>
                <h2
                  onClick={() => openBookDetails(activeBook.id)}
                  className="mt-1.5 cursor-pointer font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-white hover:underline"
                >
                  {activeBook.title}
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400">{activeBook.author}</p>
                {activeProg && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
                    <div className="h-1.5 w-32 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 dark:bg-amber-500 rounded-full"
                        style={{ width: `${activeProg.percentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-stone-900 dark:text-stone-200">
                      {activeProg.percentage}% Completed
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => openReader(activeBook.id)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-stone-900 dark:bg-amber-500 px-5 py-3 text-xs font-semibold text-white dark:text-black shadow-xs hover:scale-105 transition"
              >
                <BookOpen className="h-4 w-4" />
                <span>Resume Reading</span>
              </button>
              <button
                onClick={() => openBookDetails(activeBook.id)}
                className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 text-xs font-medium text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <Headphones className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <span>Listen Chapter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured 500 Hindi Masterpieces Shelf */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
              Timeless Masterpieces (कालजयी कृतियाँ)
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Immortal works by Premchand, Vivekananda, Chanakya, Dinkar, and Kabir.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-1 text-xs font-semibold text-stone-900 dark:text-amber-400 underline hover:text-amber-700"
          >
            <span>View All 500</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filteredBooks.slice(0, 12).map((book) => (
            <div
              key={book.id}
              onClick={() => openBookDetails(book.id)}
              className="group cursor-pointer flex flex-col rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-2.5 shadow-2xs hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-900 mb-2.5">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-mono text-white backdrop-blur-xs">
                  Free
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {book.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                    {book.author}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-500">
                  <span className="flex items-center gap-1 font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {book.rating}
                  </span>
                  <span>{book.pages}p</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Quote / Swadhyay Insight */}
      {dailyQuote && (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-6 sm:p-8 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-amber-900 dark:text-amber-300 font-semibold">
                Daily Swadhyay Thought
              </span>
            </div>
            <button
              onClick={rotateQuote}
              className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white underline cursor-pointer"
            >
              Next Quote
            </button>
          </div>

          <blockquote className="mt-4 font-serif text-lg sm:text-xl text-stone-900 dark:text-stone-100 italic leading-relaxed">
            "{dailyQuote.text}"
          </blockquote>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              — {dailyQuote.author} <span className="font-normal opacity-60">({dailyQuote.source})</span>
            </p>
            <button
              onClick={handleCopyQuote}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copiedQuote ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
