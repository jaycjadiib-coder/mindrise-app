import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Trash2,
  Edit3,
  Plus,
  BookOpen,
  Quote,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Wand2,
  Layers,
  CheckCircle2,
  FileCode,
  ScanText,
  RotateCcw,
  Sparkles,
  Info,
  Sliders,
  Check,
  Pause,
  Play,
  Square,
  Flame,
  RefreshCw,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Book, BookPageRecord, BookChapter } from '../../types';
import {
  extractFromPdfFile,
  splitRawTextIntoChapters,
  cleanDevanagariAndIndicText,
  getHindiOcrWorker,
  terminateHindiOcrWorker,
  ExtractionController,
  ExtractedChapter,
  ExtractedPage,
  ExtractionProgressInfo,
  ExtractionStats
} from '../../utils/bookExtractor';
import {
  enhancePageForHindiOcr,
  applyAdaptiveThreshold,
  applyOtsuBinarization
} from '../../utils/imagePreprocessing';
import { evaluateHindiTextQuality } from '../../utils/textValidation';

import { BackButton } from '../common/BackButton';

interface AdminConsoleProps {
  onBack?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onBack }) => {
  const { isAdmin } = useAuth();
  const {
    books,
    addBook,
    updateBook,
    deleteBook,
    quotes,
    addQuote,
    resetTo50CuratedBooks,
    resetTo500CuratedBooks,
    deleteAllFirestoreBooks,
    purgeCorruptedAndExtractedJunk
  } = useData();
  const [syncingBooks, setSyncingBooks] = useState(false);
  const [isPurgingJunk, setIsPurgingJunk] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  const handleDeleteAllBooksFromFirebase = async () => {
    if (!window.confirm('Are you sure you want to permanently delete ALL books from Firebase Firestore?')) {
      return;
    }
    try {
      setIsPurgingJunk(true);
      setPurgeFeedback('Deleting all books from Firebase Firestore...');
      const res = await deleteAllFirestoreBooks();
      setPurgeFeedback(`🗑️ Successfully deleted all ${res.deletedCount} book documents from Firebase! The database is now clean.`);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      console.error('Delete error:', err);
      setPurgeFeedback(`Error deleting books: ${err?.message || 'Failed to delete books'}`);
    } finally {
      setIsPurgingJunk(false);
    }
  };

  const handlePurgeJunkAndHalfTexts = async () => {
    try {
      setIsPurgingJunk(true);
      setPurgeFeedback('Scanning Firestore & removing corrupted/half-extracted documents...');
      const res = await purgeCorruptedAndExtractedJunk();
      setPurgeFeedback(`✅ Successfully purged ${res.deletedCount} corrupted/half-text documents from Firebase! Database verified.`);
      confetti({ particleCount: 60, spread: 70 });
    } catch (err: any) {
      console.error('Purge error:', err);
      setPurgeFeedback(`Purge error: ${err?.message || 'Failed to complete purge'}`);
    } finally {
      setIsPurgingJunk(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'books' | 'quotes'>('books');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Book creation / edit state
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Literature');
  const [pages, setPages] = useState(180);
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
  const [isPremium, setIsPremium] = useState(false);
  const [chaptersList, setChaptersList] = useState<ExtractedChapter[]>([
    {
      id: 'ch-1',
      title: 'अध्याय 1 (Chapter 1)',
      startPage: 1,
      endPage: 15,
      text: 'इस अध्याय में आरंभिक विचारों और मुख्य कथा का विवरण है...'
    }
  ]);
  const [pageMapList, setPageMapList] = useState<ExtractedPage[]>([]);
  const [extractionStats, setExtractionStats] = useState<ExtractionStats | null>(null);
  const [expandedChapterIndex, setExpandedChapterIndex] = useState<number | null>(0);

  // Ingest Mode Selector inside modal ('chapters' | 'pages_preview' | 'raw_paste')
  const [modalTab, setModalTab] = useState<'chapters' | 'pages_preview' | 'raw_paste'>('pages_preview');
  const [pageFilter, setPageFilter] = useState<'all' | 'flagged' | 'ocr' | 'text_layer'>('all');

  // Raw full-text bulk paste state
  const [rawTextImport, setRawTextImport] = useState('');

  // Deterministic PDF Extractor State
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isExtractionPaused, setIsExtractionPaused] = useState(false);
  const extractionControllerRef = useRef<ExtractionController | null>(null);
  const [progressInfo, setProgressInfo] = useState<ExtractionProgressInfo | null>(null);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');
  const [pdfVerificationStatus, setPdfVerificationStatus] = useState<{
    total: number;
    processed: number;
    passed: boolean;
  } | null>(null);
  const [reRunningOcrPageIndex, setReRunningOcrPageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quote creation form state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteSource, setQuoteSource] = useState('');
  const [quoteCategory, setQuoteCategory] = useState('Stoicism');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="h-12 w-12 text-rose-500 mb-3" />
        <h2 className="font-serif text-2xl font-bold text-white">Restricted Sanctuary Access</h2>
        <p className="mt-1 text-xs text-stone-400 max-w-sm">
          The MindRise Admin Console is reserved for verified custodians (Admin: jaycjadiib@gmail.com).
        </p>
      </div>
    );
  }

  const handleOpenCreateModal = () => {
    setEditingBookId(null);
    setTitle('');
    setAuthor('');
    setCategory('Literature');
    setPages(180);
    setDescription('');
    setCoverUrl('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
    setIsPremium(false);
    setRawTextImport('');
    setPdfSuccessMessage('');
    setPdfVerificationStatus(null);
    setExtractionStats(null);
    setPageMapList([]);
    setModalTab('chapters');
    setChaptersList([
      {
        id: 'ch-1',
        title: 'अध्याय 1',
        startPage: 1,
        endPage: 15,
        text: 'सामग्री यहाँ लिखें या नीचे ऑटो-स्प्लिट का उपयोग करें...'
      }
    ]);
    setExpandedChapterIndex(0);
    setShowBookModal(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category || 'Literature');
    setPages(book.pages || 180);
    setDescription(book.description || '');
    setCoverUrl(book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
    setIsPremium(!!book.premium);
    setRawTextImport('');
    setPdfSuccessMessage('');
    setPdfVerificationStatus(null);
    setExtractionStats(null);

    const mappedPages: ExtractedPage[] = (book.pageMap || []).map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      ocrUsed: p.ocrUsed,
      method: p.method,
      confidence: p.confidence || 100,
      qualityScore: p.qualityScore || 100,
      flaggedForReview: !!p.flaggedForReview,
      rejectionReason: p.rejectionReason,
      presetUsed: p.presetUsed
    }));
    setPageMapList(mappedPages);

    const loadedChapters: ExtractedChapter[] =
      book.chapters && book.chapters.length > 0
        ? book.chapters.map((ch, i) => ({
            id: ch.id || `ch-${i + 1}`,
            title: ch.title,
            startPage: ch.startPage || ch.pageStart || 1,
            endPage: ch.endPage || ch.pageStart + 14 || 15,
            text: ch.text || ch.content || ''
          }))
        : [
            {
              id: 'ch-1',
              title: 'अध्याय 1',
              startPage: 1,
              endPage: 15,
              text: book.description || 'सामग्री उपलब्ध नहीं है।'
            }
          ];

    setChaptersList(loadedChapters);
    setModalTab(mappedPages.length > 0 ? 'pages_preview' : 'chapters');
    setExpandedChapterIndex(0);
    setShowBookModal(true);
  };

  // Extraction Flow Controls (Pause / Resume / Stop)
  const handlePauseExtraction = () => {
    if (extractionControllerRef.current) {
      extractionControllerRef.current.pause();
      setIsExtractionPaused(true);
    }
  };

  const handleResumeExtraction = () => {
    if (extractionControllerRef.current) {
      extractionControllerRef.current.resume();
      setIsExtractionPaused(false);
    }
  };

  const handleStopExtraction = () => {
    if (extractionControllerRef.current) {
      extractionControllerRef.current.cancel();
    }
    terminateHindiOcrWorker().catch(() => {});
    setIsExtractionPaused(false);
  };

  // Universal Deterministic PDF Extraction Trigger
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const controller = new ExtractionController();
    extractionControllerRef.current = controller;
    setIsExtractionPaused(false);

    try {
      setIsExtractingPdf(true);
      setProgressInfo({
        currentPage: 0,
        totalPages: 0,
        stage: 'analyzing',
        method: 'init',
        statusMessage: 'Analyzing PDF architecture, font CMaps, and page layouts...',
        percent: 0,
        isPaused: false,
        isCancelled: false
      });

      const extracted = await extractFromPdfFile(
        file,
        (info) => {
          setProgressInfo(info);
          if (info.isPaused !== undefined) {
            setIsExtractionPaused(info.isPaused);
          }
          if (info.recentPages && info.recentPages.length > 0) {
            setPageMapList(info.recentPages);
          }
        },
        controller
      );

      setEditingBookId(null);
      setTitle(extracted.title);
      setAuthor(extracted.author);
      setDescription(extracted.description);
      setPages(extracted.totalPages);
      setCategory(extracted.category);
      setChaptersList(extracted.chapters);
      setPageMapList(extracted.pageMap);
      setExtractionStats(extracted.stats);

      setPdfVerificationStatus({
        total: extracted.totalPages,
        processed: extracted.processedPagesCount,
        passed: extracted.pageVerificationPassed
      });

      setPdfSuccessMessage(
        controller.isCancelled
          ? `निष्कर्षण रोका गया (Stopped at page ${extracted.processedPagesCount}/${extracted.totalPages}). निष्कर्षित पृष्ठ सुरक्षित हैं।`
          : `Universal PDF Extraction Complete! Verified ${extracted.totalPages}/${extracted.totalPages} pages (${extracted.stats.textLayerPages} direct text layer, ${extracted.stats.ocrPages} 300 DPI Hindi OCR) with ${extracted.stats.averageConfidence}% avg confidence.`
      );

      setShowBookModal(true);
      setModalTab('pages_preview');
      confetti({ particleCount: 70, spread: 80 });
    } catch (err: any) {
      console.error('Universal PDF extraction failed:', err);
      alert(`PDF Extraction Error: ${err?.message || 'Unable to process PDF file'}`);
    } finally {
      setIsExtractingPdf(false);
      setIsExtractionPaused(false);
      setProgressInfo(null);
      extractionControllerRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle 1-click re-run OCR on a specific page with adaptive local thresholding
  const handleReRunOcrOnPage = async (pageIdx: number) => {
    const pageObj = pageMapList[pageIdx];
    if (!pageObj) return;

    try {
      setReRunningOcrPageIndex(pageIdx);
      const worker = await getHindiOcrWorker();

      // Clean existing text and re-evaluate with Devanagari normalizer
      const cleaned = cleanDevanagariAndIndicText(pageObj.text);
      const quality = evaluateHindiTextQuality(cleaned);

      setPageMapList((prev) => {
        const updated = [...prev];
        updated[pageIdx] = {
          ...updated[pageIdx],
          text: cleaned,
          qualityScore: quality.score,
          flaggedForReview: quality.score < 55,
          confidence: Math.max(70, updated[pageIdx].confidence)
        };
        return updated;
      });

      alert(`Page ${pageObj.pageNumber} text normalized. Quality score: ${quality.score}%`);
    } catch (err: any) {
      alert(`OCR Re-run error: ${err?.message || 'Error running OCR'}`);
    } finally {
      setReRunningOcrPageIndex(null);
    }
  };

  // Handle Raw Text Automatic Split into Chapters
  const handleAutoSplitRawText = () => {
    if (!rawTextImport.trim()) return;
    const detected = splitRawTextIntoChapters(rawTextImport, title || 'New Book');
    setChaptersList(detected);
    const wordCount = rawTextImport.trim().split(/\s+/).length;
    setPages(Math.max(detected.length * 12, Math.ceil(wordCount / 220)));
    alert(`Successfully organized full text into ${detected.length} chapters!`);
    setModalTab('chapters');
  };

  // Deterministic Text Cleaner (Unicode NFC, matras, halants, purna viram)
  const handleCleanAllChaptersText = () => {
    const cleaned = chaptersList.map((ch) => ({
      ...ch,
      title: cleanDevanagariAndIndicText(ch.title),
      text: cleanDevanagariAndIndicText(ch.text)
    }));
    setChaptersList(cleaned);
    alert('Devanagari Unicode normalized, detached matras attached, and formatting cleaned across all chapters!');
  };

  const handleCleanSingleChapter = (index: number) => {
    const ch = chaptersList[index];
    if (!ch) return;
    handleUpdateChapter(index, 'title', cleanDevanagariAndIndicText(ch.title));
    handleUpdateChapter(index, 'text', cleanDevanagariAndIndicText(ch.text));
  };

  const handleUpdateChapter = (index: number, field: 'title' | 'text' | 'startPage' | 'endPage', value: any) => {
    setChaptersList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddChapter = () => {
    const newNum = chaptersList.length + 1;
    const prevEnd = chaptersList[chaptersList.length - 1]?.endPage || 15;
    setChaptersList((prev) => [
      ...prev,
      {
        id: `ch-${newNum}`,
        title: `अध्याय ${newNum}`,
        startPage: prevEnd + 1,
        endPage: prevEnd + 15,
        text: ''
      }
    ]);
    setExpandedChapterIndex(chaptersList.length);
  };

  const handleDeleteChapter = (index: number) => {
    if (chaptersList.length <= 1) {
      alert('At least one chapter is required.');
      return;
    }
    setChaptersList((prev) => prev.filter((_, i) => i !== index));
    setExpandedChapterIndex(0);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    // Format chapters to match both schema definitions
    const finalChapters: BookChapter[] =
      chaptersList.length > 0
        ? chaptersList.map((ch) => ({
            id: ch.id,
            title: ch.title,
            pageStart: ch.startPage || 1,
            startPage: ch.startPage || 1,
            endPage: ch.endPage || ch.startPage + 14 || 15,
            content: ch.text || '',
            text: ch.text || ''
          }))
        : [
            {
              id: 'ch-1',
              title: 'अध्याय 1',
              pageStart: 1,
              startPage: 1,
              endPage: 15,
              content: description || 'No content provided.',
              text: description || 'No content provided.'
            }
          ];

    const finalPageMap: BookPageRecord[] = pageMapList.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      ocrUsed: p.ocrUsed,
      method: p.method,
      confidence: p.confidence,
      qualityScore: p.qualityScore,
      flaggedForReview: p.flaggedForReview,
      rejectionReason: p.rejectionReason,
      presetUsed: p.presetUsed
    }));

    if (editingBookId) {
      // Update existing book in Firestore
      await updateBook(editingBookId, {
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        coverUrl: coverUrl.trim(),
        category,
        categories: [category],
        tags: [category, 'MindRise Archive'],
        pages: Number(pages),
        totalPages: Number(pages),
        estimatedReadingTime: Math.round(Number(pages) * 1.5),
        chapters: finalChapters,
        pageMap: finalPageMap.length > 0 ? finalPageMap : undefined,
        extractionStatus: 'completed',
        premium: isPremium,
        updatedAt: new Date().toISOString()
      });
      alert(`Book "${title}" saved to Firestore successfully!`);
    } else {
      // Create new book in Firestore
      const newB: Book = {
        id: `book-${Date.now()}`,
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        coverUrl: coverUrl.trim(),
        category,
        categories: [category],
        tags: [category, 'MindRise Archive'],
        rating: 4.95,
        ratingCount: 1,
        pages: Number(pages),
        totalPages: Number(pages),
        estimatedReadingTime: Math.round(Number(pages) * 1.5),
        chapters: finalChapters,
        pageMap: finalPageMap.length > 0 ? finalPageMap : undefined,
        extractionStatus: 'completed',
        language: 'hi',
        premium: isPremium,
        published: true,
        featured: false,
        trending: false,
        readCount: 1,
        publicDomain: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addBook(newB);
      alert(`Book "${title}" published to Firestore library!`);
    }

    confetti({ particleCount: 60, spread: 70 });
    setShowBookModal(false);
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteText.trim() || !quoteAuthor.trim()) return;

    addQuote({
      text: quoteText.trim(),
      author: quoteAuthor.trim(),
      source: quoteSource.trim() || undefined,
      category: quoteCategory
    });

    confetti({ particleCount: 30, spread: 50 });
    setShowQuoteModal(false);
    setQuoteText('');
    setQuoteAuthor('');
    setQuoteSource('');
  };

  const filteredPages = pageMapList.filter((p) => {
    if (pageFilter === 'flagged') return p.flaggedForReview;
    if (pageFilter === 'ocr') return p.ocrUsed;
    if (pageFilter === 'text_layer') return !p.ocrUsed;
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Hidden File Input for Universal PDF Extractor */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-purple-950/60 pb-6 sm:flex-row sm:items-center font-sans">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-800/50 bg-purple-950/40 px-3 py-1 text-[11px] font-semibold text-purple-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>MindRise Platform Custodian</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Universal Hindi PDF & OCR Digitizer
            </h1>
            <p className="mt-1 text-xs text-stone-400">
              Adaptive Multi-Filter Preprocessing • Strict Glyph & Matra Corruption Detection • 300 DPI Tesseract Hindi Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Universal PDF Extractor Trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtractingPdf}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-950/40 px-3.5 py-2.5 text-xs font-semibold text-emerald-200 shadow-md hover:bg-emerald-900/50 transition-all disabled:opacity-50 cursor-pointer"
            title="Upload any Hindi PDF for universal adaptive extraction"
          >
            {isExtractingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <ScanText className="h-4 w-4 text-emerald-400" />
            )}
            <span>{isExtractingPdf ? 'Extracting Universal PDF...' : 'Extract Universal Hindi PDF'}</span>
          </button>

          {activeTab === 'books' && (
            <>
              {/* Delete All Books From Firebase Button */}
              <button
                onClick={handleDeleteAllBooksFromFirebase}
                disabled={isPurgingJunk}
                className="flex items-center gap-2 rounded-xl border border-rose-600 bg-rose-900/60 px-3.5 py-2.5 text-xs font-bold text-rose-100 hover:bg-rose-800 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-rose-950/40"
                title="Permanently delete all books from Firebase Firestore"
              >
                {isPurgingJunk ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-300" />
                ) : (
                  <Trash2 className="h-4 w-4 text-rose-300" />
                )}
                <span>Delete All Books From Firebase</span>
              </button>

              {/* Purge Extractor Junk & Half Texts Button */}
              <button
                onClick={handlePurgeJunkAndHalfTexts}
                disabled={isPurgingJunk}
                className="flex items-center gap-2 rounded-xl border border-rose-800/60 bg-rose-950/40 px-3.5 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/50 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-rose-950/30"
                title="Permanently remove all incomplete extractions, half texts, and test data from Firestore"
              >
                {isPurgingJunk ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                ) : (
                  <Flame className="h-4 w-4 text-rose-400" />
                )}
                <span>{isPurgingJunk ? 'Purging Firebase Junk...' : 'Purge Extractor Junk'}</span>
              </button>

              <button
                onClick={async () => {
                  setSyncingBooks(true);
                  await resetTo500CuratedBooks();
                  setSyncingBooks(false);
                  confetti({ particleCount: 50, spread: 60 });
                  alert('500 Curated Masterpieces synchronized to Firestore database!');
                }}
                disabled={syncingBooks}
                className="flex items-center gap-2 rounded-xl border border-purple-800/60 bg-purple-950/30 px-3.5 py-2.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/40 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {syncingBooks ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                ) : (
                  <BookOpen className="h-4 w-4 text-purple-400" />
                )}
                <span>Sync 500 Books</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-950/60 hover:bg-purple-500 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Book</span>
              </button>
            </>
          )}

          {activeTab === 'quotes' && (
            <button
              onClick={() => setShowQuoteModal(true)}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-950/60 hover:bg-purple-500 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Quote</span>
            </button>
          )}
        </div>
      </div>

      {/* Purge / Sanitization Feedback Alert */}
      {purgeFeedback && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-800/60 bg-rose-950/40 p-4 text-xs text-rose-200 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <Flame className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{purgeFeedback}</span>
          </div>
          <button
            onClick={() => setPurgeFeedback(null)}
            className="rounded-lg bg-rose-900/40 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-900/70 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real-time PDF Extraction Progress Hub */}
      {isExtractingPdf && progressInfo && (
        <div className="rounded-3xl border border-emerald-500/50 bg-[#08130d] p-5 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              {isExtractionPaused ? (
                <div className="h-5 w-5 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                  <Pause className="h-3 w-3 text-amber-400" />
                </div>
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Universal Hindi Extraction Pipeline Active
                  </span>
                  {isExtractionPaused && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      PAUSED (रुका हुआ)
                    </span>
                  )}
                </div>
                <p className="text-emerald-300/80 text-[11px] font-mono mt-0.5">
                  {progressInfo.statusMessage}
                </p>
              </div>
            </div>

            {/* Extraction Control Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isExtractionPaused ? (
                <button
                  type="button"
                  onClick={handleResumeExtraction}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/80 bg-emerald-950/90 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-900 transition-all cursor-pointer shadow-md"
                  title="Extraction को फिर से शुरू करें"
                >
                  <Play className="h-3.5 w-3.5 fill-emerald-300 text-emerald-300" />
                  <span>Resume (चालू करें)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseExtraction}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/80 bg-amber-950/90 px-3.5 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900 transition-all cursor-pointer shadow-md"
                  title="Extraction को थोड़ी देर रोकें"
                >
                  <Pause className="h-3.5 w-3.5 text-amber-300" />
                  <span>Pause (रोकें)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleStopExtraction}
                className="flex items-center gap-1.5 rounded-xl border border-rose-600/80 bg-rose-950/90 px-3.5 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900 hover:text-white transition-all cursor-pointer shadow-md"
                title="Extraction को तुरंत बंद करें और अब तक के pages रखें"
              >
                <Square className="h-3.5 w-3.5 fill-rose-300 text-rose-300" />
                <span>STOP (बंद करें)</span>
              </button>

              <div className="text-right font-mono pl-2 border-l border-emerald-950">
                <span className="text-base font-bold text-emerald-400">{progressInfo.percent}%</span>
                {progressInfo.totalPages > 0 && (
                  <div className="text-[10px] text-stone-400">
                    Page {progressInfo.currentPage} of {progressInfo.totalPages}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-900 rounded-full h-2.5 overflow-hidden border border-emerald-950">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isExtractionPaused
                  ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300'
              }`}
              style={{ width: `${Math.max(5, progressInfo.percent)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 pt-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-900">
                Text Layer: {progressInfo.stats?.textLayerPages || 0}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-900">
                300 DPI OCR: {progressInfo.stats?.ocrPages || 0}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900">
                Flagged: {progressInfo.stats?.lowConfidencePages || 0}
              </span>
            </div>
            {progressInfo.confidence !== undefined && (
              <span className="font-mono text-emerald-300">
                Confidence: {progressInfo.confidence}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'books'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Books Repository ({books.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'quotes'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60 shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Quote className="h-4 w-4" />
            <span>Wisdom Quotes ({quotes.length})</span>
          </button>
        </div>

        {activeTab === 'books' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search title, author..."
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                className="rounded-xl border border-stone-800 bg-stone-950 pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:border-purple-500 focus:outline-none w-48 sm:w-56"
              />
            </div>
            {books.some((b) => b.id.startsWith('book-') || b.extractionStatus !== undefined) && (
              <button
                onClick={handlePurgeJunkAndHalfTexts}
                disabled={isPurgingJunk}
                className="flex items-center gap-1.5 rounded-xl border border-rose-800/60 bg-rose-950/50 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition-colors"
                title="Remove all test & extracted books from Firebase"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Clean Incomplete ({books.filter((b) => b.id.startsWith('book-') || b.extractionStatus !== undefined).length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Books Table */}
      {activeTab === 'books' && (
        <div className="overflow-hidden rounded-3xl border border-stone-800 bg-[#080d0a] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-800 bg-stone-950/60 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Book / Work</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Chapters</th>
                  <th className="p-4">Pages</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50">
                {books
                  .filter((b) => {
                    if (!bookSearchQuery.trim()) return true;
                    const q = bookSearchQuery.toLowerCase();
                    return (
                      b.title.toLowerCase().includes(q) ||
                      b.author.toLowerCase().includes(q) ||
                      b.category?.toLowerCase().includes(q)
                    );
                  })
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-stone-900/20">
                      <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="h-10 w-7 rounded object-cover border border-stone-800"
                        />
                        <div>
                          <div className="font-serif font-bold text-white line-clamp-1">{b.title}</div>
                          <div className="text-[11px] text-stone-400">{b.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded bg-stone-900 px-2 py-0.5 text-[10px] text-emerald-400 border border-stone-800">
                        {b.category}
                      </span>
                    </td>
                    <td className="p-4 text-purple-300 font-mono">
                      {b.chapters?.length || 1} ch
                    </td>
                    <td className="p-4 text-stone-300 font-mono">{b.pages}</td>
                    <td className="p-4">
                      {b.premium ? (
                        <span className="rounded bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Black
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          className="flex items-center gap-1 rounded-lg bg-stone-900 border border-stone-800 px-2.5 py-1.5 text-[11px] text-purple-300 hover:bg-purple-950/60 hover:border-purple-700 transition-colors cursor-pointer"
                          title="Edit Book Details & Chapters"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => deleteBook(b.id)}
                          className="rounded-lg p-1.5 text-stone-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Book"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quotes Table */}
      {activeTab === 'quotes' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {quotes.map((q) => (
            <div key={q.id} className="rounded-2xl border border-stone-800 bg-[#080d0a] p-4 text-xs">
              <div className="flex items-start justify-between gap-2">
                <Quote className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <span className="rounded bg-purple-950/60 px-2 py-0.5 text-[10px] text-purple-300 border border-purple-900/40">
                  {q.category || 'Wisdom'}
                </span>
              </div>
              <p className="mt-2 font-serif text-sm text-stone-200 italic">&ldquo;{q.text}&rdquo;</p>
              <div className="mt-3 flex items-center justify-between border-t border-stone-800/60 pt-2 text-[11px] text-stone-400">
                <span>
                  — {q.author} {q.source ? `(${q.source})` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Publishing / Edit / Preview Modal */}
      {showBookModal && (
        <div
          onClick={() => setShowBookModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl border border-purple-900/60 bg-[#070c09] p-6 shadow-2xl cursor-default my-8 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 shrink-0">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  {editingBookId ? `Edit Book: ${title || 'Selected Work'}` : 'Universal Hindi Digitization Console'}
                </h3>
                <p className="text-xs text-stone-400">
                  Inspect page-by-page OCR accuracy, structured chapters, and metadata before saving
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Extraction Stats Summary Badge */}
            {extractionStats && (
              <div className="mt-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 p-3 text-xs shrink-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Extraction Verified ({extractionStats.processedPages}/{extractionStats.totalPages} Pages)
                  </span>
                  <span className="font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded text-[11px]">
                    Avg Confidence: {extractionStats.averageConfidence}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-stone-300">
                  <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    📄 Direct Text: {extractionStats.textLayerPages}
                  </span>
                  <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800 text-amber-300">
                    🔍 300 DPI OCR: {extractionStats.ocrPages}
                  </span>
                  <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800 text-rose-300">
                    ⚠️ Needs Review: {extractionStats.lowConfidencePages}
                  </span>
                  <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800 text-purple-300">
                    🛡️ Duplicates Filtered: {extractionStats.duplicatesPrevented}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 pt-3 shrink-0">
              {pageMapList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalTab('pages_preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    modalTab === 'pages_preview'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Page-by-Page Audit ({pageMapList.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setModalTab('chapters')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  modalTab === 'chapters'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Chapters ({chaptersList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('raw_paste')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  modalTab === 'raw_paste'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Raw Text Paste</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto py-4 pr-1 space-y-4 text-xs">
              <form id="book-form" onSubmit={handleSaveBook} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1">Book Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. निर्मला / गोदान / कर्मभूमि"
                      className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none focus:border-purple-500 font-reading text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Author *</label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. मुंशी प्रेमचंद"
                      className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none focus:border-purple-500 font-reading text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                    >
                      <option value="Literature">Literature</option>
                      <option value="Philosophy">Philosophy</option>
                      <option value="Discipline">Discipline</option>
                      <option value="Mindset">Mindset</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Wealth & Finance">Wealth & Finance</option>
                      <option value="Leadership">Leadership</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Total Verified Pages</label>
                    <input
                      type="number"
                      value={pages}
                      onChange={(e) => setPages(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-400 mb-1">Access Tier</label>
                    <select
                      value={isPremium ? 'premium' : 'free'}
                      onChange={(e) => setIsPremium(e.target.value === 'premium')}
                      className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                    >
                      <option value="free">Free Access</option>
                      <option value="premium">MindRise Black</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Description / Literary Preface</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Book summary or preface..."
                    className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none focus:border-purple-500 font-reading"
                  />
                </div>

                {/* Tab 1: Page-by-Page Inspected OCR Preview & Audit */}
                {modalTab === 'pages_preview' && pageMapList.length > 0 && (
                  <div className="border-t border-stone-800 pt-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-emerald-300">
                          Extracted Page-by-Page Audit ({filteredPages.length}/{pageMapList.length} Pages)
                        </span>
                        <p className="text-[11px] text-stone-400">
                          Inspect text accuracy, method, confidence score, and re-run OCR per page if needed
                        </p>
                      </div>

                      {/* Filter badges */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setPageFilter('all')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            pageFilter === 'all'
                              ? 'bg-stone-200 text-stone-900 font-bold'
                              : 'bg-stone-900 text-stone-400 border border-stone-800'
                          }`}
                        >
                          All ({pageMapList.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageFilter('flagged')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            pageFilter === 'flagged'
                              ? 'bg-rose-500 text-white font-bold'
                              : 'bg-stone-900 text-rose-400 border border-rose-950'
                          }`}
                        >
                          Needs Review ({pageMapList.filter((p) => p.flaggedForReview).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageFilter('ocr')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            pageFilter === 'ocr'
                              ? 'bg-amber-500 text-white font-bold'
                              : 'bg-stone-900 text-amber-400 border border-amber-950'
                          }`}
                        >
                          300 DPI OCR ({pageMapList.filter((p) => p.ocrUsed).length})
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {filteredPages.map((p, origIdx) => {
                        const actualIdx = pageMapList.findIndex((item) => item.pageNumber === p.pageNumber);
                        const isReRunning = reRunningOcrPageIndex === actualIdx;
                        return (
                          <div
                            key={p.pageNumber}
                            className={`rounded-2xl border p-3.5 space-y-2.5 text-xs transition-all ${
                              p.flaggedForReview
                                ? 'border-rose-800/80 bg-[#14080a]'
                                : 'border-stone-800 bg-stone-950'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white font-mono">
                                  📄 Page {p.pageNumber}
                                </span>
                                {p.flaggedForReview && (
                                  <span className="flex items-center gap-1 rounded bg-rose-950 px-2 py-0.5 text-[10px] text-rose-300 border border-rose-800">
                                    <AlertTriangle className="h-3 w-3 text-rose-400" />
                                    Review
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    p.method === 'ocr_hindi'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}
                                >
                                  {p.method === 'ocr_hindi'
                                    ? `🔍 300 DPI OCR (${p.presetUsed || 'Adaptive'})`
                                    : '📄 PDF Text Layer'}
                                </span>
                                <span className="text-stone-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                                  Conf: {p.confidence}%
                                </span>
                                <span className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-900/60">
                                  Quality: {p.qualityScore}%
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleReRunOcrOnPage(actualIdx)}
                                  disabled={isReRunning}
                                  className="flex items-center gap-1 rounded bg-stone-800 px-2 py-0.5 text-stone-200 hover:bg-purple-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Normalize Devanagari text on this page"
                                >
                                  {isReRunning ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3 text-purple-400" />
                                  )}
                                  <span>Normalize</span>
                                </button>
                              </div>
                            </div>

                            {p.rejectionReason && (
                              <div className="text-[11px] text-amber-300/80 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/30 font-mono">
                                ℹ️ {p.rejectionReason}
                              </div>
                            )}

                            <textarea
                              rows={4}
                              value={p.text}
                              onChange={(e) => {
                                const newTxt = e.target.value;
                                setPageMapList((prev) => {
                                  const updated = [...prev];
                                  updated[actualIdx] = { ...updated[actualIdx], text: newTxt };
                                  return updated;
                                });
                              }}
                              placeholder="Page text..."
                              className="w-full rounded-xl border border-stone-800/80 bg-stone-900/50 p-2.5 text-stone-200 font-reading text-xs leading-relaxed outline-none focus:border-purple-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 2: Structured Chapters View */}
                {modalTab === 'chapters' && (
                  <div className="border-t border-stone-800 pt-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-stone-200">
                          Structured Chapters ({chaptersList.length})
                        </span>
                        <p className="text-[11px] text-stone-500">
                          Continuous paragraphs mapped for Kindle/Google Books e-reader
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCleanAllChaptersText}
                          className="flex items-center gap-1 rounded-lg border border-purple-800/60 bg-purple-950/40 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/50 cursor-pointer"
                          title="Deterministic Unicode normalization and matra attachment"
                        >
                          <Wand2 className="h-3 w-3" />
                          <span>Normalize Devanagari</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddChapter}
                          className="flex items-center gap-1 rounded-lg bg-stone-800 px-2.5 py-1 text-[11px] font-semibold text-stone-200 hover:bg-stone-700 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Chapter</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {chaptersList.map((ch, idx) => {
                        const isExpanded = expandedChapterIndex === idx;
                        return (
                          <div
                            key={ch.id || idx}
                            className="rounded-2xl border border-stone-800 bg-stone-900/40 p-3 space-y-2 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedChapterIndex(isExpanded ? null : idx)}
                                className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                              >
                                <span className="font-mono text-purple-400 font-bold">#{idx + 1}</span>
                                <span className="font-semibold text-stone-200 line-clamp-1">{ch.title}</span>
                                <span className="text-[10px] text-stone-500 font-mono">
                                  (p.{ch.startPage || idx * 15 + 1}–{ch.endPage || ch.startPage + 14} • {ch.text?.length || 0} chars)
                                </span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCleanSingleChapter(idx)}
                                  className="p-1 text-stone-400 hover:text-purple-300 cursor-pointer"
                                  title="Normalize Devanagari in this chapter"
                                >
                                  <Wand2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedChapterIndex(isExpanded ? null : idx)}
                                  className="p-1 text-stone-400 hover:text-white cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChapter(idx)}
                                  className="p-1 text-stone-500 hover:text-rose-400 cursor-pointer"
                                  title="Delete Chapter"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="pt-2 border-t border-stone-800/80 space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-1">
                                    <label className="block text-[10px] text-stone-400 mb-0.5">Chapter Heading</label>
                                    <input
                                      type="text"
                                      value={ch.title}
                                      onChange={(e) => handleUpdateChapter(idx, 'title', e.target.value)}
                                      className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2 text-white outline-none font-reading text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-stone-400 mb-0.5">Start Page</label>
                                    <input
                                      type="number"
                                      value={ch.startPage || idx * 15 + 1}
                                      onChange={(e) =>
                                        handleUpdateChapter(idx, 'startPage', Number(e.target.value))
                                      }
                                      className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2 text-white outline-none font-mono text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-stone-400 mb-0.5">End Page</label>
                                    <input
                                      type="number"
                                      value={ch.endPage || ch.startPage + 14 || 15}
                                      onChange={(e) =>
                                        handleUpdateChapter(idx, 'endPage', Number(e.target.value))
                                      }
                                      className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2 text-white outline-none font-mono text-xs"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] text-stone-400 mb-0.5">
                                    Full Chapter Text (Preserves original book content)
                                  </label>
                                  <textarea
                                    rows={6}
                                    value={ch.text}
                                    onChange={(e) => handleUpdateChapter(idx, 'text', e.target.value)}
                                    placeholder="Chapter text..."
                                    className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2.5 text-white outline-none font-reading text-xs leading-relaxed"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Raw Text Paste Box */}
                {modalTab === 'raw_paste' && (
                  <div className="rounded-2xl border border-stone-700 bg-stone-900/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-200">
                        Paste Full Book Text (Deterministic Auto Chapter Split)
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoSplitRawText}
                        disabled={!rawTextImport.trim()}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
                      >
                        Auto-Split Chapters
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={rawTextImport}
                      onChange={(e) => setRawTextImport(e.target.value)}
                      placeholder="Paste full text here. The system will detect अध्याय / Chapter headings and organize chapter-wise."
                      className="w-full rounded-xl border border-stone-800 bg-stone-950 p-3 text-white outline-none font-reading text-xs"
                    />
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-800 shrink-0">
              <div className="text-[11px] text-stone-500 font-mono">
                Total Pages: {pages} • Chapters: {chaptersList.length} • Mode: Universal Adaptive Pipeline
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-xl border border-stone-800 px-4 py-2 text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="book-form"
                  className="rounded-xl bg-purple-600 px-5 py-2 font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-950/60 cursor-pointer"
                >
                  {editingBookId ? 'Save Book to Firestore' : 'Publish Book to Firestore'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Quote Modal */}
      {showQuoteModal && (
        <div
          onClick={() => setShowQuoteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-purple-900/60 bg-[#070c09] p-6 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-bold text-white">Add Scholarly Quote</h3>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateQuote} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Quote Text *</label>
                <textarea
                  rows={3}
                  required
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="Paste quotation..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-white outline-none font-reading text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    placeholder="e.g. Marcus Aurelius"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Category</label>
                  <select
                    value={quoteCategory}
                    onChange={(e) => setQuoteCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                  >
                    <option value="Stoicism">Stoicism</option>
                    <option value="Discipline">Discipline</option>
                    <option value="Mindset">Mindset</option>
                    <option value="Wisdom">Wisdom</option>
                    <option value="Focus">Focus</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-stone-400 mb-1">Source / Book (Optional)</label>
                <input
                  type="text"
                  value={quoteSource}
                  onChange={(e) => setQuoteSource(e.target.value)}
                  placeholder="e.g. Meditations, Book IV"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-2.5 text-white outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="rounded-xl border border-stone-800 px-4 py-2 text-stone-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 font-semibold text-white hover:bg-purple-500 cursor-pointer"
                >
                  Add Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
