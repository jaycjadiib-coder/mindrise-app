import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Sun,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  Check,
  Moon,
  Eye,
  Sparkles,
  Play,
  Square,
  AudioLines,
  Languages,
  Sliders,
  FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ArchiveItemMetadata, ArchiveReadingProgress } from '../../types/archive';
import {
  getArchiveItemMetadata,
  getLanguageName
} from '../../services/internetArchiveService';

type ReaderTheme = 'dark' | 'slate' | 'sepia' | 'light';

export const ArchiveInAppReader: React.FC = () => {
  const {
    activeArchiveReader,
    closeArchiveReader,
    archiveProgress,
    saveArchiveReadingProgress,
    archiveLibrary,
    addArchiveToLibrary,
    removeArchiveFromLibrary
  } = useData();

  // Item metadata
  const [metadata, setMetadata] = useState<ArchiveItemMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(true);

  // Pagination & Progress
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sessionMinutes, setSessionMinutes] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Eye-safe Dark Default Environment
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('dark');
  const [invertPageScan, setInvertPageScan] = useState<boolean>(false);
  const [showThemePanel, setShowThemePanel] = useState<boolean>(false);

  // Internal PDF Zoom State (Sensible limits: 50% to 400%)
  const [pageZoom, setPageZoom] = useState<number>(100);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [pageImageLoading, setPageImageLoading] = useState<boolean>(false);

  // Audio Voice Reader (TTS) State
  const [showAudioPanel, setShowAudioPanel] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return localStorage.getItem('mindrise_reader_voice') || '';
  });
  const [audioPitch, setAudioPitch] = useState<number>(() => {
    const p = parseFloat(localStorage.getItem('mindrise_reader_pitch') || '1.0');
    return isNaN(p) ? 1.0 : p;
  });
  const [audioRate, setAudioRate] = useState<number>(() => {
    const r = parseFloat(localStorage.getItem('mindrise_reader_rate') || '1.0');
    return isNaN(r) ? 1.0 : r;
  });
  const [autoReadNextPage, setAutoReadNextPage] = useState<boolean>(true);
  const [currentPageText, setCurrentPageText] = useState<string>('');
  const [hasTextForPage, setHasTextForPage] = useState<boolean | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Audio Refs
  const audioPanelRef = useRef<HTMLDivElement>(null);
  const currentSpeechSessionRef = useRef<number>(0);
  const isPlayingAudioRef = useRef<boolean>(false);
  isPlayingAudioRef.current = isPlayingAudio;
  const currentPageRef = useRef<number>(currentPage);
  currentPageRef.current = currentPage;

  // Populate system Speech Synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const populateVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        setAvailableVoices(list);
        if (!selectedVoiceURI) {
          const isHindiBook =
            metadata?.language?.includes('hin') ||
            activeArchiveReader?.title?.match(/[\u0900-\u097F]/);
          const defaultVoice = isHindiBook
            ? list.find((v) => v.lang.startsWith('hi')) ||
              list.find((v) => v.lang.includes('IN')) ||
              list[0]
            : list.find((v) => v.lang.startsWith('en')) || list[0];
          if (defaultVoice) {
            setSelectedVoiceURI(defaultVoice.voiceURI);
          }
        }
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [metadata?.language, activeArchiveReader?.title, selectedVoiceURI]);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const themePanelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const isDraggingRef = useRef<boolean>(false);
  const touchDistRef = useRef<number | null>(null);
  const sessionTimerRef = useRef<any>(null);

  // Restore saved progress on mount
  useEffect(() => {
    if (!activeArchiveReader) return;
    const saved = archiveProgress[activeArchiveReader.identifier];
    if (saved && saved.currentPage) {
      setCurrentPage(saved.currentPage);
    }
  }, [activeArchiveReader, archiveProgress]);

  // Session timer
  useEffect(() => {
    sessionTimerRef.current = setInterval(() => {
      setSessionMinutes((m) => m + 1);
    }, 60000);
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // Fetch metadata on mount
  useEffect(() => {
    if (!activeArchiveReader) return;

    let isSubscribed = true;
    setLoadingMetadata(true);

    getArchiveItemMetadata(activeArchiveReader.identifier)
      .then((data) => {
        if (!isSubscribed) return;
        setMetadata(data);
        setLoadingMetadata(false);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn('Archive metadata load notice:', err);
        setLoadingMetadata(false);
      });

    return () => {
      isSubscribed = false;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeArchiveReader]);

  // Total pages from metadata
  const totalPages = metadata?.imagecount || 100;

  // Bound current page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Synchronized Zoom Handlers
  const handleZoomIn = useCallback(() => {
    setPageZoom((prev) => Math.min(400, Math.round((prev + 20) / 5) * 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPageZoom((prev) => Math.max(50, Math.round((prev - 20) / 5) * 5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setPageZoom(100);
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleFitWidth = useCallback(() => {
    if (viewportRef.current) {
      const clientW = viewportRef.current.clientWidth;
      const targetW = Math.max(380, clientW - 48);
      const computedZoom = Math.min(400, Math.max(50, Math.round((targetW / 850) * 100)));
      setPageZoom(computedZoom);
    }
  }, []);

  const handleFitPage = useCallback(() => {
    if (viewportRef.current) {
      const clientH = viewportRef.current.clientHeight;
      // Standard page height ~1100px for 850px width
      const targetH = Math.max(400, clientH - 120);
      const computedZoom = Math.min(400, Math.max(50, Math.round((targetH / 1100) * 100)));
      setPageZoom(computedZoom);
    }
  }, []);

  // LAPTOP TOUCHPAD PINCH-TO-ZOOM + FOCAL POINT ANCHORING
  // Two-finger pinch triggers wheel event with e.ctrlKey === true on Windows precision touchpads & Mac trackpads
  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // STRICT REQUIREMENT: Intercept and prevent the browser window from zooming
        e.preventDefault();

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const currentScrollLeft = container.scrollLeft;
        const currentScrollTop = container.scrollTop;

        // On Precision Touchpads:
        // Two-finger pinch out = negative deltaY = zoom in
        // Two-finger pinch in = positive deltaY = zoom out
        const zoomDelta = -e.deltaY;
        const zoomMultiplier = Math.exp(zoomDelta * 0.005);

        setPageZoom((prevZoom) => {
          let targetZoom = prevZoom * zoomMultiplier;
          // Clamp between sensible limits (50% to 400%)
          targetZoom = Math.min(400, Math.max(50, Math.round(targetZoom * 10) / 10));

          if (Math.abs(targetZoom - prevZoom) < 0.05) {
            return prevZoom;
          }

          const ratio = targetZoom / prevZoom;

          // Focal Point Anchoring:
          // Keep the point under the cursor stable during pinch
          const newScrollLeft = (currentScrollLeft + mouseX) * ratio - mouseX;
          const newScrollTop = (currentScrollTop + mouseY) * ratio - mouseY;

          requestAnimationFrame(() => {
            if (container) {
              container.scrollLeft = newScrollLeft;
              container.scrollTop = newScrollTop;
            }
          });

          return targetZoom;
        });
      } else {
        // NORMAL TWO-FINGER SCROLL:
        // e.ctrlKey is false.
        // Let the browser handle standard vertical & horizontal scrolling smoothly.
        // DO NOT preventDefault! DO NOT change zoom!
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Window-level guard: never allow browser page zoom while reader is mounted
  useEffect(() => {
    const blockBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const blockGesture = (e: any) => {
      e.preventDefault();
    };

    window.addEventListener('wheel', blockBrowserZoom, { passive: false });
    window.addEventListener('gesturestart', blockGesture, { passive: false });
    window.addEventListener('gesturechange', blockGesture, { passive: false });

    return () => {
      window.removeEventListener('wheel', blockBrowserZoom);
      window.removeEventListener('gesturestart', blockGesture);
      window.removeEventListener('gesturechange', blockGesture);
    };
  }, []);

  // Keyboard Zoom Shortcuts (Ctrl +, Ctrl -, Ctrl 0)
  useEffect(() => {
    const handleZoomKeys = (e: KeyboardEvent) => {
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
        }
      }
    };

    window.addEventListener('keydown', handleZoomKeys);
    return () => window.removeEventListener('keydown', handleZoomKeys);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  // Touchscreen multi-touch 2-finger pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchDistRef.current;
      touchDistRef.current = dist;

      setPageZoom((prev) => {
        const next = Math.min(400, Math.max(50, Math.round(prev * ratio * 10) / 10));
        return next;
      });
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
  };

  // Optional Active Click-Drag Panning (ACTIVE ONLY DURING MOUSE DOWN)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore clicks on buttons, inputs, links
    if ((e.target as HTMLElement).closest('button, input, a, select')) return;

    const container = viewportRef.current;
    if (!container) return;

    // Allow dragging when document exceeds viewport bounds
    const isScrollable =
      container.scrollWidth > container.clientWidth ||
      container.scrollHeight > container.clientHeight;

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
    if (!isDraggingRef.current) return;
    const container = viewportRef.current;
    if (!container) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    container.scrollLeft = dragStartRef.current.scrollLeft - dx;
    container.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  // Close theme panel and audio panel on click outside or Escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (themePanelRef.current && !themePanelRef.current.contains(e.target as Node)) {
        setShowThemePanel(false);
      }
      if (audioPanelRef.current && !audioPanelRef.current.contains(e.target as Node)) {
        setShowAudioPanel(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowThemePanel(false);
        setShowAudioPanel(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Save progress
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

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      handleSaveProgress(next);
      if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [currentPage, totalPages, handleSaveProgress]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      handleSaveProgress(prev);
      if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [currentPage, handleSaveProgress]);

  // Keyboard Navigation: Arrow Left/Right
  useEffect(() => {
    const handleNavKey = (e: KeyboardEvent) => {
      if (showThemePanel) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleNavKey);
    return () => window.removeEventListener('keydown', handleNavKey);
  }, [goToNextPage, goToPrevPage, showThemePanel]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
  };

  // Library bookmark toggle
  const isSavedInLibrary = Boolean(activeArchiveReader && archiveLibrary[activeArchiveReader.identifier]);

  const toggleLibrary = () => {
    if (!activeArchiveReader) return;
    if (isSavedInLibrary) {
      removeArchiveFromLibrary(activeArchiveReader.identifier);
    } else {
      addArchiveToLibrary({
        identifier: activeArchiveReader.identifier,
        title: activeArchiveReader.title,
        creator: activeArchiveReader.creator,
        coverUrl: activeArchiveReader.coverUrl,
        language: metadata?.language || 'und',
        shelf: 'currently-reading',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Stop audio and cancel speech synthesis
  const stopAudio = useCallback(() => {
    currentSpeechSessionRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsAudioLoading(false);
  }, []);

  // Speak running page text fetched from Internet Archive OCR
  const speakRunningPage = useCallback(
    async (pageNum: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!activeArchiveReader) return;

      currentSpeechSessionRef.current += 1;
      const sessionId = currentSpeechSessionRef.current;
      window.speechSynthesis.cancel();

      setIsPlayingAudio(true);
      setIsAudioLoading(true);
      setAudioError(null);

      try {
        const res = await fetch(
          `/api/archive/page-text?identifier=${encodeURIComponent(
            activeArchiveReader.identifier
          )}&page=${pageNum}`
        );
        if (!res.ok) throw new Error('Page text retrieval failed');
        const data = await res.json();

        if (sessionId !== currentSpeechSessionRef.current) return;
        setIsAudioLoading(false);

        const rawText: string = data.text || '';
        setCurrentPageText(rawText);
        setHasTextForPage(Boolean(data.hasText));

        let textToRead = rawText.trim();
        if (!textToRead || textToRead.length < 5) {
          textToRead = `पृष्ठ ${pageNum}। इस पृष्ठ पर कोई मुद्रित पाठ नहीं मिला, यह चित्र या आवरण हो सकता है।`;
        }

        // Split text into natural sentence chunks (~100-180 chars) to prevent browser TTS timeout
        const chunks = textToRead
          .replace(/[\r\n]+/g, ' ')
          .split(/(?<=[।!?.\n])\s+/)
          .filter((c) => c.trim().length > 0);

        if (chunks.length === 0) chunks.push(textToRead);

        let chunkIndex = 0;

        const speakNextChunk = () => {
          if (sessionId !== currentSpeechSessionRef.current) return;
          if (chunkIndex >= chunks.length) {
            // Finished reading page
            if (autoReadNextPage && pageNum < totalPages) {
              setCurrentPage((p) => {
                const next = p + 1;
                handleSaveProgress(next);
                if (viewportRef.current) {
                  viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
                }
                setTimeout(() => {
                  speakRunningPage(next);
                }, 400);
                return next;
              });
            } else {
              setIsPlayingAudio(false);
            }
            return;
          }

          const chunkText = chunks[chunkIndex++];
          const utterance = new SpeechSynthesisUtterance(chunkText);

          // Apply selected voice
          if (selectedVoiceURI && availableVoices.length > 0) {
            const matchedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
            if (matchedVoice) {
              utterance.voice = matchedVoice;
              utterance.lang = matchedVoice.lang;
            }
          } else {
            const isHindi =
              metadata?.language?.includes('hin') ||
              activeArchiveReader.title?.match(/[\u0900-\u097F]/) ||
              chunkText.match(/[\u0900-\u097F]/);
            utterance.lang = isHindi ? 'hi-IN' : 'en-US';
          }

          utterance.pitch = audioPitch;
          utterance.rate = audioRate;

          utterance.onend = () => {
            if (sessionId === currentSpeechSessionRef.current) {
              speakNextChunk();
            }
          };

          utterance.onerror = (e) => {
            console.warn('TTS chunk notice:', e);
            if (sessionId === currentSpeechSessionRef.current) {
              speakNextChunk();
            }
          };

          window.speechSynthesis.speak(utterance);
        };

        speakNextChunk();
      } catch (err: any) {
        if (sessionId === currentSpeechSessionRef.current) {
          setIsAudioLoading(false);
          setIsPlayingAudio(false);
          setAudioError('पाठ लोड करने में असमर्थ।');
        }
      }
    },
    [
      activeArchiveReader,
      autoReadNextPage,
      totalPages,
      handleSaveProgress,
      selectedVoiceURI,
      availableVoices,
      metadata?.language,
      audioPitch,
      audioRate,
    ]
  );

  // Master 1-button toggle for audio
  const toggleSpeechMaster = () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      speakRunningPage(currentPage);
    }
  };

  // When page flips and audio is actively playing, speak the new running page
  useEffect(() => {
    if (isPlayingAudioRef.current) {
      speakRunningPage(currentPage);
    }
  }, [currentPage, speakRunningPage]);

  if (!activeArchiveReader) return null;

  // Theme Styles: Dark (Default Eye-Comfort), Slate, Sepia, Light
  const themeStyles = {
    dark: {
      bg: 'bg-[#0B0D10]',
      text: 'text-stone-100',
      headerBg: 'bg-[#12151A] border-white/10',
      footerBg: 'bg-[#12151A] border-white/10',
      controlBtn: 'bg-white/10 hover:bg-white/15 text-stone-200 border-white/10',
      activeBtn: 'bg-amber-500 text-stone-950 font-bold',
      canvasBg: 'bg-[#08090C]',
      pageShadow: 'shadow-2xl ring-1 ring-white/10',
    },
    slate: {
      bg: 'bg-[#1E2229]',
      text: 'text-stone-100',
      headerBg: 'bg-[#181B20] border-stone-700',
      footerBg: 'bg-[#181B20] border-stone-700',
      controlBtn: 'bg-white/10 hover:bg-white/15 text-stone-200 border-white/10',
      activeBtn: 'bg-amber-500 text-stone-950 font-bold',
      canvasBg: 'bg-[#15181D]',
      pageShadow: 'shadow-xl ring-1 ring-white/10',
    },
    sepia: {
      bg: 'bg-[#F4ECD8]',
      text: 'text-[#2C2416]',
      headerBg: 'bg-[#E8DEC5] border-[#D9CDAD]',
      footerBg: 'bg-[#E8DEC5] border-[#D9CDAD]',
      controlBtn: 'bg-[#2C2416]/10 hover:bg-[#2C2416]/15 text-[#2C2416] border-[#2C2416]/15',
      activeBtn: 'bg-[#8B5A2B] text-white font-bold',
      canvasBg: 'bg-[#EFE4CC]',
      pageShadow: 'shadow-md ring-1 ring-[#D9CDAD]',
    },
    light: {
      bg: 'bg-[#FAF8F5]',
      text: 'text-[#1A1A1A]',
      headerBg: 'bg-[#F0ECE1] border-[#E2DDD0]',
      footerBg: 'bg-[#F0ECE1] border-[#E2DDD0]',
      controlBtn: 'bg-black/5 hover:bg-black/10 text-stone-800 border-black/10',
      activeBtn: 'bg-amber-600 text-white font-bold',
      canvasBg: 'bg-[#F4F0E6]',
      pageShadow: 'shadow-md ring-1 ring-black/10',
    },
  };

  const currentTheme = themeStyles[readerTheme];

  // Dynamic high-resolution width for sharp reading facsimile
  const targetWidth = pageZoom >= 180 ? '1600' : pageZoom >= 120 ? '1200' : '800';

  // URL for scanned page facsimile image via proxy (falls back to IA leaf)
  const pageImageUrl = `/api/archive/page-image?identifier=${encodeURIComponent(
    activeArchiveReader.identifier
  )}&page=${currentPage}&width=${targetWidth}`;

  const readingPercentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const estimatedMinsLeft = Math.max(1, Math.round((totalPages - currentPage) * 1.5));

  // Compute image filter for eye comfort / night reading inversion
  const getFilterStyle = () => {
    if (invertPageScan) {
      return 'invert(90%) hue-rotate(180deg) contrast(110%) brightness(95%)';
    }
    if (readerTheme === 'sepia') {
      return 'sepia(30%) contrast(102%) brightness(98%)';
    }
    return 'none';
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col ${currentTheme.bg} ${currentTheme.text} font-sans select-none overflow-hidden transition-colors duration-200`}
    >
      {/* 1. TOP HEADER */}
      <header
        className={`flex h-14 items-center justify-between border-b ${currentTheme.headerBg} px-3 sm:px-6 shrink-0 z-30 transition-colors`}
      >
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-sm sm:max-w-md">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              closeArchiveReader();
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all shrink-0 cursor-pointer ${currentTheme.controlBtn}`}
            title="Exit Reader (वापस जाएं)"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <h1 className="font-serif text-xs sm:text-sm font-bold truncate leading-tight">
              {activeArchiveReader.title}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] opacity-70">
              <span className="truncate">{activeArchiveReader.creator || 'Classical Edition'}</span>
              <span>•</span>
              <span className="font-mono">{getLanguageName(metadata?.language || 'hin')}</span>
            </div>
          </div>
        </div>

        {/* Center: Clean Book Status Badge */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-serif">Original Scanned Book</span>
            <span className="opacity-40 font-mono text-[10px]">
              (Page {currentPage} / {totalPages})
            </span>
          </div>
        </div>

        {/* Right: Sun Theme Icon, TTS Audio, Bookmark, Fullscreen */}
        <div className="flex items-center gap-1.5 relative">
          {/* Sun Icon -> Pure Dark/Light/Slate/Sepia Selection Panel */}
          <div className="relative" ref={themePanelRef}>
            <button
              onClick={() => setShowThemePanel((v) => !v)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                showThemePanel ? currentTheme.activeBtn : currentTheme.controlBtn
              }`}
              title="Theme & Lighting (डार्क, लाइट, सेपिया, स्लेट)"
            >
              <Sun className="h-4 w-4 text-amber-500" />
            </button>

            {/* Theme & Eye Comfort Panel */}
            {showThemePanel && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 rounded-2xl border p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${currentTheme.headerBg} border-black/20 dark:border-white/15`}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-black/10 dark:border-white/10 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Theme & Lighting</span>
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">वातावरण चुनें</span>
                </div>

                {/* 4 Theme Options: Dark, Slate, Sepia, Light */}
                <div className="space-y-1.5 mb-4">
                  {/* Dark Mode */}
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all border ${
                      readerTheme === 'dark'
                        ? 'bg-amber-500 text-stone-950 font-bold border-amber-500 shadow-xs'
                        : 'bg-[#0B0D10] text-stone-200 border-white/10 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-amber-400" />
                      <span>Dark Mode (डार्क - रात के लिए)</span>
                    </div>
                    {readerTheme === 'dark' && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* Slate / Twilight */}
                  <button
                    onClick={() => setReaderTheme('slate')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all border ${
                      readerTheme === 'slate'
                        ? 'bg-amber-500 text-stone-950 font-bold border-amber-500 shadow-xs'
                        : 'bg-[#1E2229] text-stone-200 border-white/10 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      <span>Slate (स्लेट - कम तनाव)</span>
                    </div>
                    {readerTheme === 'slate' && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* Warm Sepia */}
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all border ${
                      readerTheme === 'sepia'
                        ? 'bg-[#8B5A2B] text-white font-bold border-[#8B5A2B] shadow-xs'
                        : 'bg-[#F4ECD8] text-[#2C2416] border-[#D9CDAD] hover:border-[#8B5A2B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-700" />
                      <span>Sepia (सेपिया - वॉर्म बुक)</span>
                    </div>
                    {readerTheme === 'sepia' && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* Daylight Light */}
                  <button
                    onClick={() => setReaderTheme('light')}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all border ${
                      readerTheme === 'light'
                        ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                        : 'bg-[#FAF8F5] text-stone-900 border-black/10 hover:border-amber-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-600" />
                      <span>Light (लाइट - दिन के लिए)</span>
                    </div>
                    {readerTheme === 'light' && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Eye-Care Night Contrast Inversion Toggle */}
                <div className="pt-3 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <Moon className="h-3.5 w-3.5 text-amber-500" />
                        <span>Invert Scanned Pages</span>
                      </div>
                      <div className="text-[10px] opacity-60">आँखों के तनाव से बचाव (रात में)</div>
                    </div>
                    <button
                      onClick={() => setInvertPageScan((v) => !v)}
                      className={`h-6 w-11 rounded-full transition-colors relative cursor-pointer ${
                        invertPageScan ? 'bg-amber-500' : 'bg-stone-600'
                      }`}
                      title="Toggle inverted dark scan for reading in pitch dark"
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

          {/* Voice Reader & TTS Audio Controls Popover */}
          <div className="relative" ref={audioPanelRef}>
            <button
              onClick={() => setShowAudioPanel((v) => !v)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                showAudioPanel
                  ? currentTheme.activeBtn
                  : isPlayingAudio
                  ? 'bg-amber-500 text-stone-950 font-bold ring-2 ring-amber-400/60 animate-pulse'
                  : currentTheme.controlBtn
              }`}
              title="Voice Reader Settings (आवाज़, पिच व प्ले/पॉज़)"
            >
              {isPlayingAudio ? (
                <AudioLines className="h-4 w-4 text-stone-950" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            {/* Audio Settings Popover Panel */}
            {showAudioPanel && (
              <div
                className={`absolute right-0 top-full mt-2 w-80 sm:w-92 rounded-2xl border p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${currentTheme.headerBg} border-black/20 dark:border-white/15`}
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <AudioLines className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      वॉइस रीडर (Voice Reader)
                    </span>
                  </div>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                    पेज {currentPage} / {totalPages}
                  </span>
                </div>

                <div className="mt-3.5 space-y-3.5 text-xs">
                  {/* Master 1-Button ON / OFF Toggle */}
                  <div>
                    <button
                      onClick={toggleSpeechMaster}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold shadow-md transition-all cursor-pointer ${
                        isPlayingAudio
                          ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50'
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950 ring-2 ring-amber-400/30'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <Square className="h-4 w-4 fill-white" />
                          <span>वाचन बंद करें (Turn Audio OFF)</span>
                        </>
                      ) : isAudioLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
                          <span>पेज लोड हो रहा है...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-stone-950 text-stone-950" />
                          <span>पेज {currentPage} सुनें (Turn Audio ON)</span>
                        </>
                      )}
                    </button>

                    {/* Playing pulse indicator */}
                    {isPlayingAudio && (
                      <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] text-amber-500 font-medium animate-pulse">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        <span>पेज {currentPage} का वाचन सक्रिय है...</span>
                      </div>
                    )}
                  </div>

                  {/* Voice Selector (आवाज़ चुनें) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold flex items-center gap-1.5 opacity-90">
                      <Languages className="h-3.5 w-3.5 text-amber-500" />
                      <span>Voice / वाचक की आवाज़</span>
                    </label>
                    <select
                      value={selectedVoiceURI}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedVoiceURI(val);
                        localStorage.setItem('mindrise_reader_voice', val);
                        if (isPlayingAudio) {
                          speakRunningPage(currentPage);
                        }
                      }}
                      className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
                    >
                      {availableVoices.length === 0 ? (
                        <option value="">सिस्टम डिफॉल्ट आवाज़ (Default)</option>
                      ) : (
                        <>
                          {/* Prioritize Hindi / Indian Voices */}
                          <optgroup label="हिन्दी व भारतीय भाषाएँ (Hindi & Indian)">
                            {availableVoices
                              .filter(
                                (v) =>
                                  v.lang.startsWith('hi') ||
                                  v.lang.includes('IN') ||
                                  v.name.toLowerCase().includes('hindi') ||
                                  v.name.toLowerCase().includes('india')
                              )
                              .map((v) => (
                                <option key={v.voiceURI} value={v.voiceURI}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                          </optgroup>

                          {/* English & Global Voices */}
                          <optgroup label="अंग्रेजी व अन्य भाषाएँ (English & Other)">
                            {availableVoices
                              .filter(
                                (v) =>
                                  !v.lang.startsWith('hi') &&
                                  !v.lang.includes('IN') &&
                                  !v.name.toLowerCase().includes('hindi') &&
                                  !v.name.toLowerCase().includes('india')
                              )
                              .slice(0, 30)
                              .map((v) => (
                                <option key={v.voiceURI} value={v.voiceURI}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Pitch Control Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold opacity-90">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-amber-500" />
                        <span>Pitch / स्वर की पिच</span>
                      </span>
                      <span className="font-mono text-amber-500">
                        {audioPitch.toFixed(2)}x (
                        {audioPitch < 0.85
                          ? 'गंभीर / Deep'
                          : audioPitch > 1.15
                          ? 'तीक्ष्ण / High'
                          : 'सामान्य / Normal'}
                        )
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.05"
                      value={audioPitch}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setAudioPitch(val);
                        localStorage.setItem('mindrise_reader_pitch', String(val));
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] opacity-60">
                      <span>0.6x (गंभीर)</span>
                      <span>1.0x (सामान्य)</span>
                      <span>1.5x (तीक्ष्ण)</span>
                    </div>
                  </div>

                  {/* Speed / Rate Control Slider & Quick Presets */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold opacity-90">
                      <span>Speed / पढ़ने की गति</span>
                      <span className="font-mono text-amber-500">{audioRate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.75"
                      step="0.05"
                      value={audioRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setAudioRate(val);
                        localStorage.setItem('mindrise_reader_rate', String(val));
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-1 pt-0.5">
                      {[0.8, 1.0, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            setAudioRate(speed);
                            localStorage.setItem('mindrise_reader_rate', String(speed));
                          }}
                          className={`flex-1 rounded-lg py-1 text-[10px] font-semibold transition-all border ${
                            Math.abs(audioRate - speed) < 0.05
                              ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-2xs'
                              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-amber-500/50'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-Read Next Page Switch */}
                  <div className="flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10">
                    <div>
                      <div className="font-semibold text-[11px]">अगला पेज स्वतः पढ़ें</div>
                      <div className="text-[10px] opacity-60">पेज खत्म होने पर स्वतः अगला पेज शुरू करें</div>
                    </div>
                    <button
                      onClick={() => setAutoReadNextPage((v) => !v)}
                      className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                        autoReadNextPage ? 'bg-amber-500' : 'bg-stone-600'
                      }`}
                      title="Toggle auto-read next page"
                    >
                      <div
                        className={`h-3.5 w-3.5 rounded-full bg-white transition-transform transform absolute top-0.5 left-0.5 ${
                          autoReadNextPage ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Extracted Page OCR Text Snippet */}
                  <div className="space-y-1 pt-1 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-semibold opacity-90">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-amber-500" />
                        <span>पेज {currentPage} का मूल टेक्स्ट (Archive OCR)</span>
                      </span>
                      {hasTextForPage === false && (
                        <span className="text-[10px] text-amber-500">चित्र / आवरण</span>
                      )}
                    </div>
                    <div className="max-h-20 overflow-y-auto rounded-lg bg-black/10 dark:bg-black/30 p-2 text-[10.5px] leading-relaxed text-stone-600 dark:text-stone-300 font-sans scrollbar-thin">
                      {currentPageText ? (
                        currentPageText
                      ) : isAudioLoading ? (
                        <span className="italic opacity-60">Archive से टेक्स्ट प्राप्त किया जा रहा है...</span>
                      ) : (
                        <span className="italic opacity-60">
                          इस पृष्ठ पर कोई मुद्रित पाठ नहीं मिला (चित्र या आवरण हो सकता है)।
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bookmark / Library Button */}
          <button
            onClick={toggleLibrary}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
              isSavedInLibrary ? 'bg-amber-600 text-white' : currentTheme.controlBtn
            }`}
            title={isSavedInLibrary ? 'Saved in Library' : 'Add to Library'}
          >
            {isSavedInLibrary ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${currentTheme.controlBtn}`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN READING CANVAS VIEWPORT (Native desktop PDF scroll container) */}
      <main
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-1 ${currentTheme.canvasBg} overflow-auto select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-default'
        }`}
        style={{
          overscrollBehavior: 'contain',
        }}
      >
        {/* Floating Desktop PDF Viewer Zoom Controls (Sticky & Synchronized) */}
        <div className="sticky top-3 z-30 flex items-center justify-center pointer-events-none mb-[-42px]">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-black/15 dark:border-white/15 bg-black/85 dark:bg-stone-950/90 backdrop-blur-md px-3.5 py-1.5 text-white text-xs shadow-2xl">
            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-amber-400 cursor-pointer transition-colors rounded-full hover:bg-white/10"
              title="Zoom Out (Ctrl - or Touchpad Pinch In)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            {/* Synchronized Zoom Percentage Display */}
            <button
              onClick={handleResetZoom}
              className="font-mono text-[11px] px-2 font-semibold text-amber-400 min-w-[50px] text-center hover:underline cursor-pointer"
              title="Click to reset zoom to 100% (Ctrl 0)"
            >
              {Math.round(pageZoom)}%
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-amber-400 cursor-pointer transition-colors rounded-full hover:bg-white/10"
              title="Zoom In (Ctrl + or Touchpad Pinch Out)"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <span className="opacity-25 select-none">|</span>

            {/* Reset Zoom */}
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-sans flex items-center gap-1 text-stone-200 hover:text-white cursor-pointer transition-colors"
              title="Reset Zoom to 100% (Ctrl 0)"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>

            {/* Fit Width */}
            <button
              onClick={handleFitWidth}
              className="hidden sm:flex px-2 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-sans items-center gap-1 text-stone-200 hover:text-white cursor-pointer transition-colors"
              title="Fit Page to Window Width"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Fit Width</span>
            </button>

            {/* Fit Page */}
            <button
              onClick={handleFitPage}
              className="hidden md:flex px-2 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-sans items-center gap-1 text-stone-200 hover:text-white cursor-pointer transition-colors"
              title="Fit Entire Page to Window Height"
            >
              <Eye className="h-3 w-3" />
              <span>Fit Page</span>
            </button>

            <span className="hidden lg:inline opacity-25 select-none">|</span>
            <span className="hidden lg:inline text-[10px] text-stone-400 font-sans">
              Touchpad: 2-finger scroll & pinch zoom
            </span>
          </div>
        </div>

        {/* Left Navigation Zone (Click to go Previous Page) */}
        <div
          onClick={(e) => {
            if (pageZoom <= 100) goToPrevPage();
          }}
          className={`absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-20 flex items-center justify-start pl-3 ${
            pageZoom <= 100 ? 'cursor-w-resize group' : 'pointer-events-none'
          }`}
          title="Previous Page (← Arrow Left)"
        >
          <button
            disabled={currentPage <= 1}
            className={`h-11 w-11 rounded-full border flex items-center justify-center opacity-0 group-hover:opacity-90 disabled:opacity-0 transition-all shadow-xl cursor-pointer ${currentTheme.headerBg} border-black/10 dark:border-white/20`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>

        {/* Right Navigation Zone (Click to go Next Page) */}
        <div
          onClick={(e) => {
            if (pageZoom <= 100) goToNextPage();
          }}
          className={`absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-20 flex items-center justify-end pr-3 ${
            pageZoom <= 100 ? 'cursor-e-resize group' : 'pointer-events-none'
          }`}
          title="Next Page (→ Arrow Right)"
        >
          <button
            disabled={currentPage >= totalPages}
            className={`h-11 w-11 rounded-full border flex items-center justify-center opacity-0 group-hover:opacity-90 disabled:opacity-0 transition-all shadow-xl cursor-pointer ${currentTheme.headerBg} border-black/10 dark:border-white/20`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Scaled PDF Document Stage */}
        <div className="min-h-full min-w-full flex items-center justify-center p-4 sm:p-8 md:p-12 pt-14">
          <div
            ref={pageWrapperRef}
            className="relative shrink-0 transition-[width] duration-100 ease-out flex flex-col items-center justify-center"
            style={{
              width: `${Math.round(850 * (pageZoom / 100))}px`,
              maxWidth: 'none',
            }}
          >
            {pageImageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs rounded-xl z-10 text-white">
                <Loader2 className="h-9 w-9 animate-spin text-amber-400 mb-2" />
                <div className="font-serif text-xs font-semibold">Loading Page {currentPage}...</div>
              </div>
            )}

            <img
              key={`page-${activeArchiveReader.identifier}-${currentPage}-${targetWidth}`}
              src={pageImageUrl}
              alt={`Page ${currentPage} of ${activeArchiveReader.title}`}
              onLoadStart={() => setPageImageLoading(true)}
              onLoad={() => setPageImageLoading(false)}
              onError={(e) => {
                setPageImageLoading(false);
                const target = e.target as HTMLImageElement;
                const fallbackUrl = `https://archive.org/download/${activeArchiveReader.identifier}/page/leaf${currentPage}_medium.jpg`;
                if (target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                }
              }}
              draggable={false}
              className={`w-full h-auto object-contain rounded-lg ${currentTheme.pageShadow} transition-filter duration-200 select-none`}
              style={{
                filter: getFilterStyle(),
                imageRendering: pageZoom > 100 ? 'high-quality' : 'auto',
              }}
            />
          </div>
        </div>
      </main>

      {/* 3. BOTTOM SCRUBBER & READING PROGRESS FOOTER */}
      <footer
        className={`flex h-12 items-center justify-between border-t ${currentTheme.footerBg} px-4 sm:px-6 text-xs shrink-0 z-30 transition-colors`}
      >
        {/* Prev Page Button */}
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
            max={totalPages}
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
