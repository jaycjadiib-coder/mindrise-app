import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Clock,
  BookOpen,
  Bookmark,
  Share2,
  Check,
  Plus,
  Play,
  Pause,
  Square,
  Sparkles,
  ArrowRight,
  Headphones,
  Volume2,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

export const BookDetailsModal: React.FC = () => {
  const {
    activeBookDetailsId,
    closeBookDetails,
    books,
    library,
    addToLibrary,
    removeFromLibrary,
    readingProgress,
    openReader
  } = useData();

  const { theme } = useTheme();

  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.25 | 1.5>(1.0);

  const book = books.find((b) => b.id === activeBookDetailsId);

  const stopAudio = React.useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, []);

  // Close on Escape key & cleanup on unmount
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopAudio();
        closeBookDetails();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      stopAudio();
    };
  }, [closeBookDetails, stopAudio]);

  if (!activeBookDetailsId || !book) return null;

  const libraryItem = library[book.id];
  const prog = readingProgress[book.id];

  // Audio Playback handler using Web Speech Synthesis
  const handleToggleListen = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const chapterText = book.chapters?.[0]?.content || book.description;
      const textToRead = `${book.title}। लेखक: ${book.author}। ${book.description}। ${chapterText}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'hi-IN';
      utterance.rate = audioSpeed;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleChangeSpeed = (newSpeed: 1 | 1.25 | 1.5) => {
    setAudioSpeed(newSpeed);
    if (isPlayingAudio) {
      stopAudio();
      setTimeout(() => {
        handleToggleListen();
      }, 100);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReadNow = (chapterPage?: number) => {
    stopAudio();
    closeBookDetails();
    openReader(book.id);
  };

  const getModalContainerClasses = () => {
    if (theme === 'paper') {
      return 'border-[#D8D4CA] bg-[#FAF8F5] text-[#1A1A1A]';
    }
    if (theme === 'white') {
      return 'border-gray-200 bg-white text-gray-900';
    }
    if (theme === 'sepia') {
      return 'border-[#E2D7BE] bg-[#F4ECD8] text-[#2C2416]';
    }
    return 'border-slate-800 bg-[#0F172A] text-slate-100';
  };

  const getCardClasses = () => {
    if (theme === 'paper') {
      return 'border-[#E5E2DA] bg-white text-[#1A1A1A]';
    }
    if (theme === 'white') {
      return 'border-gray-200 bg-gray-50 text-gray-900';
    }
    if (theme === 'sepia') {
      return 'border-[#E2D7BE] bg-[#EFE4CC] text-[#2C2416]';
    }
    return 'border-slate-800 bg-slate-900 text-slate-100';
  };

  return (
    <div
      onClick={() => {
        stopAudio();
        closeBookDetails();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs cursor-pointer font-sans"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border ${getModalContainerClasses()} shadow-2xl animate-in fade-in zoom-in-95 duration-200 cursor-default`}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            stopAudio();
            closeBookDetails();
          }}
          className="absolute top-4 right-4 z-30 rounded-full p-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
          aria-label="Close book details"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Main Book Presentation: Cover & Meta */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Book Cover */}
            <div className="relative shrink-0 overflow-hidden rounded-2xl border border-black/10 shadow-md w-36 sm:w-44 aspect-2/3 bg-[#EAE6DF]">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 left-2 rounded-md bg-black/75 backdrop-blur-xs px-2 py-0.5 text-[9px] font-mono text-white">
                {book.category}
              </div>
            </div>

            {/* Book Info Column */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-900 border border-amber-500/20">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <strong className="font-mono">{book.rating}</strong>
                  <span className="opacity-60 font-mono">({book.ratingCount.toLocaleString()} reviews)</span>
                </span>
                <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-0.5 text-xs font-mono opacity-80">
                  {book.language}
                </span>
              </div>

              <h1 className="mt-2.5 font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                {book.title}
              </h1>
              <p className="mt-1 text-xs opacity-75">
                Written by <strong className="opacity-100">{book.author}</strong>
              </p>

              {/* Stats Bar */}
              <div className="mt-4 grid grid-cols-4 gap-2 border-y border-black/10 dark:border-white/10 py-2.5 text-xs text-center sm:text-left font-mono opacity-80">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider opacity-60">Pages</span>
                  <span className="font-semibold">{book.pages}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider opacity-60">Est. Time</span>
                  <span className="font-semibold">{Math.round(book.estimatedReadingTime / 60)}h</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider opacity-60">Chapters</span>
                  <span className="font-semibold">{book.chapters?.length || 1}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider opacity-60">Scholars</span>
                  <span className="font-semibold">{book.readCount.toLocaleString()}</span>
                </div>
              </div>

              {/* Reading Progress bar if started */}
              {prog && (
                <div className={`mt-3.5 rounded-xl border ${getCardClasses()} p-2.5`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-70">Your Reading Progress</span>
                    <span className="font-semibold text-amber-800 font-mono">{prog.percentage}% Complete</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-amber-700 rounded-full"
                      style={{ width: `${prog.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons: READ BOOK & LISTEN BOOK */}
              <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {/* 1. READ BOOK BUTTON */}
                <button
                  onClick={() => handleReadNow()}
                  className="group flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-5 py-2.5 text-xs font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#333] active:scale-95 transition-all"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{prog ? 'Continue Reading' : 'Read Book'}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* 2. LISTEN BOOK BUTTON */}
                <button
                  onClick={handleToggleListen}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                    isPlayingAudio
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'border-[#D8D4CA] bg-white text-[#1A1A1A] hover:bg-[#F2EFE9]'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <Square className="h-3.5 w-3.5 fill-white" />
                      <span>Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Headphones className="h-3.5 w-3.5 text-amber-700" />
                      <span>Listen Chapter</span>
                    </>
                  )}
                </button>

                {/* Library Toggle */}
                {libraryItem ? (
                  <button
                    onClick={() => removeFromLibrary(book.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-xs font-medium text-emerald-800"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>In Library</span>
                  </button>
                ) : (
                  <button
                    onClick={() => addToLibrary(book.id, 'currently-reading')}
                    className="flex items-center gap-1.5 rounded-xl border border-[#D8D4CA] bg-white px-3.5 py-2.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#F2EFE9]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save to Shelf</span>
                  </button>
                )}

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="rounded-xl border border-[#D8D4CA] bg-white p-2.5 text-[#555] hover:text-[#1A1A1A] transition"
                  title="Share book link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Audio Narration Bar */}
          {isPlayingAudio && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-amber-700 flex items-center justify-center text-white">
                    <Volume2 className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Audio Narration Playing</h4>
                    <p className="text-[11px] opacity-75 truncate max-w-xs">{book.title}</p>
                  </div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-white/60 dark:bg-black/40 px-2 py-1 rounded-xl border border-black/10 text-xs font-mono">
                  <span className="text-[10px] opacity-60">Speed:</span>
                  {([1, 1.25, 1.5] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleChangeSpeed(spd)}
                      className={`px-1.5 py-0.5 rounded-md transition ${
                        audioSpeed === spd
                          ? 'bg-amber-700 text-white font-bold'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Book Synopsis & Intro */}
          <div className={`rounded-2xl border ${getCardClasses()} p-5 space-y-3`}>
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2.5">
              <h3 className="font-serif text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-700" />
                Book Overview & Core Philosophy
              </h3>
              <span className="text-[11px] font-mono opacity-60">{book.tags?.join(' • ') || book.category}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-85">
              {book.description}
            </p>
            {book.authorBio && (
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 text-xs opacity-80">
                <strong className="block mb-0.5">About {book.author}:</strong>
                {book.authorBio}
              </div>
            )}
          </div>

          {/* Chapters Breakdown */}
          {book.chapters && book.chapters.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-bold">
                  Included Chapters ({book.chapters.length})
                </h3>
                <span className="text-[11px] font-mono opacity-60">Complete Full-Text</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {book.chapters.map((ch, idx) => (
                  <div
                    key={ch.id || idx}
                    onClick={() => handleReadNow(ch.pageStart)}
                    className={`group cursor-pointer flex items-center justify-between rounded-xl border ${getCardClasses()} p-3 text-xs hover:border-[#1A1A1A] transition shadow-2xs`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 font-mono text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <span className="truncate font-medium">{ch.title}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
