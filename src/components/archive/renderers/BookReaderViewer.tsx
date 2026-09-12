import React, { useState } from 'react';
import { Loader2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { getArchiveEmbedUrl } from '../../../services/internetArchiveService';

interface BookReaderViewerProps {
  bookIdentifier: string;
  currentPage: number;
  readerTheme: 'dark' | 'slate' | 'sepia' | 'light';
  onPageChange?: (page: number) => void;
  onErrorFallback?: () => void;
}

export const BookReaderViewer: React.FC<BookReaderViewerProps> = ({
  bookIdentifier,
  currentPage,
  readerTheme,
  onErrorFallback,
}) => {
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [iframeError, setIframeError] = useState<boolean>(false);

  const embedUrl = getArchiveEmbedUrl(bookIdentifier, currentPage);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Loading Overlay */}
      {!iframeLoaded && !iframeError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/60 backdrop-blur-xs text-white">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-serif">Connecting to Internet Archive BookReader...</p>
          <span className="text-xs text-stone-400 mt-1 font-mono">Loading dual-page flipbook layout</span>
        </div>
      )}

      {/* Embedded BookReader Iframe */}
      <div className="w-full max-w-6xl h-[78vh] sm:h-[82vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
        <iframe
          src={embedUrl}
          title={`BookReader - ${bookIdentifier}`}
          className="w-full h-full border-0"
          allowFullScreen
          onLoad={() => setIframeLoaded(true)}
          onError={() => {
            setIframeError(true);
            onErrorFallback?.();
          }}
        />
      </div>

      {/* Fallback Notice */}
      {iframeError && (
        <div className="p-6 text-center space-y-3 z-30">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="text-xs text-stone-300">BookReader frame could not be initialized directly.</p>
          <button
            onClick={() => onErrorFallback?.()}
            className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
          >
            Switch to High-Resolution Scanned Pages
          </button>
        </div>
      )}
    </div>
  );
};
