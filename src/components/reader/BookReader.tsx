import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  List,
  Bookmark,
  Type,
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  AlignLeft,
  AlignJustify,
  BookOpen,
  Share2,
  X,
  Clock,
  Settings,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';
import { HINDI_500_BOOKS } from '../../data/hindi500Books';

type ReaderTheme = 'paperwhite' | 'purewhite' | 'sepia' | 'dark' | 'sage';
type ReaderFont = 'serif' | 'sans' | 'mono';
type PageWidth = 'narrow' | 'medium' | 'wide';
type LineSpacing = 1.5 | 1.8 | 2.1;

export const BookReader: React.FC = () => {
  const {
    activeReaderBookId,
    closeReader,
    books,
    readingProgress,
    saveReadingProgress,
    addNote
  } = useData();

  // Find book from state or fallback to 500-book collection
  const book =
    books.find((b) => b.id === activeReaderBookId) ||
    HINDI_500_BOOKS.find((b) => b.id === activeReaderBookId) ||
    HINDI_500_BOOKS[0];

  const currentProg = book ? readingProgress[book.id] : undefined;
  const initialPage = currentProg?.currentPage || 1;

  // Reader settings state
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageDirection, setPageDirection] = useState<number>(1);
  const [theme, setTheme] = useState<ReaderTheme>('paperwhite');
  const [font, setFont] = useState<ReaderFont>('serif');
  const [fontSizeStep, setFontSizeStep] = useState<number>(4); // 1 to 7 (14px to 26px)
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(1.8);
  const [pageWidth, setPageWidth] = useState<PageWidth>('medium');
  const [isJustified, setIsJustified] = useState<boolean>(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Modals & Panels
  const [showChrome, setShowChrome] = useState<boolean>(true);
  const [showAaMenu, setShowAaMenu] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const readerStageRef = useRef<HTMLDivElement>(null);
  const lastSavedPageRef = useRef<number | null>(null);

  // If no book at all (impossible with fallback, but safe)
  if (!book) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF8F5] p-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">किताब लोड नहीं हो सकी</h2>
        <p className="mt-2 text-sm text-[#666]">कृपया पुस्तकालय में वापस जाकर दोबारा प्रयास करें।</p>
        <button
          onClick={closeReader}
          className="mt-6 rounded-xl bg-[#1A1A1A] px-6 py-2.5 text-xs font-semibold text-white shadow-sm"
        >
          पुस्तकालय लौटें (Back to Library)
        </button>
      </div>
    );
  }

  // Safe chapters
  const chapters =
    book.chapters && book.chapters.length > 0
      ? book.chapters
      : [
          {
            id: 'ch-1',
            title: `प्रवेश: ${book.title}`,
            pageStart: 1,
            content: `${book.title}—${book.author} द्वारा रचित एक महत्वपूर्ण कृति।\n\n${book.description}\n\nस्वाध्याय और ज्ञान का निरंतर अभ्यास ही मनुष्य के जीवन को सार्थक और सफल बनाता है। इस ग्रंथ के विचार हमें आत्म-विश्वास, कर्तव्य-निष्ठा और सामाजिक उत्तरदायित्व का बोध कराते हैं।`
          }
        ];

  // Derive active chapter based on current page
  const activeChapterIndex = chapters.findIndex(
    (c, idx) =>
      currentPage >= c.pageStart &&
      (idx === chapters.length - 1 || currentPage < chapters[idx + 1].pageStart)
  );
  const activeChapter = chapters[activeChapterIndex >= 0 ? activeChapterIndex : 0];

  // Auto-generate page specific paragraphs to create realistic multi-page book experience
  const getPageContent = (page: number) => {
    // If book has direct deterministic page map from PDF extraction, use it directly
    if (book.pageMap && book.pageMap.length > 0) {
      const mappedPage = book.pageMap.find((p) => p.pageNumber === page);
      if (mappedPage && mappedPage.text) {
        const paragraphs = mappedPage.text.split('\n\n').map((p) => p.trim()).filter(Boolean);
        if (paragraphs.length > 0) return paragraphs;
        return [mappedPage.text];
      }
    }

    if (!activeChapter || !activeChapter.content) return [book.description || 'सामग्री उपलब्ध नहीं है।'];

    const baseParagraphs = activeChapter.content.split('\n\n').map(p => p.trim()).filter(Boolean);
    if (baseParagraphs.length === 0) {
      return [book.description || 'इस अध्याय में सामग्री लोड हो रही है...'];
    }

    // Determine current chapter's total page span
    const nextChapter = chapters[activeChapterIndex + 1];
    const chapterEndPage = nextChapter ? nextChapter.pageStart - 1 : Math.max(book.pages, activeChapter.pageStart);
    const chapterTotalPages = Math.max(1, chapterEndPage - activeChapter.pageStart + 1);

    // Calculate relative page offset within this chapter (0-indexed)
    const relPageIndex = Math.max(0, page - activeChapter.pageStart);

    // Determine paragraphs per page dynamically
    const paragraphsPerPage = Math.max(1, Math.ceil(baseParagraphs.length / chapterTotalPages));
    const startPIdx = relPageIndex * paragraphsPerPage;
    const endPIdx = startPIdx + paragraphsPerPage;

    const pageSlice = baseParagraphs.slice(startPIdx, endPIdx);

    if (pageSlice.length > 0) {
      return pageSlice;
    }

    // If page is beyond total paragraphs, return last available paragraph or clean continuation
    const fallbackIdx = relPageIndex % baseParagraphs.length;
    return [baseParagraphs[fallbackIdx]];
  };

  const pageParagraphs = getPageContent(currentPage);

  // Save progress
  useEffect(() => {
    if (lastSavedPageRef.current === currentPage) return;
    lastSavedPageRef.current = currentPage;
    const pct = Math.min(100, Math.max(1, Math.round((currentPage / (book.pages || 1)) * 100)));
    saveReadingProgress(
      book.id,
      currentPage,
      activeChapter?.id || 'ch-1',
      pct,
      0,
      currentPage >= book.pages
    );
  }, [currentPage, book.id, book.pages, activeChapter?.id, saveReadingProgress]);

  // Page turns
  const goToNextPage = () => {
    if (currentPage < book.pages) {
      setPageDirection(1);
      setCurrentPage((p) => p + 1);
      if (readerStageRef.current) {
        readerStageRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setPageDirection(-1);
      setCurrentPage((p) => p - 1);
      if (readerStageRef.current) {
        readerStageRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'Escape') {
        if (showAaMenu) setShowAaMenu(false);
        else if (showToc) setShowToc(false);
        else setShowChrome((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, book.pages, showAaMenu, showToc]);

  // Laptop Touchpad 2-Finger Pinch to adjust text size & stop browser zoom
  useEffect(() => {
    const el = readerStageRef.current;
    if (!el) return;

    let accumulatedDelta = 0;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Block browser window zoom
        accumulatedDelta += -e.deltaY;

        if (Math.abs(accumulatedDelta) > 35) {
          if (accumulatedDelta > 0) {
            setFontSizeStep((s) => Math.min(7, s + 1));
          } else {
            setFontSizeStep((s) => Math.max(1, s - 1));
          }
          accumulatedDelta = 0;
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Window-level guard against browser zoom while reading
  useEffect(() => {
    const blockZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', blockZoom, { passive: false });
    return () => window.removeEventListener('wheel', blockZoom);
  }, []);

  // Clean Audio TTS on unmount or page change
  // Dynamic style calculations
  const actualFontSize = 14 + fontSizeStep * 2; // 16px to 28px

  const themeStyles = {
    paperwhite: {
      bg: 'bg-[#FAF8F5]',
      card: 'bg-white border-[#E5E2DA] shadow-xs text-[#1A1A1A]',
      header: 'bg-[#FAF8F5]/90 border-[#E5E2DA] text-[#1A1A1A]',
      subtext: 'text-[#666055]',
      border: 'border-[#E5E2DA]'
    },
    purewhite: {
      bg: 'bg-white',
      card: 'bg-white border-gray-200 shadow-xs text-gray-900',
      header: 'bg-white/90 border-gray-200 text-gray-900',
      subtext: 'text-gray-500',
      border: 'border-gray-200'
    },
    sepia: {
      bg: 'bg-[#F4ECD8]',
      card: 'bg-[#FAF2E1] border-[#E2D7BE] shadow-xs text-[#2C2416]',
      header: 'bg-[#F4ECD8]/90 border-[#E2D7BE] text-[#2C2416]',
      subtext: 'text-[#7A6B53]',
      border: 'border-[#E2D7BE]'
    },
    dark: {
      bg: 'bg-[#121212]',
      card: 'bg-[#1E1E1E] border-[#2E2E2E] shadow-xs text-[#E0E0E0]',
      header: 'bg-[#121212]/90 border-[#2E2E2E] text-[#E0E0E0]',
      subtext: 'text-[#888888]',
      border: 'border-[#2E2E2E]'
    },
    sage: {
      bg: 'bg-[#EEF2E6]',
      card: 'bg-[#F5F8F0] border-[#D6DECA] shadow-xs text-[#283324]',
      header: 'bg-[#EEF2E6]/90 border-[#D6DECA] text-[#283324]',
      subtext: 'text-[#5E6D58]',
      border: 'border-[#D6DECA]'
    }
  }[theme];

  const maxWidthClass = {
    narrow: 'max-w-xl',
    medium: 'max-w-2xl',
    wide: 'max-w-3xl'
  }[pageWidth];

  const fontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono'
  }[font];

  const percentComplete = Math.min(100, Math.round((currentPage / (book.pages || 1)) * 100));

  return (
    <div className={`fixed inset-0 z-50 flex flex-col select-text ${themeStyles.bg} transition-colors duration-200`}>
      {/* 1. TOP HEADER TOOLBAR */}
      <AnimatePresence>
        {showChrome && (
          <motion.header
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`absolute top-0 inset-x-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md ${themeStyles.header}`}
          >
            {/* Left: Back to Library */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  closeReader();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold hover:bg-black/5 transition cursor-pointer"
                title="Exit reader and return to library"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Library</span>
              </button>

              <div className="hidden sm:block border-l pl-3 border-black/10">
                <h1 className="text-xs font-serif font-bold truncate max-w-xs">{book.title}</h1>
                <p className={`text-[10px] truncate max-w-xs ${themeStyles.subtext}`}>{book.author}</p>
              </div>
            </div>

            {/* Right: Aa Menu, TOC, Bookmark */}
            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Aa Typography & Theme Menu */}
              <button
                onClick={() => {
                  setShowAaMenu((prev) => !prev);
                  setShowToc(false);
                }}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${
                  showAaMenu ? 'bg-black/10 border-black/30' : 'border-black/10 hover:bg-black/5'
                }`}
                title="Typography and Themes"
              >
                <Type className="h-3.5 w-3.5" />
                <span>Aa</span>
              </button>

              {/* Table of Contents */}
              <button
                onClick={() => {
                  setShowToc((prev) => !prev);
                  setShowAaMenu(false);
                }}
                className="rounded-xl border border-black/10 p-2 hover:bg-black/5 transition"
                title="Chapters / Table of Contents"
              >
                <List className="h-4 w-4" />
              </button>

              {/* Bookmark */}
              <button
                onClick={() => setIsBookmarked((b) => !b)}
                className={`rounded-xl border border-black/10 p-2 transition ${
                  isBookmarked ? 'bg-amber-700 text-white border-amber-700' : 'hover:bg-black/5'
                }`}
                title="Bookmark Page"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* 2. MAIN READING CANVAS STAGE */}
      <div
        ref={readerStageRef}
        className="relative flex-1 overflow-y-auto px-4 sm:px-8 py-20 flex justify-center items-start"
      >
        {/* Left Page Turn Click Area */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            goToPrevPage();
          }}
          className="fixed left-0 top-16 bottom-16 w-12 sm:w-20 z-20 cursor-pointer flex items-center justify-start pl-3 opacity-0 hover:opacity-100 transition-opacity"
          title="Previous Page (ArrowLeft / PageUp)"
        >
          <div className="rounded-full bg-black/10 p-2 text-[#1A1A1A]">
            <ChevronLeft className="h-6 w-6" />
          </div>
        </div>

        {/* Right Page Turn Click Area */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            goToNextPage();
          }}
          className="fixed right-0 top-16 bottom-16 w-12 sm:w-20 z-20 cursor-pointer flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition-opacity"
          title="Next Page (ArrowRight / PageDown)"
        >
          <div className="rounded-full bg-black/10 p-2 text-[#1A1A1A]">
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>

        {/* Reading Sheet Card */}
        <div
          onClick={() => setShowChrome((prev) => !prev)}
          className={`w-full ${maxWidthClass} transition-all duration-200`}
        >
          <div className={`relative min-h-[75vh] px-6 sm:px-12 py-10 sm:py-14 rounded-3xl border ${themeStyles.card}`}>
            {/* Bookmark ribbon */}
            {isBookmarked && (
              <div className="absolute -top-1 right-8 z-30 flex flex-col items-center">
                <div className="h-8 w-4 bg-amber-700 shadow-sm" />
                <div className="w-0 h-0 border-x-[8px] border-x-transparent border-t-[6px] border-t-amber-700" />
              </div>
            )}

            {/* Page Header */}
            <div className="mb-8 text-center select-none">
              <span className={`text-[10px] font-mono uppercase tracking-widest ${themeStyles.subtext}`}>
                {book.title} • पृष्ठ {currentPage}
              </span>
              <h2 className="mt-2 font-serif text-xl sm:text-2xl font-bold tracking-tight">
                {activeChapter ? activeChapter.title : book.title}
              </h2>
              <div className={`mx-auto mt-3 h-px w-12 border-b ${themeStyles.border}`} />
            </div>

            {/* Hindi Book Content Paragraphs */}
            <article
              className={`${fontClass} ${isJustified ? 'text-justify' : 'text-left'} leading-relaxed`}
              style={{
                fontSize: `${actualFontSize}px`,
                lineHeight: lineSpacing
              }}
            >
              {pageParagraphs.map((para, idx) => (
                <p
                  key={idx}
                  className="mb-5 indent-6 first-of-type:indent-0 first-of-type:first-letter:text-3xl first-of-type:first-letter:font-serif first-of-type:first-letter:float-left first-of-type:first-letter:mr-2"
                >
                  {para}
                </p>
              ))}
            </article>

            {/* Page Footer Navigation */}
            <div className={`mt-10 pt-4 border-t flex items-center justify-between text-[11px] font-mono select-none ${themeStyles.border} ${themeStyles.subtext}`}>
              <span>{percentComplete}% Complete</span>
              <span>Page {currentPage} of {book.pages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SCRUBBER & PROGRESS BAR */}
      <AnimatePresence>
        {showChrome && (
          <motion.footer
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`absolute bottom-0 inset-x-0 z-40 border-t px-4 py-2.5 backdrop-blur-md ${themeStyles.header}`}
          >
            <div className="mx-auto max-w-2xl flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-lg hover:bg-black/5 disabled:opacity-30 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <input
                  type="range"
                  min={1}
                  max={book.pages}
                  value={currentPage}
                  onChange={(e) => {
                    const newP = Number(e.target.value);
                    setPageDirection(newP >= currentPage ? 1 : -1);
                    setCurrentPage(newP);
                    if (readerStageRef.current) {
                      readerStageRef.current.scrollTo({ top: 0, behavior: 'instant' });
                    }
                  }}
                  className="flex-1 accent-amber-700 h-1.5 rounded-lg appearance-none cursor-pointer bg-black/10"
                />

                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= book.pages}
                  className="p-1 rounded-lg hover:bg-black/5 disabled:opacity-30 transition"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono px-1">
                <span className={themeStyles.subtext}>
                  अध्याय: {activeChapter?.title || 'प्रवेश'}
                </span>
                <span className="font-bold">{percentComplete}% ({currentPage}/{book.pages})</span>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* 4. "Aa" TYPOGRAPHY & THEME CONTROLS MODAL */}
      <AnimatePresence>
        {showAaMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`absolute top-16 right-4 z-50 w-72 sm:w-80 rounded-2xl border p-4 shadow-xl backdrop-blur-xl ${themeStyles.card}`}
          >
            <div className="flex items-center justify-between border-b pb-2 mb-3 border-black/10">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Reader Display</h3>
              <button onClick={() => setShowAaMenu(false)} className="p-1 hover:bg-black/5 rounded-md">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Themes Selector */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider opacity-60 block mb-1.5">Themes</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: 'paperwhite', label: 'Paper', bg: 'bg-[#FAF8F5] border-[#D8D4CA]' },
                      { id: 'purewhite', label: 'White', bg: 'bg-white border-gray-300' },
                      { id: 'sepia', label: 'Sepia', bg: 'bg-[#F4ECD8] border-[#E2D7BE]' },
                      { id: 'sage', label: 'Sage', bg: 'bg-[#EEF2E6] border-[#D6DECA]' },
                      { id: 'dark', label: 'Dark', bg: 'bg-[#1E1E1E] text-white border-gray-700' }
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`h-9 rounded-xl border text-[10px] font-semibold flex items-center justify-center transition ${t.bg} ${
                        theme === t.id ? 'ring-2 ring-amber-700 ring-offset-1' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex justify-between text-[10px] font-mono opacity-60 mb-1">
                  <span>Font Size</span>
                  <span>{actualFontSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSizeStep((s) => Math.max(1, s - 1))}
                    className="h-7 w-7 rounded-lg border border-black/10 flex items-center justify-center text-xs font-bold"
                  >
                    A-
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={fontSizeStep}
                    onChange={(e) => setFontSizeStep(Number(e.target.value))}
                    className="flex-1 accent-amber-700 h-1.5 rounded-lg appearance-none bg-black/10 cursor-pointer"
                  />
                  <button
                    onClick={() => setFontSizeStep((s) => Math.min(7, s + 1))}
                    className="h-7 w-7 rounded-lg border border-black/10 flex items-center justify-center text-xs font-bold"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Font Type */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider opacity-60 block mb-1.5">Font Style</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'serif', label: 'Serif' },
                      { id: 'sans', label: 'Sans' },
                      { id: 'mono', label: 'Mono' }
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      className={`py-1.5 rounded-xl border text-xs font-medium transition ${
                        font === f.id
                          ? 'border-amber-700 bg-amber-500/10 font-bold'
                          : 'border-black/10 hover:bg-black/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Alignment & Width */}
              <div className="flex items-center justify-between pt-2 border-t border-black/10">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsJustified(true)}
                    className={`p-1.5 rounded-lg border ${
                      isJustified ? 'border-amber-700 bg-amber-500/10' : 'border-black/10 hover:bg-black/5'
                    }`}
                    title="Justify text"
                  >
                    <AlignJustify className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setIsJustified(false)}
                    className={`p-1.5 rounded-lg border ${
                      !isJustified ? 'border-amber-700 bg-amber-500/10' : 'border-black/10 hover:bg-black/5'
                    }`}
                    title="Left align text"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono">
                  {(['narrow', 'medium', 'wide'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setPageWidth(w)}
                      className={`px-2 py-0.5 rounded-md border capitalize ${
                        pageWidth === w ? 'border-amber-700 bg-amber-500/10 font-bold' : 'border-black/10'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. TABLE OF CONTENTS DRAWER */}
      <AnimatePresence>
        {showToc && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className={`fixed top-14 left-0 bottom-0 z-50 w-80 border-r p-5 shadow-2xl backdrop-blur-xl overflow-y-auto ${themeStyles.card}`}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-black/10">
              <h3 className="font-serif font-bold text-base flex items-center gap-2">
                <List className="h-4 w-4 text-amber-700" />
                विषय सूची (Chapters)
              </h3>
              <button onClick={() => setShowToc(false)} className="p-1 hover:bg-black/5 rounded-md">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {chapters.map((ch, idx) => (
                <div
                  key={ch.id || idx}
                  onClick={() => {
                    setCurrentPage(ch.pageStart);
                    setShowToc(false);
                    if (readerStageRef.current) {
                      readerStageRef.current.scrollTo({ top: 0, behavior: 'instant' });
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                    activeChapter?.id === ch.id
                      ? 'border-amber-700 bg-amber-500/10 font-bold'
                      : 'border-black/10 hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] opacity-60">Chapter {idx + 1}</span>
                    <span className="font-mono text-[10px] opacity-60">Page {ch.pageStart}</span>
                  </div>
                  <div className="font-medium truncate">{ch.title}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
