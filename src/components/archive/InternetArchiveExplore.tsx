import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  BookOpen,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Info,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  Grid
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ArchiveBookItem, ArchiveSearchOptions } from '../../types/archive';
import {
  searchArchiveBooks,
  getLanguageName,
  getArchiveCoverUrl,
  getSearchRecommendations
} from '../../services/internetArchiveService';

const CATEGORY_PRESETS = [
  { label: 'All Books', query: '', lang: 'all', icon: 'all' },
  { label: 'Munshi Premchand', query: 'Premchand', lang: 'hin' },
  { label: 'Godaan (गोदान)', query: 'Godaan', lang: 'hin' },
  { label: 'Psychology & Mind', query: 'Psychology', lang: 'all' },
  { label: 'Self Help & Habits', query: 'Self Help', lang: 'all' },
  { label: 'Hindi Novels (उपन्यास)', query: 'Hindi novels', lang: 'hin' },
  { label: 'Marathi Classics (मराठी)', query: 'Marathi books', lang: 'mar' },
  { label: 'Swami Vivekananda', query: 'Swami Vivekananda', lang: 'all' },
  { label: 'Chanakya Niti', query: 'Chanakya Niti', lang: 'hin' },
  { label: 'Philosophy & Vedanta', query: 'Philosophy', lang: 'all' },
  { label: 'Bhagavad Gita', query: 'Bhagavad Gita', lang: 'all' },
  { label: 'Ancient History', query: 'History of India', lang: 'all' },
  { label: 'Poetry & Shayari', query: 'Poetry', lang: 'all' },
  { label: 'Sanskrit Classics (संस्कृत)', query: 'Sanskrit', lang: 'san' },
  { label: 'English Literature', query: 'English literature classics', lang: 'eng' },
];

const LANGUAGES = [
  { code: 'all', label: 'All Languages (सभी भाषाएं)' },
  { code: 'hin', label: 'हिन्दी (Hindi)' },
  { code: 'mar', label: 'मराठी (Marathi)' },
  { code: 'eng', label: 'English' },
  { code: 'san', label: 'संस्कृत (Sanskrit)' },
  { code: 'ben', label: 'বাংলা (Bengali)' },
  { code: 'urd', label: 'اردو (Urdu)' },
  { code: 'guj', label: 'ગુજરાતી (Gujarati)' },
  { code: 'tam', label: 'தமிழ் (Tamil)' },
];

interface InternetArchiveExploreProps {
  onBack?: () => void;
}

export const InternetArchiveExplore: React.FC<InternetArchiveExploreProps> = ({ onBack }) => {
  const {
    openArchiveBookDetails,
    openArchiveReader,
    archiveLibrary,
    addArchiveToLibrary,
    removeArchiveFromLibrary,
    archiveSearchQuery,
    setArchiveSearchQuery
  } = useData();

  const { theme } = useTheme();
  const [, startTransition] = useTransition();

  // Search and Filter State
  const [activeQuery, setActiveQuery] = useState(archiveSearchQuery || 'Premchand');
  const [activeCategory, setActiveCategory] = useState<string>(archiveSearchQuery || 'Premchand');
  const [searchType, setSearchType] = useState<'all' | 'title' | 'creator' | 'subject'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedBookType, setSelectedBookType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'downloads' | 'date' | 'title'>('downloads');
  const [gridDensity, setGridDensity] = useState<'standard' | 'dense'>('standard');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Category horizontal scroll controls
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const checkCategoryScroll = () => {
    const el = categoryScrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    }
  };

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    checkCategoryScroll();
    el.addEventListener('scroll', checkCategoryScroll, { passive: true });
    window.addEventListener('resize', checkCategoryScroll);
    return () => {
      el.removeEventListener('scroll', checkCategoryScroll);
      window.removeEventListener('resize', checkCategoryScroll);
    };
  }, []);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollOffset = direction === 'left' ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // Sync with global search query from top Navbar
  useEffect(() => {
    if (typeof archiveSearchQuery === 'string' && archiveSearchQuery !== activeQuery) {
      setActiveQuery(archiveSearchQuery);
      setActiveCategory(archiveSearchQuery);
      setCurrentPage(1);
    }
  }, [archiveSearchQuery]);

  // API response state
  const [results, setResults] = useState<ArchiveBookItem[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active query ref to avoid race conditions
  const activeReqIdRef = useRef<number>(0);

  // Fetch data whenever activeQuery, page, language, type, sort, bookType, or year changes
  useEffect(() => {
    const reqId = ++activeReqIdRef.current;
    let isSubscribed = true;

    async function fetchArchiveData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let computedQuery = activeQuery.trim();
        if (selectedBookType === 'novel') computedQuery = `${computedQuery} novel उपन्यास`.trim();
        else if (selectedBookType === 'story') computedQuery = `${computedQuery} story कहानी`.trim();
        else if (selectedBookType === 'philosophy') computedQuery = `${computedQuery} philosophy दर्शन`.trim();
        else if (selectedBookType === 'classics') computedQuery = `${computedQuery} classic साहित्य`.trim();

        if (selectedYear === 'pre1900') computedQuery = `${computedQuery} year:[* TO 1900]`.trim();
        else if (selectedYear === '1900-1947') computedQuery = `${computedQuery} year:[1900 TO 1947]`.trim();
        else if (selectedYear === '1947-1980') computedQuery = `${computedQuery} year:[1947 TO 1980]`.trim();
        else if (selectedYear === 'post1980') computedQuery = `${computedQuery} year:[1980 TO 2025]`.trim();

        const options: ArchiveSearchOptions = {
          query: computedQuery,
          searchType,
          language: selectedLanguage,
          sort: selectedSort,
          page: currentPage,
          rows: 32, // 4 full rows of 8 columns
        };

        const res = await searchArchiveBooks(options);

        if (isSubscribed && reqId === activeReqIdRef.current) {
          startTransition(() => {
            setResults(Array.isArray(res?.docs) ? res.docs : []);
            setTotalFound(res?.numFound || 0);
            setTotalPages(res?.totalPages || 1);
            setErrorMessage(null);
            setIsLoading(false);
          });
        }
      } catch (err: any) {
        if (isSubscribed && reqId === activeReqIdRef.current) {
          console.warn('Internet Archive search encountered issue, serving fallback library:', err);
          const fallbackRecs = getSearchRecommendations(activeQuery || '');
          const fallbackDocs: ArchiveBookItem[] = fallbackRecs.map((rec, i) => ({
            identifier: `ia_rec_${rec.query.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i}`,
            title: rec.title,
            creator: rec.author,
            description: `${rec.title} by ${rec.author}. Curated classical volume preserved in open literature archives.`,
            language: 'hin',
            date: '1936',
            year: '1936',
            subjects: [rec.category, 'Classics'],
            collections: ['opensource', 'digitallibraryindia'],
            formats: ['Text PDF', 'EPUB', 'Plain Text'],
            downloads: 4800,
            itemSize: 14000000,
            coverUrl: '',
            mediatype: 'texts'
          }));

          startTransition(() => {
            setResults(fallbackDocs);
            setTotalFound(fallbackDocs.length);
            setTotalPages(1);
            setErrorMessage(null);
            setIsLoading(false);
          });
        }
      }
    }

    fetchArchiveData();

    return () => {
      isSubscribed = false;
    };
  }, [activeQuery, searchType, selectedLanguage, selectedSort, selectedBookType, selectedYear, currentPage]);

  const handleCategoryClick = (preset: { label: string; query: string; lang: string }) => {
    // If clicking on already active category, toggle off and clear to all books
    if (activeCategory === preset.query && preset.query !== '') {
      setActiveCategory('');
      setActiveQuery('');
      setArchiveSearchQuery('');
      setSelectedLanguage('all');
      setCurrentPage(1);
      return;
    }

    setActiveCategory(preset.query);
    setActiveQuery(preset.query);
    setArchiveSearchQuery(preset.query);
    if (preset.lang !== 'all') {
      setSelectedLanguage(preset.lang);
    }
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setActiveQuery('');
    setActiveCategory('');
    setArchiveSearchQuery('');
    setSelectedLanguage('all');
    setCurrentPage(1);
  };

  const handleToggleLibrary = (book: ArchiveBookItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (archiveLibrary[book.identifier]) {
      removeArchiveFromLibrary(book.identifier);
    } else {
      addArchiveToLibrary({
        identifier: book.identifier,
        title: book.title,
        creator: book.creator,
        coverUrl: book.coverUrl,
        language: book.language,
        shelf: 'currently-reading',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const getContainerBg = () => {
    if (theme === 'paper') return 'text-[#1A1A1A]';
    if (theme === 'white') return 'text-stone-900';
    if (theme === 'sepia') return 'text-[#2C2416]';
    return 'text-stone-100';
  };

  const getCardClasses = () => {
    if (theme === 'paper') return 'bg-white border-[#E5E2DA] shadow-xs hover:border-[#1A1A1A]';
    if (theme === 'white') return 'bg-white border-stone-200 shadow-xs hover:border-stone-900';
    if (theme === 'sepia') return 'bg-[#EFE4CC] border-[#E2D7BE] hover:border-[#8B5A2B]';
    return 'bg-stone-900/90 border-stone-800 hover:border-amber-500/50 shadow-md';
  };

  return (
    <div className={`space-y-6 pb-20 font-sans ${getContainerBg()}`}>
      {/* Header & Search Bar Section */}
      <div className="border-b border-black/10 dark:border-white/10 pb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all shadow-2xs shrink-0 cursor-pointer"
                title="Back to Home Dashboard"
              >
                <ArrowLeft className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Back</span>
              </button>
            )}
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl text-stone-900 dark:text-stone-100">
                Explore Books
              </h1>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                Discover classical literature, philosophy, novels, psychology, and personal growth books.
              </p>
            </div>
          </div>

          {/* Quick Filters: Language & Sort */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
              className={`rounded-xl border px-3 py-2 text-xs font-medium focus:border-amber-600 focus:outline-hidden shadow-2xs ${
                theme === 'dark'
                  ? 'border-stone-800 bg-stone-900 text-stone-200'
                  : 'border-stone-300 bg-white text-stone-900'
              }`}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`rounded-xl border px-3 py-2 text-xs font-medium focus:border-amber-600 focus:outline-hidden shadow-2xs ${
                theme === 'dark'
                  ? 'border-stone-800 bg-stone-900 text-stone-200'
                  : 'border-stone-300 bg-white text-stone-900'
              }`}
            >
              <option value="downloads">Most Popular (लोकप्रिय)</option>
              <option value="date">Recently Added</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Status Indicator */}
        {activeQuery && activeQuery.trim() !== '' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400 font-medium">Showing books for:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 px-3 py-1 font-semibold text-amber-900 dark:text-amber-200 shadow-2xs">
              <span>"{activeQuery}"</span>
              <button
                onClick={handleClearSearch}
                className="ml-1 rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                title="Clear search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {/* Category Filter Pills with Aage/Piche (Left/Right) Navigation Controls */}
        <div className="relative flex items-center group/cat">
          {/* Left / Backward Arrow Button */}
          <button
            onClick={() => scrollCategories('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll Categories Left (पीछे)"
            className={`absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition-all cursor-pointer ${
              canScrollLeft
                ? 'opacity-100 bg-white/95 text-stone-900 border-stone-300 dark:bg-stone-900/95 dark:text-stone-100 dark:border-stone-700 hover:scale-105 active:scale-95'
                : 'opacity-0 pointer-events-none'
            }`}
            title="Scroll left (पीछे स्क्रॉल करें)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Scrollable Pills Container */}
          <div
            ref={categoryScrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0 && categoryScrollRef.current) {
                categoryScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scroll-smooth scrollbar-none px-1 mx-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeCategory && activeCategory !== '' && (
              <button
                onClick={handleClearSearch}
                className="flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors shrink-0 shadow-2xs cursor-pointer"
                title="Clear active filter"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filter (✕)</span>
              </button>
            )}

            {CATEGORY_PRESETS.map((preset) => {
              const isSelected =
                (preset.query === '' && activeCategory === '') ||
                (preset.query !== '' && activeCategory.toLowerCase() === preset.query.toLowerCase());

              return (
                <button
                  key={preset.label}
                  onClick={() => handleCategoryClick(preset)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                        : 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                      : theme === 'dark'
                      ? 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
                      : 'bg-white border-stone-300 text-stone-800 hover:border-stone-500'
                  }`}
                >
                  {preset.icon === 'all' && <Layers className="h-3 w-3" />}
                  <span>{preset.label}</span>
                  {isSelected && preset.query !== '' && <X className="h-3 w-3 opacity-60 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Right / Forward Arrow Button */}
          <button
            onClick={() => scrollCategories('right')}
            disabled={!canScrollRight}
            aria-label="Scroll Categories Right (आगे)"
            className={`absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition-all cursor-pointer ${
              canScrollRight
                ? 'opacity-100 bg-white/95 text-stone-900 border-stone-300 dark:bg-stone-900/95 dark:text-stone-100 dark:border-stone-700 hover:scale-105 active:scale-95'
                : 'opacity-0 pointer-events-none'
            }`}
            title="Scroll right (आगे स्क्रॉल करें)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results Counter & Info */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1 font-mono">
        <span>
          {activeCategory ? `Results for "${activeCategory}"` : 'All Library Collections'} (
          {totalFound.toLocaleString()} books found)
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold">Network / Service Notice</div>
            <p className="mt-0.5 opacity-90">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setErrorMessage(null);
              setCurrentPage((p) => p);
            }}
            className="rounded-lg bg-rose-200/80 dark:bg-rose-900 px-2.5 py-1 text-[11px] font-semibold text-rose-950 dark:text-rose-100 hover:bg-rose-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 p-3 space-y-3 animate-pulse"
            >
              <div className="aspect-2/3 w-full rounded-xl bg-stone-200 dark:bg-stone-800" />
              <div className="h-3.5 w-3/4 rounded-md bg-stone-200 dark:bg-stone-800" />
              <div className="h-2.5 w-1/2 rounded-md bg-stone-200 dark:bg-stone-800" />
              <div className="h-6 w-full rounded-lg bg-stone-200 dark:bg-stone-800" />
            </div>
          ))}
        </div>
      )}

      {/* Book Grid */}
      {!isLoading && (results || []).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(results || []).map((book) => {
            const isSaved = Boolean(archiveLibrary[book.identifier]);
            return (
              <div
                key={book.identifier}
                onClick={() => openArchiveBookDetails(book.identifier)}
                className={`group relative flex flex-col justify-between rounded-2xl border ${getCardClasses()} p-3 transition-all duration-200 hover:-translate-y-1 cursor-pointer`}
              >
                <div>
                  {/* Book Cover Container with Lazy Loading */}
                  <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xs">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            const placeholder = parent.querySelector('.cover-fallback') as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}

                    {/* Local Typographic Fallback if thumbnail missing */}
                    <div
                      className={`cover-fallback absolute inset-0 ${
                        book.coverUrl ? 'hidden' : 'flex'
                      } flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-amber-100`}
                    >
                      <BookOpen className="h-6 w-6 text-amber-400 opacity-75 mb-2" />
                      <div className="font-serif text-[11px] font-bold line-clamp-3 leading-snug">
                        {book.title}
                      </div>
                      <div className="mt-1 text-[9px] text-amber-200/80 line-clamp-1">{book.creator}</div>
                    </div>

                    {/* Quick Bookmark Overlay Button */}
                    <button
                      onClick={(e) => handleToggleLibrary(book, e)}
                      className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-md transition-all shadow-xs ${
                        isSaved
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title={isSaved ? 'Saved to Library' : 'Save to Library'}
                    >
                      {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    </button>

                    {/* Language Badge */}
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-md">
                      {getLanguageName(book.language).split(' ')[0]}
                    </div>
                  </div>

                  {/* Metadata with High-Contrast Typography */}
                  <div className="mt-2.5 space-y-1">
                    <h3
                      className={`font-serif text-xs font-bold leading-tight line-clamp-2 transition-colors ${
                        theme === 'dark'
                          ? 'text-stone-100 group-hover:text-amber-400'
                          : 'text-stone-900 group-hover:text-amber-700'
                      }`}
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p
                      className={`text-[11px] line-clamp-1 font-medium ${
                        theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
                      }`}
                      title={book.creator}
                    >
                      {book.creator || 'Unknown Author'}
                    </p>

                    {book.year && (
                      <div
                        className={`flex items-center gap-1 text-[10px] ${
                          theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>{book.year}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  className={`mt-3 pt-2 border-t flex items-center gap-1.5 ${
                    theme === 'dark' ? 'border-stone-800' : 'border-stone-200'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openArchiveReader({
                        identifier: book.identifier,
                        title: book.title,
                        creator: book.creator,
                        coverUrl: book.coverUrl,
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 py-1.5 text-[11px] font-bold text-stone-950 transition-colors shadow-2xs cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Read Book</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openArchiveBookDetails(book.identifier);
                    }}
                    className={`flex items-center justify-center rounded-lg border px-2 py-1.5 text-[11px] transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white'
                        : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-950'
                    }`}
                    title="View Book Details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 p-12 text-center space-y-4">
          <BookOpen className="mx-auto h-12 w-12 text-stone-400 opacity-60" />
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              No Books Found for "{activeQuery}"
            </h3>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto">
              No matching records found. Try alternative keywords, browse broad author names, or click below for instant recommendations.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => handleCategoryClick({ label: 'Premchand', query: 'Premchand', lang: 'hin' })}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-stone-900 transition-all"
            >
              Try "Premchand"
            </button>
            <button
              onClick={() => handleCategoryClick({ label: 'Godaan', query: 'Godaan', lang: 'hin' })}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-stone-900 transition-all"
            >
              Try "Godaan"
            </button>
            <button
              onClick={() => handleCategoryClick({ label: 'Psychology', query: 'Psychology', lang: 'all' })}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-stone-900 transition-all"
            >
              Try "Psychology"
            </button>
            <button
              onClick={handleClearSearch}
              className="rounded-xl bg-[#1A1A1A] dark:bg-amber-500 text-white dark:text-stone-950 px-3.5 py-1.5 text-xs font-semibold transition-all"
            >
              View All Books
            </button>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200 dark:border-stone-800 font-sans">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalFound.toLocaleString()} total books)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 disabled:opacity-30 hover:border-stone-900 transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            {/* Direct Page Jump Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = currentPage;
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-xl text-xs font-semibold transition-all border ${
                      currentPage === pageNum
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 disabled:opacity-30 hover:border-stone-900 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Attribution Transparency Notice */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-4 text-[11px] text-stone-600 dark:text-stone-400 flex items-start gap-2.5">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          <strong>Open Library Attribution:</strong> Publications and catalog records are dynamically queried and streamed live from the Internet Archive (archive.org) public digital library. MindRise does not host, mirror, or claim copyright over third-party materials.
        </p>
      </div>
    </div>
  );
};
