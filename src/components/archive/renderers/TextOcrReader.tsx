import React, { useState, useEffect } from 'react';
import { Loader2, Search, AArrowUp, AArrowDown, BookOpen, AlertCircle } from 'lucide-react';

interface TextOcrReaderProps {
  bookIdentifier: string;
  bookTitle?: string;
  currentPage: number;
  totalPages: number;
  readerTheme: 'dark' | 'slate' | 'sepia' | 'light';
  onTextExtracted?: (text: string) => void;
  onErrorFallback?: () => void;
}

export const TextOcrReader: React.FC<TextOcrReaderProps> = ({
  bookIdentifier,
  bookTitle,
  currentPage,
  totalPages,
  readerTheme,
  onTextExtracted,
  onErrorFallback,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const cleanId = encodeURIComponent(bookIdentifier.trim());

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);
    setError(false);

    fetch(`/api/archive/page-text?identifier=${cleanId}&page=${currentPage}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!isSubscribed) return;
        const text = data.text ? data.text.trim() : '';
        setContent(text);
        setLoading(false);
        if (text && onTextExtracted) {
          onTextExtracted(text);
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn('Text transcript error:', err);
        setError(true);
        setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [cleanId, currentPage, onTextExtracted]);

  // Theme Styling
  const themeClasses =
    readerTheme === 'dark'
      ? 'bg-stone-900 text-stone-100 border-stone-800'
      : readerTheme === 'slate'
      ? 'bg-slate-900 text-slate-100 border-slate-800'
      : readerTheme === 'sepia'
      ? 'bg-amber-50 text-stone-900 border-amber-200'
      : 'bg-white text-stone-900 border-stone-200';

  return (
    <div className="relative w-full max-w-3xl mx-auto flex flex-col items-center justify-start min-h-full py-4 px-3 sm:px-6">
      {/* Font Size & Tool Bar */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 bg-black/40 backdrop-blur-md rounded-2xl p-2.5 px-4 text-white text-xs border border-white/10">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-400" />
          <span className="font-serif font-semibold text-stone-200">OCR Text Reader</span>
          <span className="text-[11px] font-mono text-stone-400">• Page {currentPage}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            className="p-1 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            title="Decrease Font Size"
          >
            <AArrowDown className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[11px] text-amber-400">{fontSize}px</span>
          <button
            onClick={() => setFontSize((s) => Math.min(32, s + 2))}
            className="p-1 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            title="Increase Font Size"
          >
            <AArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Reading Sheet */}
      <div
        className={`w-full rounded-2xl border p-6 sm:p-10 shadow-2xl transition-all leading-relaxed font-serif ${themeClasses}`}
        style={{ fontSize: `${fontSize}px`, minHeight: '70vh' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm">Transcribing OCR text for Page {currentPage}...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <p className="text-sm">Raw text could not be extracted for this page.</p>
            {onErrorFallback && (
              <button
                onClick={onErrorFallback}
                className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                View Scanned Facsimile Page
              </button>
            )}
          </div>
        ) : content ? (
          <div className="whitespace-pre-wrap selection:bg-amber-500 selection:text-stone-950">
            {content}
          </div>
        ) : (
          <div className="text-center py-16 text-stone-400 italic">
            No text content on this page (blank or image page).
          </div>
        )}
      </div>
    </div>
  );
};
