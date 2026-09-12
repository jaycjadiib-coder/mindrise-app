import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  BookOpen,
  FileText,
  AArrowUp,
  AArrowDown,
  Layers
} from 'lucide-react';
import {
  reconstructPdfPageText,
  splitIntoSmartSentences,
  detectTextLanguage,
  ExtractedPageData
} from '../../utils/smartTextExtractor';

// Configure PDF.js worker and verbosity
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }

  try {
    if ((pdfjsLib as any).VerbosityLevel) {
      (pdfjsLib as any).verbosity = (pdfjsLib as any).VerbosityLevel.ERRORS;
    }
  } catch {}
}

export interface PdfViewerHandle {
  extractCurrentPageText: () => Promise<string>;
  extractCurrentPageDetails: (pageNum?: number) => Promise<ExtractedPageData>;
  searchInDocument: (query: string) => Promise<number[]>;
  goToPage: (page: number) => void;
  toggleFacsimileMode: () => void;
  setDisplayMode: (mode: 'scan' | 'text' | 'pdf' | 'embed') => void;
}

interface PdfDocumentViewerProps {
  pdfUrl: string;
  bookIdentifier?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDocumentLoaded: (totalPages: number, outline?: any[]) => void;
  zoom: number; // Percentage, e.g. 100, 150, 200, 300
  readerTheme: 'dark' | 'slate' | 'sepia' | 'light';
  invertColors: boolean;
  viewMode?: 'single' | 'spread' | 'continuous';
  format?: 'pdf' | 'scan' | 'embed' | 'text';
  onFormatChange?: (mode: 'pdf' | 'scan' | 'embed' | 'text') => void;
  onPdfError?: (error: any) => void;
  onTextExtracted?: (text: string) => void;
  onLoadingStateChange?: (loading: boolean) => void;
}

export const PdfDocumentViewer = forwardRef<PdfViewerHandle, PdfDocumentViewerProps>(
  (
    {
      pdfUrl,
      bookIdentifier,
      currentPage,
      onPageChange,
      onDocumentLoaded,
      zoom,
      readerTheme,
      invertColors,
      viewMode = 'single',
      format,
      onFormatChange,
      onPdfError,
      onTextExtracted,
      onLoadingStateChange,
    },
    ref
  ) => {
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [docLoading, setDocLoading] = useState<boolean>(false);
    const [pageRendering, setPageRendering] = useState<boolean>(false);
    const [docError, setDocError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);

    // Reader Engine Mode: 'pdf' | 'scan' | 'embed' | 'text'
    const [internalDisplayMode, setInternalDisplayMode] = useState<'scan' | 'text' | 'pdf' | 'embed'>('pdf');
    const displayMode = format || internalDisplayMode;

    const [facsimileImgLoaded, setFacsimileImgLoaded] = useState<boolean>(false);
    const [facsimileImgFailed, setFacsimileImgFailed] = useState<boolean>(false);
    const [textPageContent, setTextPageContent] = useState<string>('');
    const [textPageLoading, setTextPageLoading] = useState<boolean>(false);
    const [fontSizeScale, setFontSizeScale] = useState<number>(100);

    // Zoom and Layout State
    const [debouncedZoom, setDebouncedZoom] = useState(zoom);
    const [baseDimensions, setBaseDimensions] = useState<{width: number, height: number} | null>(null);
    const [secondaryBaseDimensions, setSecondaryBaseDimensions] = useState<{width: number, height: number} | null>(null);

    // Debounce zoom for rendering so continuous scrolling/pinching doesn't reload the canvas
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedZoom(zoom);
      }, 150);
      return () => clearTimeout(timer);
    }, [zoom]);

    const setDisplayModeState = useCallback((mode: 'scan' | 'text' | 'pdf' | 'embed') => {
      setInternalDisplayMode(mode);
      onFormatChange?.(mode);
    }, [onFormatChange]);

    // Resolve book identifier from prop or pdfUrl
    const effectiveIdentifier = React.useMemo(() => {
      if (bookIdentifier) return bookIdentifier.trim();
      if (!pdfUrl) return '';
      const match = pdfUrl.match(/\/(?:pdf|metadata|download)\/([^/?#]+)/i);
      return match ? decodeURIComponent(match[1]) : '';
    }, [bookIdentifier, pdfUrl]);

    // Reset image states on page change
    useEffect(() => {
      setFacsimileImgLoaded(false);
      setFacsimileImgFailed(false);
    }, [currentPage, effectiveIdentifier]);

    // Canvas & Container Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const secondaryCanvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const secondaryTextLayerRef = useRef<HTMLDivElement>(null);
    const currentRenderTaskRef = useRef<any>(null);
    const secondaryRenderTaskRef = useRef<any>(null);
    const pendingRenderPromisesRef = useRef<Map<HTMLCanvasElement, Promise<void>>>(new Map());

    // Text content and parsed details cache per page
    const pageTextCacheRef = useRef<Map<number, string>>(new Map());
    const pageDetailsCacheRef = useRef<Map<number, ExtractedPageData>>(new Map());

    // Fetch page transcript text from server endpoint
    const fetchPageTranscript = useCallback(async (pageNum: number): Promise<string> => {
      if (pageTextCacheRef.current.has(pageNum)) {
        return pageTextCacheRef.current.get(pageNum) || '';
      }
      if (!effectiveIdentifier) return '';

      try {
        const res = await fetch(`/api/archive/page-text?identifier=${encodeURIComponent(effectiveIdentifier)}&page=${pageNum}`);
        if (res.ok) {
          const json = await res.json();
          if (json.text) {
            const cleanText = json.text.trim();
            pageTextCacheRef.current.set(pageNum, cleanText);
            return cleanText;
          }
        }
      } catch (err) {
        console.warn('Transcript fetch notice:', err);
      }
      return '';
    }, [effectiveIdentifier]);

    // Fetch and sync clean text when in Text Mode
    useEffect(() => {
      if (displayMode !== 'text') return;
      let isMounted = true;
      setTextPageLoading(true);

      fetchPageTranscript(currentPage).then((text) => {
        if (!isMounted) return;
        setTextPageContent(text || `पृष्ठ ${currentPage} का पाठ्य लोड किया जा रहा है...`);
        setTextPageLoading(false);
        if (onTextExtracted) {
          onTextExtracted(text);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [displayMode, currentPage, fetchPageTranscript, onTextExtracted]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      extractCurrentPageText: async () => {
        if (pageTextCacheRef.current.has(currentPage)) {
          return pageTextCacheRef.current.get(currentPage) || '';
        }
        if (pdfDoc && displayMode === 'pdf') {
          try {
            const page = await pdfDoc.getPage(currentPage);
            const textContent = await page.getTextContent();
            const reconstructed = reconstructPdfPageText(textContent);
            if (reconstructed && reconstructed.length > 10) {
              pageTextCacheRef.current.set(currentPage, reconstructed);
              return reconstructed;
            }
          } catch (e) {
            console.warn('PDF vector text extraction notice:', e);
          }
        }
        return await fetchPageTranscript(currentPage);
      },
      extractCurrentPageDetails: async (targetPage?: number) => {
        const pageNum = targetPage || currentPage;

        if (pageDetailsCacheRef.current.has(pageNum)) {
          return pageDetailsCacheRef.current.get(pageNum)!;
        }

        let reconstructed = '';
        if (pdfDoc && displayMode === 'pdf') {
          try {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            reconstructed = reconstructPdfPageText(textContent);
          } catch (err) {
            console.warn('extractCurrentPageDetails notice:', err);
          }
        }

        if (!reconstructed || reconstructed.length < 10) {
          reconstructed = await fetchPageTranscript(pageNum);
        }

        const sentences = splitIntoSmartSentences(reconstructed);
        const language = detectTextLanguage(reconstructed);
        const paragraphs = reconstructed.split('\n\n').filter(Boolean);
        const wordCount = reconstructed.split(/\s+/).filter(Boolean).length;

        const data: ExtractedPageData = {
          fullText: reconstructed,
          sentences,
          paragraphs,
          language,
          wordCount,
          source: displayMode === 'pdf' ? 'pdf-vector' : 'ocr-stream',
          confidence: reconstructed.length > 50 ? 0.95 : reconstructed.length > 10 ? 0.7 : 0.2,
        };

        pageTextCacheRef.current.set(pageNum, reconstructed);
        pageDetailsCacheRef.current.set(pageNum, data);
        return data;
      },
      searchInDocument: async (query: string) => {
        if (!query.trim()) return [];
        const cleanQ = query.trim().toLowerCase();
        const matches: number[] = [];
        const total = pdfDoc ? pdfDoc.numPages : 300;

        for (let p = 1; p <= total; p++) {
          let text = pageTextCacheRef.current.get(p);
          if (!text) {
            text = (await fetchPageTranscript(p)).toLowerCase();
          }
          if (text && text.includes(cleanQ)) {
            matches.push(p);
          }
        }
        return matches;
      },
      goToPage: (p: number) => {
        if (p >= 1) {
          onPageChange(p);
        }
      },
      toggleFacsimileMode: () => {
        const next = displayMode === 'scan' ? 'pdf' : 'scan';
        setDisplayModeState(next);
      },
      setDisplayMode: (mode: 'scan' | 'text' | 'pdf' | 'embed') => {
        setDisplayModeState(mode);
      },
    }));

    // Lazy Load Vector PDF only when user explicitly switches to 'pdf' mode
    useEffect(() => {
      if (displayMode !== 'pdf' || !pdfUrl) return;

      let isCancelled = false;
      setDocLoading(true);
      onLoadingStateChange?.(true);
      setDocError(null);

      const loadDocument = async () => {
        try {
          const loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/standard_fonts/`,
            enableXfa: true,
            verbosity: 0,
          });

          const doc = await loadingTask.promise;
          if (isCancelled) return;

          setPdfDoc(doc);
          setDocLoading(false);
          onLoadingStateChange?.(false);

          let outline: any[] = [];
          try {
            outline = (await doc.getOutline()) || [];
          } catch {
            // Outline optional
          }

          onDocumentLoaded(doc.numPages, outline);
        } catch (err: any) {
          if (isCancelled) return;
          console.warn('PDF vector load notice (displaying high-res scanned facsimile mode):', err?.message || err);

          setDocLoading(false);
          onLoadingStateChange?.(false);
          if (onPdfError) {
            onPdfError(err);
          } else {
            // Gracefully show High-Res Scanned facsimile mode so book remains readable without crashing to text
            setDisplayModeState('scan');
          }
        }
      };

      loadDocument();

      return () => {
        isCancelled = true;
      };
    }, [displayMode, pdfUrl, retryCount, onDocumentLoaded, onLoadingStateChange]);

    // Render Vector PDF Canvas
    const renderPageToCanvas = useCallback(
      async (
        pageNum: number,
        canvas: HTMLCanvasElement | null,
        textContainer: HTMLDivElement | null,
        renderTaskRef: React.MutableRefObject<any>
      ) => {
        if (!pdfDoc || !canvas || pageNum < 1 || pageNum > pdfDoc.numPages || displayMode !== 'pdf') return;

        try {
          if (renderTaskRef.current) {
            try {
              renderTaskRef.current.cancel();
            } catch {}
            renderTaskRef.current = null;
          }

          const activePromise = pendingRenderPromisesRef.current.get(canvas);
          if (activePromise) {
            try {
              await activePromise;
            } catch {}
          }

          const page = await pdfDoc.getPage(pageNum);

          // Get base unscaled viewport for layout sizing (at scale 1.0)
          const baseViewport = page.getViewport({ scale: 1.0 });
          if (canvas === canvasRef.current) {
             setBaseDimensions({ width: baseViewport.width, height: baseViewport.height });
          } else if (canvas === secondaryCanvasRef.current) {
             setSecondaryBaseDimensions({ width: baseViewport.width, height: baseViewport.height });
          }

          const baseRenderScale = 1.4;
          const targetScale = (debouncedZoom / 100) * baseRenderScale;
          const viewport = page.getViewport({ scale: targetScale });

          const dpr = Math.max(1, window.devicePixelRatio || 1);

          let oldBuffer: HTMLCanvasElement | null = null;
          if (canvas.width > 0 && canvas.height > 0) {
            oldBuffer = document.createElement('canvas');
            oldBuffer.width = canvas.width;
            oldBuffer.height = canvas.height;
            oldBuffer.getContext('2d')?.drawImage(canvas, 0, 0);
          }

          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);

          // Let CSS handle layout dimensions natively for smooth zooming
          canvas.style.width = '100%';
          canvas.style.height = 'auto';

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) return;

          if (oldBuffer) {
            ctx.drawImage(oldBuffer, 0, 0, canvas.width, canvas.height);
          }

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const renderContext = {
            canvasContext: ctx,
            canvas: canvas,
            viewport: viewport,
            intent: 'display',
          };

          const task = page.render(renderContext);
          renderTaskRef.current = task;

          const executeTask = async () => {
            try {
              await task.promise;
            } catch (renderErr: any) {
              if (
                renderErr?.name !== 'RenderingCancelledException' &&
                !String(renderErr?.message || '').toLowerCase().includes('cancelled')
              ) {
                console.warn('PDF Page render notice:', renderErr?.message || renderErr);
              }
            } finally {
              if (renderTaskRef.current === task) {
                renderTaskRef.current = null;
              }
            }
          };

          const taskPromise = executeTask();
          pendingRenderPromisesRef.current.set(canvas, taskPromise);
          await taskPromise;

          if (textContainer) {
            textContainer.innerHTML = '';
            textContainer.style.width = '100%';
            textContainer.style.height = '100%';

            try {
              const textContent = await page.getTextContent();
              const extracted = reconstructPdfPageText(textContent);
              pageTextCacheRef.current.set(pageNum, extracted);
              if (pageNum === currentPage && onTextExtracted) {
                onTextExtracted(extracted);
              }

              const textLayer = new pdfjsLib.TextLayer({
                textContentSource: textContent,
                container: textContainer,
                viewport: viewport,
              });
              await textLayer.render();
            } catch (tlErr) {
              console.warn('PDF TextLayer render notice:', tlErr);
            }
          }
        } catch (err: any) {
          if (
            err?.name !== 'RenderingCancelledException' &&
            !String(err?.message || '').toLowerCase().includes('cancelled')
          ) {
            console.warn('PDF Page render error:', err);
          }
        }
      },
      [pdfDoc, debouncedZoom, currentPage, onTextExtracted, displayMode]
    );

    // Trigger PDF canvas render when in PDF mode
    useEffect(() => {
      if (!pdfDoc || displayMode !== 'pdf') return;

      let isSubscribed = true;
      setPageRendering(true);

      const doRender = async () => {
        await renderPageToCanvas(currentPage, canvasRef.current, textLayerRef.current, currentRenderTaskRef);

        if (viewMode === 'spread' && currentPage + 1 <= pdfDoc.numPages) {
          await renderPageToCanvas(
            currentPage + 1,
            secondaryCanvasRef.current,
            secondaryTextLayerRef.current,
            secondaryRenderTaskRef
          );
        }

        if (isSubscribed) {
          setPageRendering(false);
        }
      };

      doRender();

      return () => {
        isSubscribed = false;
        if (currentRenderTaskRef.current) {
          try {
            currentRenderTaskRef.current.cancel();
          } catch {}
        }
        if (secondaryRenderTaskRef.current) {
          try {
            secondaryRenderTaskRef.current.cancel();
          } catch {}
        }
      };
    }, [pdfDoc, currentPage, zoom, viewMode, renderPageToCanvas, displayMode]);

    // Theme filter styles for HQ Scan Mode
    const getFilterStyle = () => {
      if (invertColors) {
        return 'invert(90%) hue-rotate(180deg) contrast(115%) brightness(95%)';
      }
      if (readerTheme === 'sepia') {
        return 'sepia(28%) contrast(104%) brightness(98%)';
      }
      return 'none';
    };

    const getShadowClass = () => {
      switch (readerTheme) {
        case 'dark':
        case 'slate':
          return 'shadow-2xl ring-1 ring-white/10';
        case 'sepia':
          return 'shadow-lg ring-1 ring-[#D9CDAD]';
        default:
          return 'shadow-xl ring-1 ring-black/10';
      }
    };

    const facsimileWidth = zoom >= 200 ? '1600' : zoom >= 140 ? '1200' : '800';
    const facsimilePageUrl = effectiveIdentifier
      ? `/api/archive/page-image?identifier=${encodeURIComponent(effectiveIdentifier)}&page=${currentPage}&width=${facsimileWidth}`
      : '';

    const secondaryFacsimilePageUrl = effectiveIdentifier && viewMode === 'spread'
      ? `/api/archive/page-image?identifier=${encodeURIComponent(effectiveIdentifier)}&page=${currentPage + 1}&width=${facsimileWidth}`
      : '';

    return (
      <div className="relative w-fit mx-auto min-h-full py-4">
        {/* Loading Indicator Overlay */}
        {(docLoading || pageRendering) && (
          <div className="absolute top-2 right-4 z-40 flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-md px-3.5 py-1.5 text-xs text-white shadow-lg pointer-events-none transition-opacity">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
            <span className="font-serif text-[11px]">
              {docLoading ? 'PDF लोड हो रहा है...' : `पेज ${currentPage} हाई-रेसोल्यूशन रेंडर हो रहा है...`}
            </span>
          </div>
        )}

        {/* Reader Display Canvas / Frame */}
        <div className="flex gap-4">
          {/* Mode 1: High Quality Scanned Image Mode (Original Facsimile) */}
          {displayMode === 'scan' && (
            <div
              className={`relative rounded-xl overflow-hidden ${getShadowClass()} transition-all duration-200 bg-white mx-auto my-auto`}
              style={{
                filter: getFilterStyle(),
              }}
            >
              <div className="relative min-w-[320px] min-h-[480px] flex items-center justify-center bg-stone-100 dark:bg-stone-900">
                {!facsimileImgLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-stone-400">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
                    <span className="text-xs font-serif">पेज {currentPage} हाई-डेफिनिशन स्कैन लोड हो रहा है...</span>
                  </div>
                )}
                <img
                  src={facsimilePageUrl}
                  alt={`Book Page ${currentPage}`}
                  onLoad={() => setFacsimileImgLoaded(true)}
                  onError={() => {
                    // Fallback to embed if images cannot be resolved
                    setFacsimileImgFailed(true);
                  }}
                  className="block max-w-none transition-transform duration-150 select-none rounded-lg mx-auto"
                  style={{
                    width: `${Math.round(680 * (zoom / 100))}px`,
                    height: 'auto',
                    objectFit: 'contain',
                    transformOrigin: 'center center',
                  }}
                />
              </div>

              {/* Spread Secondary Page in Scan Mode */}
              {viewMode === 'spread' && (
                <div className="relative min-w-[320px] min-h-[480px] flex items-center justify-center bg-stone-100 dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800">
                  <img
                    src={secondaryFacsimilePageUrl}
                    alt={`Book Page ${currentPage + 1}`}
                    className="block max-w-none transition-transform duration-150 select-none rounded-lg mx-auto"
                    style={{
                      width: `${Math.round(680 * (zoom / 100))}px`,
                      height: 'auto',
                      objectFit: 'contain',
                      transformOrigin: 'center center',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Interactive 3D Flipbook / Embed Reader */}
          {displayMode === 'embed' && (
            <div className="w-[94vw] max-w-5xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-950 flex flex-col mx-auto my-auto">
              <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-800 text-stone-300 text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  <span className="font-serif font-semibold">Interactive Book Reader (Universal Dual-Page Flipbook)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] opacity-70">पृष्ठ {currentPage} • इंटरैक्टिव फ्लिप प्रारूप</span>
                </div>
              </div>
              <iframe
                src={`https://archive.org/embed/${encodeURIComponent(effectiveIdentifier)}?ui=embed#page/${currentPage}`}
                className="w-full flex-1 border-0"
                title="Internet Archive Universal Interactive Reader"
                allowFullScreen
              />
            </div>
          )}

          {/* Mode 3: Clean High-Quality Typography Text Mode */}
          {displayMode === 'text' && (
            <div
              className={`relative rounded-2xl ${getShadowClass()} transition-all duration-200 p-8 sm:p-12 max-w-3xl min-w-[320px] min-h-[550px] ${
                readerTheme === 'dark'
                  ? 'bg-stone-900 text-stone-100'
                  : readerTheme === 'slate'
                  ? 'bg-slate-900 text-slate-100'
                  : readerTheme === 'sepia'
                  ? 'bg-[#FBF0D9] text-[#2C2213]'
                  : 'bg-stone-50 text-stone-900'
              }`}
            >
              {/* Typography Controls */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <span className="font-serif text-xs font-bold uppercase tracking-wider opacity-80">
                    पृष्ठ {currentPage} • पाठ्य रूप
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSizeScale((s) => Math.max(80, s - 10))}
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-amber-500 hover:text-stone-950 transition-colors cursor-pointer"
                    title="Font size smaller"
                  >
                    <AArrowDown className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-mono font-bold w-10 text-center">{fontSizeScale}%</span>
                  <button
                    onClick={() => setFontSizeScale((s) => Math.min(180, s + 10))}
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-amber-500 hover:text-stone-950 transition-colors cursor-pointer"
                    title="Font size larger"
                  >
                    <AArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {textPageLoading ? (
                <div className="flex flex-col items-center justify-center p-16 text-stone-400">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
                  <p className="text-xs font-serif">पाठ्य लोड हो रहा है...</p>
                </div>
              ) : (
                <div
                  className="font-serif leading-relaxed text-justify whitespace-pre-wrap select-text tracking-wide"
                  style={{
                    fontSize: `${1.1 * (fontSizeScale / 100)}rem`,
                    lineHeight: 1.8,
                  }}
                >
                  {textPageContent || 'इस पृष्ठ के लिए कोई पाठ्य उपलब्ध नहीं है।'}
                </div>
              )}
            </div>
          )}

          {/* Mode 4: Vector PDF Mode */}
          {displayMode === 'pdf' && (
            <div
              className={`relative rounded-lg overflow-hidden ${getShadowClass()} transition-shadow duration-200 bg-white mx-auto my-auto flex`}
              style={{ filter: getFilterStyle() }}
            >
              <div 
                className="relative shrink-0"
                style={{
                  width: baseDimensions ? `${Math.round(baseDimensions.width * 1.4 * (zoom / 100))}px` : `${Math.round(760 * (zoom / 100))}px`,
                }}
              >
                <canvas ref={canvasRef} className="block select-none mx-auto w-full h-auto" />
                <div ref={textLayerRef} className="textLayer select-text absolute top-0 left-0" style={{ pointerEvents: 'auto', width: '100%', height: '100%' }} />
              </div>

              {viewMode === 'spread' && pdfDoc && currentPage + 1 <= pdfDoc.numPages && (
                <div 
                  className="border-l border-stone-200 dark:border-stone-800 relative shrink-0"
                  style={{
                    width: secondaryBaseDimensions ? `${Math.round(secondaryBaseDimensions.width * 1.4 * (zoom / 100))}px` : `${Math.round(760 * (zoom / 100))}px`,
                  }}
                >
                  <canvas ref={secondaryCanvasRef} className="block select-none mx-auto w-full h-auto" />
                  <div ref={secondaryTextLayerRef} className="textLayer select-text absolute top-0 left-0" style={{ pointerEvents: 'auto', width: '100%', height: '100%' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
PdfDocumentViewer.displayName = 'PdfDocumentViewer';
