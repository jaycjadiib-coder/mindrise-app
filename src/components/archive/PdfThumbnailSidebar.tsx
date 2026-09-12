import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { X, Layers, ChevronRight, Bookmark } from 'lucide-react';

interface PdfThumbnailSidebarProps {
  pdfUrl: string;
  totalPages: number;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: number) => void;
  outline?: any[];
  readerTheme: 'dark' | 'slate' | 'sepia' | 'light';
}

export const PdfThumbnailSidebar: React.FC<PdfThumbnailSidebarProps> = ({
  pdfUrl,
  totalPages,
  currentPage,
  isOpen,
  onClose,
  onSelectPage,
  outline,
  readerTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'outline'>('thumbnails');
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    let isMounted = true;
    pdfjsLib.getDocument({ url: pdfUrl }).promise.then((doc) => {
      if (isMounted) {
        setPdfDoc(doc);
      }
    }).catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfUrl]);

  if (!isOpen) return null;

  const bgStyle =
    readerTheme === 'dark'
      ? 'bg-[#12151A] text-stone-200 border-white/10'
      : readerTheme === 'slate'
      ? 'bg-[#181B20] text-stone-200 border-stone-700'
      : readerTheme === 'sepia'
      ? 'bg-[#E8DEC5] text-[#2C2416] border-[#D9CDAD]'
      : 'bg-[#F0ECE1] text-stone-900 border-[#E2DDD0]';

  return (
    <div
      className={`fixed top-14 bottom-12 left-0 w-72 sm:w-80 border-r z-40 flex flex-col shadow-2xl backdrop-blur-md ${bgStyle} animate-in slide-in-from-left duration-200`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('thumbnails')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'thumbnails'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            पृष्ठ पूर्वावलोकन (Pages)
          </button>
          {outline && outline.length > 0 && (
            <button
              onClick={() => setActiveTab('outline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'outline'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              विषय-सूची (TOC)
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          title="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'thumbnails' ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <ThumbnailItem
                key={pageNum}
                pageNum={pageNum}
                isCurrent={pageNum === currentPage}
                pdfDoc={pdfDoc}
                onSelect={() => {
                  onSelectPage(pageNum);
                  onClose();
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {outline && outline.length > 0 ? (
              outline.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg text-xs hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    // Navigate to destination if resolvable
                    onClose();
                  }}
                >
                  <span className="truncate">{item.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40 shrink-0" />
                </div>
              ))
            ) : (
              <div className="text-xs opacity-60 p-4 text-center">विषय सूची उपलब्ध नहीं है</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ThumbnailItem: React.FC<{
  pageNum: number;
  isCurrent: boolean;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  onSelect: () => void;
}> = ({ pageNum, isCurrent, pdfDoc, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || rendered) return;

    let isSubscribed = true;
    pdfDoc.getPage(pageNum).then((page) => {
      if (!isSubscribed || !canvasRef.current) return;
      const viewport = page.getViewport({ scale: 0.22 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        page.render({ canvasContext: ctx, canvas: canvas, viewport }).promise.then(() => {
          if (isSubscribed) setRendered(true);
        }).catch(() => {});
      }
    }).catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [pdfDoc, pageNum, rendered]);

  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
        isCurrent
          ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-amber-500/50'
      }`}
    >
      <div className="w-full aspect-[3/4] bg-stone-200 dark:bg-stone-800 rounded-lg overflow-hidden flex items-center justify-center relative">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {!rendered && (
          <span className="text-[10px] font-mono opacity-40 font-semibold">{pageNum}</span>
        )}
      </div>
      <span
        className={`mt-1 text-[11px] font-mono font-semibold ${
          isCurrent ? 'text-amber-500 font-bold' : 'opacity-70 group-hover:opacity-100'
        }`}
      >
        पेज {pageNum}
      </span>
    </button>
  );
};
