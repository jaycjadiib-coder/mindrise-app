import React from 'react';
import { ExternalLink, BookOpen, AlertCircle, RefreshCw, Download } from 'lucide-react';

interface FallbackSourceReaderProps {
  bookIdentifier: string;
  bookTitle?: string;
  creator?: string;
  coverUrl?: string;
  onRetry: () => void;
}

export const FallbackSourceReader: React.FC<FallbackSourceReaderProps> = ({
  bookIdentifier,
  bookTitle,
  creator,
  coverUrl,
  onRetry,
}) => {
  const archiveDetailsUrl = `https://archive.org/details/${encodeURIComponent(bookIdentifier)}`;

  return (
    <div className="max-w-xl mx-auto my-auto p-8 rounded-3xl bg-stone-900/90 border border-white/10 text-white text-center shadow-2xl space-y-6">
      <div className="relative mx-auto w-24 h-32 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-stone-800 flex items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={bookTitle || bookIdentifier}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-10 w-10 text-stone-500" />
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-serif font-bold text-amber-400">
          {bookTitle || bookIdentifier}
        </h3>
        {creator && <p className="text-xs text-stone-400">{creator}</p>}
        <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed pt-2">
          This digital item is hosted on Internet Archive in a custom or external archival container. You can open and read the volume directly on Internet Archive.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-white/10 cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Reader</span>
        </button>

        <a
          href={archiveDetailsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold cursor-pointer transition-all shadow-md"
        >
          <span>Open on Internet Archive</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
