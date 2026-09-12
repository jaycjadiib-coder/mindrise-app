import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  Eye,
  Sliders,
  Search,
  Layers,
  Columns,
  SquareMinus,
  X,
  Image as ImageIcon,
  FileText,
  BookOpen,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ArchiveReadingProgress } from '../../types/archive';
import {
  BookRepresentationResult,
  BookRepresentationType,
} from '../../types/representation';
import {
  detectBookRepresentation,
  getNextFallbackRepresentation,
} from '../../services/bookRepresentationService';
import { PdfDocumentViewer, PdfViewerHandle } from './PdfDocumentViewer';
import { ImageStackReader } from './renderers/ImageStackReader';
import { BookReaderViewer } from './renderers/BookReaderViewer';
import { TextOcrReader } from './renderers/TextOcrReader';
import { FallbackSourceReader } from './renderers/FallbackSourceReader';
import { PdfThumbnailSidebar } from './PdfThumbnailSidebar';

type ReaderTheme = 'dark' | 'slate' | 'sepia' | 'light';
type ViewMode = 'single' | 'spread';

export const ArchiveInAppReader: React.FC = () => {
  const {
    activeArchiveReader,
    closeArchiveReader,
    archiveProgress,
    saveArchiveReadingProgress,
    archiveLibrary,
    addArchiveToLibrary,
    removeArchiveFromLibrary,
  } = useData();

  // Representation & Detection State (Purely Internal)
  const [repResult, setRepResult] = useState<BookRepresentationResult | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  
  // Active renderer: 'pdf' | 'image_stack' | 'bookreader' | 'text' | 'fallback' (Determined automatically per-book)
  const [activeRenderer, setActiveRenderer] = useState<BookRepresentationType>('pdf');

  // Pagination & Document Info
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(240);
  const [outline, setOutline] = useState<any[]>([]);
  const [sessionMinutes, setSessionMinutes] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // View Mode, Format & Thumbnails
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  // In-Document Search
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Environment & Theme
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('dark');
  const [invertPageScan, setInvertPageScan] = useState<boolean>(false);
  const [showThemePanel, setShowThemePanel] = useState<boolean>(false);

  // Zoom State (50% to 400%)
  const [pageZoom, setPageZoom] = useState<number>(100);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs
  const viewerRef = useRef<PdfViewerHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const themePanelRef = useRef<HTMLDivElement>(null);
  const touchDistRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const isDraggingRef = useRef<boolean>(false);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themePanelRef.current && !themePanelRef.current.contains(e.target as Node)) {
        setShowThemePanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Restore saved progress on mount for specific book
  useEffect(() => {
    if (!activeArchiveReader) return;
    const saved = archiveProgress[activeArchiveReader.identifier];
    if (saved && saved.currentPage) {
      setCurrentPage(saved.currentPage);
    } else {
      setCurrentPage(1);
    }
    setOutline([]);
  }, [activeArchiveReader?.identifier]);

  // 2. Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes((m) => m + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. CORE AUTOMATIC ASSET DETECTION ENGINE (Per-Book)
  const runAssetDetection = useCallback(async () => {
    if (!activeArchiveReader) return;

    setIsDetecting(true);

    try {
      const result = await detectBookRepresentation(activeArchiveReader);
      
      setRepResult(result);
      setTotalPages(Math.max(1, result.pageCount || 240));

      // Auto-select the detected renderer internally
      const chosenRenderer = result.selectedRepresentation.renderer;
      setActiveRenderer(chosenRenderer);
      
      setIsDetecting(false);
    } catch (err) {
      console.warn('Asset detection notice, using fallback direct reader:', err);
      setActiveRenderer('image_stack');
      setIsDetecting(false);
    }
  }, [activeArchiveReader]);

  useEffect(() => {
    runAssetDetection();
  }, [runAssetDetection]);

  // 4. SILENT AUTOMATIC FAILOVER HANDLER
  // If a renderer (e.g. PDF) fails to load, automatically failover to ImageStack / BookReader (NEVER plain text)
  const handleRendererFailover = useCallback((failedType: BookRepresentationType) => {
    if (!repResult) {
      setActiveRenderer('image_stack');
      return;
    }

    const next = getNextFallbackRepresentation(repResult, failedType);
    console.info(`Automatic reader failover: ${failedType} -> switching to ${next.renderer}`);
    
    // Never degrade to plain text when visual representation is available
    if (next.renderer === 'text') {
      if (repResult.representations.imageStack.available) {
        setActiveRenderer('image_stack');
      } else if (repResult.representations.bookReader.available) {
        setActiveRenderer('bookreader');
      } else {
        setActiveRenderer('image_stack');
      }
    } else {
      setActiveRenderer(next.renderer);
    }
  }, [repResult]);

  // 5. Handle Document Loaded Callback (e.g. from PDF.js)
  const handleDocumentLoaded = useCallback((docTotalPages: number, docOutline?: any[]) => {
    if (docTotalPages && docTotalPages > 0) {
      setTotalPages(docTotalPages);
    }
    if (docOutline) {
      setOutline(docOutline);
    }
  }, []);

  // 6. Save reading progress
  const handleSaveProgress = useCallback(
    (page: number) => {
      if (!activeArchiveReader) return;
      const pct = totalPages > 0 ? Math.min(100, Math.round((page / totalPages) * 100)) : 0;
      const prog: ArchiveReadingProgress = {
        identifier: activeArchiveReader.identifier,
        currentPage: page,
        totalPages,
        progressPercentage: pct,
        lastReadAt: new Date().toISOString(),
        minutesSpent: (archiveProgress[activeArchiveReader.identifier]?.minutesSpent || 0) + sessionMinutes,
      };
      saveArchiveReadingProgress(prog);
    },
    [activeArchiveReader, totalPages, sessionMinutes, archiveProgress, saveArchiveReadingProgress]
  );

  // 7. Navigation controls
  const goToNextPage = useCallback(() => {
    const step = viewMode === 'spread' ? 2 : 1;
    if (currentPage < totalPages) {
      const next = Math.min(totalPages, currentPage + step);
      setCurrentPage(next);
      handleSaveProgress(next);
      if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [currentPage, totalPages, viewMode, handleSaveProgress]);

  const goToPrevPage = useCallback(() => {
    const step = viewMode === 'spread' ? 2 : 1;
    if (currentPage > 1) {
      const prev = Math.max(1, currentPage - step);
      setCurrentPage(prev);
      handleSaveProgress(prev);
      if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [currentPage, viewMode, handleSaveProgress]);

  // 8. Dynamic & Coordinate-Aware Zoom Handlers (Center-point preserved)
  const updateZoomAtPoint = useCallback(
    (newZoomVal: number, clientX?: number, clientY?: number) => {
      const container = viewportRef.current;
      const clampedNewZoom = Math.min(400, Math.max(50, newZoomVal));

      if (!container) {
        setPageZoom(clampedNewZoom);
        return;
      }

      const currentZoom = pageZoom;
      if (clampedNewZoom === currentZoom) return;

      const ratio = clampedNewZoom / currentZoom;
      const rect = container.getBoundingClientRect();

      // Determine focal point relative to viewport
      const focalX = clientX !== undefined ? clientX - rect.left : container.clientWidth / 2;
      const focalY = clientY !== undefined ? clientY - rect.top : container.clientHeight / 2;

      const oldScale = currentZoom / 100;
      const newScale = clampedNewZoom / 100;

      const currentScrollLeft = container.scrollLeft;
      const currentScrollTop = container.scrollTop;

      // Document coordinate under pointer
      const docX = (currentScrollLeft + focalX) / oldScale;
      const docY = (currentScrollTop + focalY) / oldScale;

      const targetScrollLeft = docX * newScale - focalX;
      const targetScrollTop = docY * newScale - focalY;

      // Force React to synchronously update DOM styles/dimensions for the new scale
      flushSync(() => {
        setPageZoom(clampedNewZoom);
      });

      // Now scroll positions can be applied instantly and won't hit old clamping limits
      if (viewportRef.current) {
        viewportRef.current.scrollLeft = Math.max(0, targetScrollLeft);
        viewportRef.current.scrollTop = Math.max(0, targetScrollTop);
      }
    },
    [pageZoom]
  );

  const handleZoomIn = useCallback(
    (clientX?: number, clientY?: number) => {
      updateZoomAtPoint(pageZoom + 25, clientX, clientY);
    },
    [pageZoom, updateZoomAtPoint]
  );

  const handleZoomOut = useCallback(
    (clientX?: number, clientY?: number) => {
      updateZoomAtPoint(pageZoom - 25, clientX, clientY);
    },
    [pageZoom, updateZoomAtPoint]
  );

  const handleResetZoom = useCallback(() => {
    setPageZoom(100);
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, []);

  const handleFitWidth = useCallback(() => {
    if (viewportRef.current) {
      const clientW = viewportRef.current.clientWidth;
      const targetW = Math.max(380, clientW - 64);
      const computedZoom = Math.min(400, Math.max(50, (targetW / 760) * 100));
      setPageZoom(computedZoom);
    }
  }, []);

  const handleFitPage = useCallback(() => {
    if (viewportRef.current) {
      const clientH = viewportRef.current.clientHeight;
      const targetH = Math.max(400, clientH - 120);
      const computedZoom = Math.min(400, Math.max(50, (targetH / 1050) * 100));
      setPageZoom(computedZoom);
    }
  }, []);

  // 9. Wheel & Touchpad Gestures (Natural Native Scroll & Ctrl/Pinch Zoom)
  const handleWheel = (e: React.WheelEvent) => {
    // Ctrl/Meta pinch zoom on trackpad or mouse wheel
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomStep = -e.deltaY * 0.2; // Continuous smooth scaling step
      updateZoomAtPoint(pageZoom + zoomStep, e.clientX, e.clientY);
      return;
    }
    // All regular wheel events scroll the container naturally without page jumping or scroll snapping
  };

  // 10. Mouse Drag Panning in any direction when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, select, iframe')) return;
    if (!viewportRef.current) return;

    // Allow grab panning if document is scrollable in any direction
    const container = viewportRef.current;
    const isScrollable = container.scrollWidth > container.clientWidth || container.scrollHeight > container.clientHeight;
    if (!isScrollable && pageZoom <= 100) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !viewportRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    viewportRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    viewportRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // 11. Mobile Touch Swipe & Pinch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = newDist / touchDistRef.current;

      if (factor > 1.08) {
        handleZoomIn();
        touchDistRef.current = newDist;
      } else if (factor < 0.92) {
        handleZoomOut();
        touchDistRef.current = newDist;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartPosRef.current && e.changedTouches.length === 1 && pageZoom <= 110) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - touchStartPosRef.current.x;
      const dy = endY - touchStartPosRef.current.y;

      // Horizontal swipe > 60px with small vertical deviation
      if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
        if (dx < 0) {
          goToNextPage();
        } else {
          goToPrevPage();
        }
      }
    }
    touchStartPosRef.current = null;
    touchDistRef.current = null;
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=' || e.key === 'Add') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-' || e.key === '_' || e.key === 'Subtract') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          setShowSearchBar((v) => !v);
        }
      } else {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          goToNextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          goToPrevPage();
        } else if (e.key === 'Home') {
          e.preventDefault();
          setCurrentPage(1);
          handleSaveProgress(1);
        } else if (e.key === 'End') {
          e.preventDefault();
          setCurrentPage(totalPages);
          handleSaveProgress(totalPages);
        } else if (e.key === 'f' || e.key === 'F') {
          if (!e.repeat) {
            toggleFullscreen();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [goToNextPage, goToPrevPage, handleZoomIn, handleZoomOut, handleResetZoom, handleSaveProgress, totalPages]);

  // In-Document Search Execution
  const handlePerformSearch = async (query: string) => {
    if (!query.trim() || !viewerRef.current) return;
    setIsSearching(true);
    try {
      const matches = await viewerRef.current.searchInDocument(query);
      setSearchResults(matches);
      setCurrentMatchIndex(0);
      if (matches.length > 0) {
        setCurrentPage(matches[0]);
        handleSaveProgress(matches[0]);
      }
    } catch {
      // Ignored
    } finally {
      setIsSearching(false);
    }
  };

  const goToNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIdx);
    setCurrentPage(searchResults[nextIdx]);
    handleSaveProgress(searchResults[nextIdx]);
  };

  const goToPrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIdx);
    setCurrentPage(searchResults[prevIdx]);
    handleSaveProgress(searchResults[prevIdx]);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Library Toggle
  const isSavedInLibrary = activeArchiveReader
    ? !!archiveLibrary[activeArchiveReader.identifier]
    : false;

  const toggleLibrary = () => {
    if (!activeArchiveReader) return;
    if (isSavedInLibrary) {
      removeArchiveFromLibrary(activeArchiveReader.identifier);
    } else {
      addArchiveToLibrary({
        identifier: activeArchiveReader.identifier,
        title: activeArchiveReader.title,
        author: activeArchiveReader.creator,
        coverUrl: activeArchiveReader.coverUrl,
        addedAt: new Date().toISOString(),
        currentPage,
        totalPages,
        shelf: 'currently-reading',
      });
    }
  };

  // Theme Styles Dictionary
  const themeStyles = {
    dark: {
      headerBg: 'bg-stone-950/95 border-stone-800 text-stone-100',
      canvasBg: 'bg-[#121214]',
      footerBg: 'bg-stone-950/95 border-stone-800 text-stone-300',
      controlBtn: 'bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800 hover:text-white',
      accentBadge: 'bg-stone-800 text-amber-400 border-stone-700',
    },
    slate: {
      headerBg: 'bg-slate-950/95 border-slate-800 text-slate-100',
      canvasBg: 'bg-[#0f172a]',
      footerBg: 'bg-slate-950/95 border-slate-800 text-slate-300',
      controlBtn: 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white',
      accentBadge: 'bg-slate-800 text-cyan-400 border-slate-700',
    },
    sepia: {
      headerBg: 'bg-[#EDE4D0] border-[#D9CBB0] text-[#3D2C1E]',
      canvasBg: 'bg-[#F4ECD8]',
      footerBg: 'bg-[#EDE4D0] border-[#D9CBB0] text-[#4A3728]',
      controlBtn: 'bg-[#E5DAC0] border-[#D4C4A5] text-[#3D2C1E] hover:bg-[#DDD0B5]',
      accentBadge: 'bg-[#D9CBB0] text-[#5A381E] border-[#C8B698]',
    },
    light: {
      headerBg: 'bg-white/95 border-stone-200 text-stone-800',
      canvasBg: 'bg-[#F5F5F7]',
      footerBg: 'bg-white/95 border-stone-200 text-stone-600',
      controlBtn: 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200 hover:text-stone-950',
      accentBadge: 'bg-stone-100 text-amber-600 border-stone-200',
    },
  };

  const currentTheme = themeStyles[readerTheme];

  if (!activeArchiveReader) {
    return null;
  }

  const readingPercentage = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;
  const estimatedMinsLeft = Math.max(1, Math.round((totalPages - currentPage) * 1.5));

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-stone-950 select-none overflow-hidden"
    >
      {/* 1. TOP HEADER & CONTROLS */}
      <header
        className={`flex h-14 items-center justify-between border-b ${currentTheme.headerBg} px-3 sm:px-6 shrink-0 z-30 transition-colors`}
      >
        {/* Left: Back + Book Details */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 max-w-[55%] sm:max-w-[45%]">
          <button
            onClick={closeArchiveReader}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${currentTheme.controlBtn}`}
            title="Back to Catalog / Library"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-serif font-bold truncate leading-tight">
              {activeArchiveReader.title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] opacity-75">
              <span className="truncate">{activeArchiveReader.creator || 'Classical Author'}</span>
            </div>
          </div>
        </div>

        {/* Center: Format Switcher */}
        <div className="hidden md:flex items-center p-1 rounded-full border border-black/10 dark:border-white/10 bg-[#1A1A1A] text-xs font-medium text-stone-300">
          <button
            onClick={() => setActiveRenderer('image_stack')}
            disabled={!repResult?.representations?.imageStack?.available}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              activeRenderer === 'image_stack' ? 'bg-amber-500 text-stone-950 font-medium shadow-sm' : 'hover:text-white'
            } ${!repResult?.representations?.imageStack?.available ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>HQ Scan</span>
          </button>
          
          <button
            onClick={() => setActiveRenderer(repResult?.representations?.text?.available ? 'text' : 'bookreader')}
            disabled={!repResult?.representations?.text?.available && !repResult?.representations?.bookReader?.available}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              activeRenderer === 'text' || activeRenderer === 'bookreader' ? 'bg-amber-500 text-stone-950 font-medium shadow-sm' : 'hover:text-white'
            } ${(!repResult?.representations?.text?.available && !repResult?.representations?.bookReader?.available) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Clean Text</span>
          </button>

          <button
            onClick={() => setActiveRenderer('pdf')}
            disabled={!repResult?.representations?.pdf?.available}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              activeRenderer === 'pdf' ? 'bg-amber-500 text-stone-950 font-medium shadow-sm' : 'hover:text-white'
            } ${!repResult?.representations?.pdf?.available ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Vector PDF</span>
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Thumbnails Drawer Toggle */}
          <button
            onClick={() => setShowThumbnails((v) => !v)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
              showThumbnails ? 'bg-amber-500 text-stone-950 font-bold border-amber-400' : currentTheme.controlBtn
            }`}
            title="Page Thumbnails & Table of Contents"
          >
            <Layers className="h-4 w-4" />
          </button>

          {/* Search Toggle */}
          {activeRenderer === 'pdf' && (
            <button
              onClick={() => setShowSearchBar((v) => !v)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                showSearchBar ? 'bg-amber-500 text-stone-950 font-bold border-amber-400' : currentTheme.controlBtn
              }`}
              title="Search Text in Book (Ctrl+F)"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Theme Settings Popover */}
          <div className="relative" ref={themePanelRef}>
            <button
              onClick={() => setShowThemePanel((v) => !v)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${currentTheme.controlBtn}`}
              title="Reading Theme & Canvas Display"
            >
              <Sliders className="h-4 w-4" />
            </button>

            {showThemePanel && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-white/20 bg-stone-900 p-4 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Reading Ambience
                  </span>
                  <button
                    onClick={() => setShowThemePanel(false)}
                    className="text-stone-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Background Themes */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-2 font-medium">
                      Canvas Tone
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['dark', 'slate', 'sepia', 'light'] as ReaderTheme[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setReaderTheme(t)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                            readerTheme === t
                              ? 'border-amber-500 bg-white/15 text-white font-bold'
                              : 'border-white/10 hover:bg-white/5 text-stone-400'
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded-full border ${
                              t === 'dark'
                                ? 'bg-stone-950 border-stone-700'
                                : t === 'slate'
                                ? 'bg-slate-900 border-slate-700'
                                : t === 'sepia'
                                ? 'bg-[#EDE4D0] border-[#D9CBB0]'
                                : 'bg-white border-stone-300'
                            }`}
                          />
                          <span className="capitalize">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Invert Page Colors Toggle */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium block">Night Scan Mode</span>
                      <span className="text-[10px] text-stone-400">
                        Invert harsh white scan pages
                      </span>
                    </div>
                    <button
                      onClick={() => setInvertPageScan((v) => !v)}
                      className={`h-6 w-11 rounded-full transition-colors relative cursor-pointer ${
                        invertPageScan ? 'bg-amber-500' : 'bg-stone-700'
                      }`}
                      title="Toggle inverted PDF mode"
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition-transform transform absolute top-1 left-1 ${
                          invertPageScan ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bookmark */}
          <button
            onClick={toggleLibrary}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
              isSavedInLibrary ? 'bg-amber-600 text-white' : currentTheme.controlBtn
            }`}
            title={isSavedInLibrary ? 'Saved in Library' : 'Add to Library'}
          >
            {isSavedInLibrary ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${currentTheme.controlBtn}`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Floating In-Document Search Bar */}
      {showSearchBar && activeRenderer === 'pdf' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-2xl shadow-2xl border border-white/20 animate-in slide-in-from-top duration-150">
          <Search className="h-4 w-4 text-amber-400 shrink-0" />
          <input
            type="text"
            placeholder="Search words in this PDF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handlePerformSearch(searchQuery);
              }
            }}
            className="bg-transparent text-xs text-white placeholder-stone-400 focus:outline-hidden w-48 sm:w-64"
            autoFocus
          />
          {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono pl-1 border-l border-white/20">
              <span>
                {currentMatchIndex + 1}/{searchResults.length}
              </span>
              <button
                onClick={goToPrevMatch}
                className="p-1 hover:bg-white/10 rounded-md cursor-pointer"
                title="Previous Match"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={goToNextMatch}
                className="p-1 hover:bg-white/10 rounded-md cursor-pointer"
                title="Next Match"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={() => handlePerformSearch(searchQuery)}
            className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold cursor-pointer transition-all"
          >
            Search
          </button>
          <button
            onClick={() => setShowSearchBar(false)}
            className="p-1 hover:bg-white/10 rounded-md cursor-pointer opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Thumbnails Sidebar */}
      <PdfThumbnailSidebar
        pdfUrl={repResult?.representations.pdf.url || ''}
        totalPages={totalPages}
        currentPage={currentPage}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
        onSelectPage={(p) => {
          setCurrentPage(p);
          handleSaveProgress(p);
        }}
        outline={outline}
        readerTheme={readerTheme}
      />

      {/* Floating Zoom & Display Bar (Visible for PDF & ImageStack) */}
      {(activeRenderer === 'pdf' || activeRenderer === 'image_stack') && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-black/15 dark:border-white/15 bg-black/85 dark:bg-stone-950/90 backdrop-blur-md px-3.5 py-1.5 text-white text-xs shadow-2xl">
            <button
              onClick={() => handleZoomOut()}
              className="p-1 hover:text-amber-400 cursor-pointer transition-colors rounded-full hover:bg-white/10"
              title="Zoom Out (Ctrl -)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleResetZoom}
              className="font-mono text-[11px] px-2 font-semibold text-amber-400 min-w-[50px] text-center hover:underline cursor-pointer"
              title="Click to reset zoom to 100% (Ctrl 0)"
            >
              {Math.round(pageZoom)}%
            </button>

            <button
              onClick={() => handleZoomIn()}
              className="p-1 hover:text-amber-400 cursor-pointer transition-colors rounded-full hover:bg-white/10"
              title="Zoom In (Ctrl +)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <span className="opacity-25 select-none">|</span>

            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-sans flex items-center gap-1 text-stone-200 hover:text-white cursor-pointer transition-colors"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleFitWidth}
              className="hidden sm:flex px-2 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-sans items-center gap-1 text-stone-200 hover:text-white cursor-pointer transition-colors"
              title="Fit to Window Width"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Fit Width</span>
            </button>

            <button
              onClick={handleFitPage}
              className="hidden md:flex px-2 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-sans items-center gap-1 text-stone-200 hover:text-white cursor-pointer transition-colors"
              title="Fit Entire Page"
            >
              <Eye className="h-3 w-3" />
              <span>Fit Page</span>
            </button>
          </div>
        </div>
      )}

      {/* Screen Left Page Navigation Button */}
      <button
        onClick={goToPrevPage}
        disabled={currentPage <= 1}
        className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 h-11 w-11 sm:h-13 sm:w-13 rounded-full border border-black/20 dark:border-white/20 bg-stone-900/90 text-white backdrop-blur-md flex items-center justify-center shadow-2xl hover:bg-amber-500 hover:text-stone-950 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer group"
        title="Previous Page (← Arrow Left)"
        aria-label="Previous Page"
      >
        <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Screen Right Page Navigation Button */}
      <button
        onClick={goToNextPage}
        disabled={currentPage >= totalPages}
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 h-11 w-11 sm:h-13 sm:w-13 rounded-full border border-black/20 dark:border-white/20 bg-stone-900/90 text-white backdrop-blur-md flex items-center justify-center shadow-2xl hover:bg-amber-500 hover:text-stone-950 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer group"
        title="Next Page (→ Arrow Right)"
        aria-label="Next Page"
      >
        <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 2. MAIN READING CANVAS VIEWPORT */}
      <main
        ref={viewportRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        className={`relative flex-1 ${currentTheme.canvasBg} overflow-y-auto overflow-x-auto ${
          isDragging ? 'cursor-grabbing' : 'cursor-default'
        } focus:outline-hidden`}
        style={{
          overscrollBehavior: 'contain',
        }}
      >
        {/* Loading / Opening Screen (Never a blank white page!) */}
        {isDetecting ? (
          <div className="min-h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-serif font-bold text-stone-200">
                Opening Book...
              </h3>
              <p className="text-xs font-mono text-stone-400">
                Loading reading view
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-full min-w-full w-max p-2 sm:p-6 md:p-8 pt-8 pb-20">
            {/* RENDERER 1: NATIVE PDF VIEWER */}
            {activeRenderer === 'pdf' && repResult?.representations.pdf.url && (
              <PdfDocumentViewer
                ref={viewerRef}
                pdfUrl={repResult.representations.pdf.url}
                bookIdentifier={activeArchiveReader.identifier}
                currentPage={currentPage}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  handleSaveProgress(p);
                }}
                onDocumentLoaded={handleDocumentLoaded}
                zoom={pageZoom}
                readerTheme={readerTheme}
                invertColors={invertPageScan}
                viewMode={viewMode}
                format="pdf"
                onPdfError={() => handleRendererFailover('pdf')}
              />
            )}

            {/* RENDERER 2: SCANNED FACSIMILE IMAGE STACK */}
            {activeRenderer === 'image_stack' && (
              <ImageStackReader
                bookIdentifier={activeArchiveReader.identifier}
                bookTitle={activeArchiveReader.title}
                currentPage={currentPage}
                totalPages={totalPages}
                zoom={pageZoom}
                readerTheme={readerTheme}
                invertColors={invertPageScan}
                viewMode={viewMode}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  handleSaveProgress(p);
                }}
                onErrorFallback={() => handleRendererFailover('image_stack')}
              />
            )}

            {/* RENDERER 3: INTERNET ARCHIVE BOOKREADER FLIPBOOK */}
            {activeRenderer === 'bookreader' && (
              <BookReaderViewer
                bookIdentifier={activeArchiveReader.identifier}
                currentPage={currentPage}
                readerTheme={readerTheme}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  handleSaveProgress(p);
                }}
                onErrorFallback={() => handleRendererFailover('bookreader')}
              />
            )}

            {/* RENDERER 4: OCR / CLEAN PLAIN TEXT */}
            {activeRenderer === 'text' && (
              <TextOcrReader
                bookIdentifier={activeArchiveReader.identifier}
                bookTitle={activeArchiveReader.title}
                currentPage={currentPage}
                totalPages={totalPages}
                readerTheme={readerTheme}
                onErrorFallback={() => handleRendererFailover('text')}
              />
            )}

            {/* RENDERER 5: SAFE SOURCE ARCHIVE FALLBACK */}
            {activeRenderer === 'fallback' && (
              <FallbackSourceReader
                bookIdentifier={activeArchiveReader.identifier}
                bookTitle={activeArchiveReader.title}
                creator={activeArchiveReader.creator}
                coverUrl={activeArchiveReader.coverUrl}
                onRetry={runAssetDetection}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. BOTTOM SCRUBBER & READING PROGRESS FOOTER */}
      <footer
        className={`flex h-12 items-center justify-between border-t ${currentTheme.footerBg} px-4 sm:px-6 text-xs shrink-0 z-30 transition-colors`}
      >
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-30 transition-all cursor-pointer ${currentTheme.controlBtn}`}
          title="Previous Page (←)"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Center Scrubber Slider & Page Jump */}
        <div className="flex-1 max-w-md mx-4 flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={Math.max(1, totalPages)}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setCurrentPage(val);
              handleSaveProgress(val);
              if (viewportRef.current) {
                viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
              }
            }}
            className="w-full accent-amber-500 h-1.5 bg-black/20 dark:bg-white/20 rounded-lg cursor-pointer"
            title={`Slide to jump pages (Page ${currentPage} of ${totalPages})`}
          />

          <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-mono">
            <span className="font-semibold text-amber-500">{currentPage}</span>
            <span className="opacity-40">/</span>
            <span>{totalPages}</span>
            <span className="opacity-40">({readingPercentage}%)</span>
          </div>
        </div>

        {/* Right: Estimated Reading Time & Next Page Button */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[10px] opacity-60 font-mono">
            ~{estimatedMinsLeft}m left
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-30 transition-all cursor-pointer ${currentTheme.controlBtn}`}
            title="Next Page (→)"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
