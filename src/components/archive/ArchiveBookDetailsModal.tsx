import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Share2,
  Check,
  Calendar,
  Layers,
  FileText,
  Globe,
  Lock,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ArchiveItemMetadata } from '../../types/archive';
import { getArchiveItemMetadata, getLanguageName, getArchiveCoverUrl } from '../../services/internetArchiveService';

export const ArchiveBookDetailsModal: React.FC = () => {
  const {
    activeArchiveBookId,
    closeArchiveBookDetails,
    openArchiveReader,
    archiveLibrary,
    addArchiveToLibrary,
    removeArchiveFromLibrary,
    archiveProgress
  } = useData();

  const { theme } = useTheme();

  const [metadata, setMetadata] = useState<ArchiveItemMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const stopAudio = React.useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, []);

  // Close on Escape key & cleanup audio on unmount/close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopAudio();
        closeArchiveBookDetails();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      stopAudio();
    };
  }, [closeArchiveBookDetails, stopAudio]);

  // Fetch metadata on demand when activeArchiveBookId changes
  useEffect(() => {
    if (!activeArchiveBookId) {
      setMetadata(null);
      setError(null);
      stopAudio();
      return;
    }

    let isSubscribed = true;
    setLoading(true);
    setError(null);

    getArchiveItemMetadata(activeArchiveBookId)
      .then((data) => {
        if (isSubscribed) {
          setMetadata(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Error loading metadata for modal:', err);
          setError(err.message || 'Could not fetch book details from Internet Archive.');
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeArchiveBookId, stopAudio]);

  if (!activeArchiveBookId) return null;

  const isSaved = Boolean(archiveLibrary[activeArchiveBookId]);
  const prog = archiveProgress[activeArchiveBookId];

  const handleToggleListen = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !metadata) return;

    if (isPlayingAudio) {
      stopAudio();
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${metadata.title}। लेखक: ${metadata.creator}। ${metadata.description || 'पुस्तक विवरण लोड हो रहा है।'}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = metadata.language.includes('hin') ? 'hi-IN' : 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleLibrary = () => {
    if (!metadata) return;
    if (isSaved) {
      removeArchiveFromLibrary(metadata.identifier);
    } else {
      addArchiveToLibrary({
        identifier: metadata.identifier,
        title: metadata.title,
        creator: metadata.creator,
        coverUrl: getArchiveCoverUrl(metadata.identifier),
        language: metadata.language,
        shelf: 'currently-reading',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleReadNow = () => {
    if (!metadata) return;
    stopAudio();
    closeArchiveBookDetails();
    openArchiveReader({
      identifier: metadata.identifier,
      title: metadata.title,
      creator: metadata.creator,
      coverUrl: getArchiveCoverUrl(metadata.identifier),
    });
  };

  const getModalContainerClasses = () => {
    if (theme === 'paper') return 'border-[#D8D4CA] bg-[#FAF8F5] text-[#1A1A1A]';
    if (theme === 'white') return 'border-gray-200 bg-white text-gray-900';
    if (theme === 'sepia') return 'border-[#E2D7BE] bg-[#F4ECD8] text-[#2C2416]';
    return 'border-slate-800 bg-[#0F172A] text-slate-100';
  };

  const getCardClasses = () => {
    if (theme === 'paper') return 'border-[#E5E2DA] bg-white text-[#1A1A1A]';
    if (theme === 'white') return 'border-gray-200 bg-gray-50 text-gray-900';
    if (theme === 'sepia') return 'border-[#E2D7BE] bg-[#EFE4CC] text-[#2C2416]';
    return 'border-slate-800 bg-slate-900 text-slate-100';
  };

  return (
    <div
      onClick={() => {
        stopAudio();
        closeArchiveBookDetails();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs cursor-pointer animate-in fade-in duration-150 font-sans"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border ${getModalContainerClasses()} shadow-2xl cursor-default animate-in zoom-in-95 duration-150`}
      >
        {/* Header with Close & Actions */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300">
              <Globe className="h-4 w-4" />
            </span>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Internet Archive Record
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 text-xs font-medium opacity-80 hover:opacity-100 transition-all"
              title="Share book link"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => {
                stopAudio();
                closeArchiveBookDetails();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 dark:border-white/10 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <div className="font-serif text-sm font-semibold">
                Fetching official Archive metadata...
              </div>
              <p className="text-xs opacity-60">
                Calling https://archive.org/metadata/{activeArchiveBookId}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-6 text-center space-y-3">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <div className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
                Metadata Unavailable
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 max-w-md mx-auto">
                {error}
              </p>
            </div>
          )}

          {metadata && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                {/* Book Cover Image */}
                <div className="sm:col-span-4">
                  <div className="relative aspect-2/3 w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/40 shadow-md">
                    <img
                      src={getArchiveCoverUrl(metadata.identifier)}
                      alt={metadata.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.details-cover-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="details-cover-fallback absolute inset-0 hidden flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-stone-900 to-amber-950 text-amber-100">
                      <BookOpen className="h-10 w-10 text-amber-400 opacity-60 mb-2" />
                      <div className="font-serif text-sm font-bold line-clamp-4 leading-snug">
                        {metadata.title}
                      </div>
                      <div className="mt-2 text-xs opacity-70">
                        {metadata.creator}
                      </div>
                    </div>
                  </div>

                  {/* Reading Status if currently in progress */}
                  {prog && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1">
                      <div className="font-semibold text-amber-800 dark:text-amber-300">
                        Your Reading Progress
                      </div>
                      <div className="flex justify-between text-[11px] opacity-80">
                        <span>Page {prog.currentPage} of {prog.totalPages || '?'}</span>
                        <span>{prog.progressPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${prog.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata Details */}
                <div className="sm:col-span-8 space-y-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold leading-tight">
                      {metadata.title}
                    </h2>
                    <p className="mt-1 text-sm font-medium opacity-80">
                      By <strong>{metadata.creator}</strong>
                    </p>
                  </div>

                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1 font-medium">
                      {getLanguageName(metadata.language)}
                    </span>

                    {metadata.year && (
                      <span className="flex items-center gap-1 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1">
                        <Calendar className="h-3 w-3 opacity-60" />
                        <span>Published: {metadata.year}</span>
                      </span>
                    )}

                    {metadata.isRestricted ? (
                      <span className="flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/60 px-2.5 py-1 text-rose-700 dark:text-rose-300 font-medium">
                        <Lock className="h-3 w-3" />
                        <span>Borrow Only / Restricted</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/60 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 font-medium">
                        <BookOpen className="h-3 w-3" />
                        <span>Public Reading Permitted</span>
                      </span>
                    )}
                  </div>

                  {/* Primary & Secondary Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleReadNow}
                      className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] dark:bg-amber-500 px-5 py-3 text-sm font-bold text-white dark:text-black hover:opacity-90 transition-all shadow-md"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>{prog ? 'RESUME READING' : 'READ BOOK'}</span>
                    </button>

                    <button
                      onClick={handleToggleLibrary}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        isSaved
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300'
                          : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      <span>{isSaved ? 'In Library' : 'Add to Library'}</span>
                    </button>

                    <button
                      onClick={handleToggleListen}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        isPlayingAudio
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 animate-pulse'
                          : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10'
                      }`}
                      title="Listen via Text-To-Speech"
                    >
                      {isPlayingAudio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      <span>{isPlayingAudio ? 'Stop Audio' : 'Listen'}</span>
                    </button>
                  </div>

                  {/* Summary / Description */}
                  <div className="pt-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider opacity-60">
                      Summary & Catalog Record
                    </h4>
                    <p className="mt-1.5 text-xs opacity-80 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                      {metadata.description || 'No descriptive record provided for this publication on the Archive catalog.'}
                    </p>
                  </div>

                  {/* Subjects / Tags */}
                  {Array.isArray(metadata.subjects) && metadata.subjects.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider opacity-60 mb-1.5">
                        Subjects & Classifications
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {metadata.subjects.map((sub, i) => (
                          <span
                            key={i}
                            className="rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[11px] opacity-75"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Reading Resource Format */}
                  <div className={`rounded-xl border ${getCardClasses()} p-3 space-y-1.5 text-xs`}>
                    <div className="font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-amber-600" />
                        <span>Detected Reading Resource</span>
                      </span>
                      <span className="text-[11px] opacity-60 font-mono">
                        {metadata.readableResource?.fileName || 'None'}
                      </span>
                    </div>

                    {metadata.readableResource ? (
                      <p className="text-[11px] opacity-70">
                        Format: <strong>{metadata.readableResource.formatName}</strong>
                        {metadata.readableResource.size && (
                          <span> • Size: {(metadata.readableResource.size / 1024 / 1024).toFixed(1)} MB</span>
                        )}
                        <span> • Streamed directly in native MindRise in-app reader.</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        {metadata.isRestricted
                          ? 'This document is borrow-only on archive.org. In-app streaming is restricted.'
                          : 'No standard PDF or EPUB resource identified in this item catalog.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Transparency Notice */}
              <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 p-3 text-[11px] opacity-60 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Internet Archive Identifier:</strong> <code className="font-mono">{metadata.identifier}</code>.
                  MindRise accesses this item via Internet Archive's public APIs. No copyright claimed.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
