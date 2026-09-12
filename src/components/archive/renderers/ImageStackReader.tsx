import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
} from 'lucide-react';

interface ImageStackReaderProps {
  bookIdentifier: string;
  bookTitle?: string;
  currentPage: number;
  totalPages: number;
  zoom: number; // 50 to 400
  readerTheme: 'dark' | 'slate' | 'sepia' | 'light';
  invertColors: boolean;
  viewMode?: 'single' | 'spread';
  onPageChange: (page: number) => void;
  onErrorFallback?: () => void;
  onTextExtracted?: (text: string) => void;
}

export const ImageStackReader: React.FC<ImageStackReaderProps> = ({
  bookIdentifier,
  bookTitle,
  currentPage,
  totalPages,
  zoom,
  readerTheme,
  invertColors,
  viewMode = 'single',
  onPageChange,
  onErrorFallback,
  onTextExtracted,
}) => {
  const [primaryLoaded, setPrimaryLoaded] = useState<boolean>(false);
  const [primaryError, setPrimaryError] = useState<boolean>(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState<boolean>(false);
  const [secondaryError, setSecondaryError] = useState<boolean>(false);
  const [showOcrOverlay, setShowOcrOverlay] = useState<boolean>(false);
  const [ocrText, setOcrText] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const cleanId = encodeURIComponent(bookIdentifier.trim());

  // High-DPI width based on current zoom level
  const targetWidth = zoom >= 200 ? '1600' : zoom >= 130 ? '1200' : '800';

  // Primary image URL with retry buster when user retries
  const primaryImageUrl = `/api/archive/page-image?identifier=${cleanId}&page=${currentPage}&width=${targetWidth}${retryKey ? `&r=${retryKey}` : ''}`;
  const secondaryPage = currentPage + 1;
  const secondaryImageUrl = `/api/archive/page-image?identifier=${cleanId}&page=${secondaryPage}&width=${targetWidth}${retryKey ? `&r=${retryKey}` : ''}`;

  // Reset load states on page change
  useEffect(() => {
    setPrimaryLoaded(false);
    setPrimaryError(false);
    setSecondaryLoaded(false);
    setSecondaryError(false);
    setOcrText('');
  }, [currentPage, bookIdentifier, retryKey]);

  // Prefetch next 1-2 pages in background for instant responsiveness
  useEffect(() => {
    const prefetchPages = [currentPage + 1, currentPage + 2];
    prefetchPages.forEach((p) => {
      if (p <= totalPages) {
        const img = new Image();
        img.src = `/api/archive/page-image?identifier=${cleanId}&page=${p}&width=1200`;
      }
    });
  }, [currentPage, totalPages, cleanId]);

  // Fetch OCR transcript in background for current page
  const loadOcrText = useCallback(async () => {
    if (ocrText || ocrLoading) return;
    setOcrLoading(true);
    try {
      const res = await fetch(`/api/archive/page-text?identifier=${cleanId}&page=${currentPage}`);
      if (res.ok) {
        const json = await res.json();
        const text = json.text ? json.text.trim() : '';
        setOcrText(text);
        if (onTextExtracted && text) {
          onTextExtracted(text);
        }
      }
    } catch {
      // Ignored
    } finally {
      setOcrLoading(false);
    }
  }, [cleanId, currentPage, ocrText, ocrLoading, onTextExtracted]);

  // Theme styling
  const containerBg =
    readerTheme === 'dark'
      ? 'bg-stone-900/60'
      : readerTheme === 'slate'
      ? 'bg-slate-900/60'
      : readerTheme === 'sepia'
      ? 'bg-amber-100/60'
      : 'bg-stone-100/80';

  const cardBorder =
    readerTheme === 'dark'
      ? 'border-stone-800'
      : readerTheme === 'slate'
      ? 'border-slate-800'
      : readerTheme === 'sepia'
      ? 'border-amber-200'
      : 'border-stone-200';

  // Compute scale width based on zoom percentage
  const baseWidthPx = 760;
  const scaledWidth = baseWidthPx * (zoom / 100);

  return (
    <div className="relative w-fit mx-auto min-h-full py-4 select-none">
      {/* Pages Container */}
      <div className="flex gap-6">
        {/* Primary Page (Left or Single) */}
        <div
          className={`relative rounded-xl border shadow-2xl transition-shadow overflow-hidden flex flex-col items-center ${containerBg} ${cardBorder}`}
          style={{
            width: `${scaledWidth}px`,
            minWidth: `${scaledWidth}px`,
            filter: invertColors ? 'invert(0.92) hue-rotate(180deg) contrast(1.1)' : 'none',
          }}
        >
          {/* Loading Indicator */}
          {!primaryLoaded && !primaryError && (
            <div className="flex flex-col items-center justify-center p-16 bg-stone-950/20 backdrop-blur-xs min-h-[420px] w-full">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
              <p className="text-xs font-serif text-stone-300">
                Loading Scanned Page {currentPage}...
              </p>
            </div>
          )}

          {/* Scanned Facsimile Image (Natural Aspect Ratio & True Scale) */}
          <img
            src={primaryImageUrl}
            alt={`Page ${currentPage} - ${bookTitle || bookIdentifier}`}
            referrerPolicy="no-referrer"
            loading="eager"
            onLoad={() => {
              setPrimaryLoaded(true);
              setPrimaryError(false);
            }}
            onError={() => {
              setPrimaryLoaded(true);
              setPrimaryError(true);
            }}
            className={`w-full h-auto block transition-opacity duration-200 select-none ${
              primaryLoaded ? 'opacity-100' : 'opacity-0 hidden'
            }`}
          />

          {/* Error / Fallback State */}
          {primaryError && (
            <div className="p-8 text-center space-y-3 z-10 my-12">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-xs text-stone-300 font-serif">
                Page image could not be loaded directly from mirror.
              </p>
              <button
                onClick={() => {
                  setPrimaryError(false);
                  setPrimaryLoaded(false);
                  setRetryKey((k) => k + 1);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                Retry Page
              </button>
            </div>
          )}

          {/* Optional OCR Text Overlay */}
          {showOcrOverlay && (
            <div
              className="absolute inset-0 z-20 bg-stone-950/90 text-stone-100 p-6 overflow-y-auto text-sm font-serif leading-relaxed"
              style={{ filter: 'none' }}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <span className="text-xs font-mono text-amber-400">
                  OCR Text • Page {currentPage}
                </span>
                <button
                  onClick={() => setShowOcrOverlay(false)}
                  className="text-xs text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕ Close Text
                </button>
              </div>
              {ocrLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center text-stone-400">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span className="text-xs">Extracting OCR text...</span>
                </div>
              ) : ocrText ? (
                <div className="whitespace-pre-wrap">{ocrText}</div>
              ) : (
                <p className="text-xs text-stone-400 italic">
                  No OCR text found for this page.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Secondary Page (When in Spread / Dual-page Mode) */}
        {viewMode === 'spread' && secondaryPage <= totalPages && (
          <div
            className={`relative rounded-xl border shadow-2xl transition-all overflow-hidden flex flex-col items-center ${containerBg} ${cardBorder}`}
            style={{
              width: `${scaledWidth}px`,
              minWidth: `${scaledWidth}px`,
              filter: invertColors ? 'invert(0.92) hue-rotate(180deg) contrast(1.1)' : 'none',
            }}
          >
            {!secondaryLoaded && !secondaryError && (
              <div className="flex flex-col items-center justify-center p-16 bg-stone-950/20 backdrop-blur-xs min-h-[420px] w-full">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
                <p className="text-xs font-serif text-stone-300">
                  Loading Scanned Page {secondaryPage}...
                </p>
              </div>
            )}

            <img
              src={secondaryImageUrl}
              alt={`Page ${secondaryPage} - ${bookTitle || bookIdentifier}`}
              referrerPolicy="no-referrer"
              loading="eager"
              onLoad={() => {
                setSecondaryLoaded(true);
                setSecondaryError(false);
              }}
              onError={() => {
                setSecondaryLoaded(true);
                setSecondaryError(true);
              }}
              className={`w-full h-auto block transition-opacity duration-200 select-none ${
                secondaryLoaded ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
