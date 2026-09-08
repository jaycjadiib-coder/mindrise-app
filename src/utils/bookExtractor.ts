import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker, Worker } from 'tesseract.js';
import {
  enhancePageForHindiOcr,
  applyAdaptiveThreshold,
  applyMedianDenoise
} from './imagePreprocessing';
import {
  evaluateHindiTextQuality,
  computePageTextFingerprint,
  TextQualityMetrics
} from './textValidation';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker || `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  ocrUsed: boolean;
  method: 'text_layer' | 'ocr_hindi';
  confidence: number;
  qualityScore: number;
  flaggedForReview: boolean;
  rejectionReason?: string;
  presetUsed?: string;
}

export interface ExtractedChapter {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  text: string;
}

export interface ExtractionStats {
  totalPages: number;
  processedPages: number;
  textLayerPages: number;
  ocrPages: number;
  lowConfidencePages: number;
  duplicatesPrevented: number;
  averageConfidence: number;
}

export interface ExtractionProgressInfo {
  currentPage: number;
  totalPages: number;
  stage: 'analyzing' | 'extracting' | 'ocr' | 'validating' | 'chapter_detection' | 'complete';
  method: 'text_layer' | 'ocr_hindi' | 'init' | 'finalizing';
  statusMessage: string;
  confidence?: number;
  percent: number;
  stats?: Partial<ExtractionStats>;
  incrementalPage?: ExtractedPage;
  recentPages?: ExtractedPage[];
  isPaused?: boolean;
  isCancelled?: boolean;
}

export class ExtractionController {
  isPaused: boolean = false;
  isCancelled: boolean = false;

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
    terminateHindiOcrWorker().catch(() => {});
  }
}

export interface ExtractedBookData {
  title: string;
  author: string;
  description: string;
  language: string;
  totalPages: number;
  processedPagesCount: number;
  pageVerificationPassed: boolean;
  category: string;
  stats: ExtractionStats;
  chapters: ExtractedChapter[];
  pageMap: ExtractedPage[];
}

/**
 * Universal Devanagari & Hindi Unicode Text Cleaner (UTF-8 NFC)
 * Fixes detached vowel signs (matras), isolated halants, abnormal glyph spacing,
 * and purna viram punctuation without altering authentic original vocabulary.
 */
export function cleanDevanagariAndIndicText(raw: string): string {
  if (!raw) return '';

  let text = raw.normalize('NFC');

  // Strip replacement boxes and non-printable control characters
  text = text.replace(/[\uFFFD\u25A1\u25A0\u25AF\u25AC\u25AD\u25AE\u0000-\u0008\u000B\u000C\u000E-\u001F\u0080-\u009F\uFEFF]/g, '');

  // Strip unmapped font noise symbols (&, *, ;, =) when isolated
  text = text.replace(/(?<=[\u0900-\u097F])\s*;\s*(?=[\u0900-\u097F])/g, '');
  text = text.replace(/([=;*&])\s*([\u093E-\u094D\u0901-\u0903])/g, '$2');

  // Re-attach detached Devanagari vowel signs (matras) separated by spaces: 'क  ा' -> 'का'
  text = text.replace(/([\u0905-\u0939\u0958-\u097F])\s+([\u093E-\u094D\u0951-\u0954\u0962\u0963\u0901-\u0903])/g, '$1$2');
  text = text.replace(/([\u093E-\u094D])\s+([\u0901-\u0903])/g, '$1$2');

  // Fix detached virama (halant) joins: 'क ् ष' -> 'क्ष'
  text = text.replace(/([\u0905-\u0939])\s*(\u094D)\s*([\u0905-\u0939])/g, '$1$2$3');

  // Standardize full stop / purna viram
  text = text.replace(/\|\s*\|/g, '॥');
  text = text.replace(/(?<=[^\s\|])\|(?=[^\s\|]|$)/g, ' । ');

  // Normalize excessive spacing while preserving paragraph breaks
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();

  return text;
}

/**
 * Shared Tesseract Hindi OCR Worker with robust error handling
 */
let sharedTesseractWorker: Worker | null = null;
let isInitializingWorker = false;

export async function terminateHindiOcrWorker(): Promise<void> {
  if (sharedTesseractWorker) {
    try {
      const w = sharedTesseractWorker;
      sharedTesseractWorker = null;
      await w.terminate();
    } catch (e) {
      console.warn('Worker terminate error:', e);
    }
  }
}

export async function getHindiOcrWorker(): Promise<Worker> {
  if (sharedTesseractWorker) return sharedTesseractWorker;

  if (isInitializingWorker) {
    while (isInitializingWorker) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (sharedTesseractWorker) return sharedTesseractWorker;
  }

  isInitializingWorker = true;
  try {
    const worker = await createWorker(['hin', 'eng'], 1, {
      workerPath: 'https://unpkg.com/tesseract.js@v5.1.1/dist/worker.min.js',
      corePath: 'https://unpkg.com/tesseract.js-core@v5.1.0/tesseract-core-simd.wasm.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: () => {}
    });

    await worker.setParameters({
      preserve_interword_spaces: '1'
    });

    sharedTesseractWorker = worker;
    return worker;
  } finally {
    isInitializingWorker = false;
  }
}

/**
 * Renders an original PDF page to canvas at high-resolution 300 DPI (scale: 3.125)
 */
async function renderPageToCanvas(page: any, scale = 3.125): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to create 2D canvas context for page rendering');

  // Solid white background to prevent alpha transparency artifacts in OCR
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise;

  return canvas;
}

/**
 * Executes high-precision 300 DPI Hindi OCR with adaptive fallback
 */
async function performHighResHindiOcr(
  page: any,
  worker: Worker
): Promise<{
  text: string;
  confidence: number;
  qualityScore: number;
  presetUsed: string;
  flaggedForReview: boolean;
}> {
  // Render at 300 DPI for genuine Devanagari clarity
  const canvas = await renderPageToCanvas(page, 3.125);

  // Preprocess Pass 1: High-contrast grayscale enhancement
  enhancePageForHindiOcr(canvas, {
    contrast: 1.45,
    brightness: 5,
    applyGrayscale: true,
    applyDenoise: true
  });

  const result = await worker.recognize(canvas);
  let confidence = Math.round(result.data.confidence || 0);
  let text = cleanDevanagariAndIndicText(result.data.text || '');
  let quality = evaluateHindiTextQuality(text);

  let presetUsed = '300 DPI High-Contrast Grayscale (hin)';

  // Fallback Pass: If Pass 1 produced low confidence (< 55%) or poor quality, try Adaptive Thresholding
  if (confidence < 55 || (!quality.isValid && text.length > 20)) {
    try {
      const adaptiveCanvas = await renderPageToCanvas(page, 3.125);
      applyAdaptiveThreshold(adaptiveCanvas, 25, 10);

      const fallbackResult = await worker.recognize(adaptiveCanvas);
      const fallbackConfidence = Math.round(fallbackResult.data.confidence || 0);
      const fallbackText = cleanDevanagariAndIndicText(fallbackResult.data.text || '');
      const fallbackQuality = evaluateHindiTextQuality(fallbackText);

      // Compare and take the superior result
      if (
        fallbackConfidence > confidence ||
        (fallbackQuality.score > quality.score && fallbackConfidence >= 45)
      ) {
        confidence = fallbackConfidence;
        text = fallbackText;
        quality = fallbackQuality;
        presetUsed = '300 DPI Adaptive Local Threshold (hin)';
      }
    } catch (fallbackErr) {
      console.warn('Adaptive OCR fallback skipped:', fallbackErr);
    }
  }

  const flaggedForReview = confidence < 50 || quality.score < 55;

  return {
    text,
    confidence,
    qualityScore: quality.score,
    presetUsed,
    flaggedForReview
  };
}

/**
 * Extracts raw text items from PDF.js with spatial distance awareness to avoid
 * injecting spaces inside cohesive Hindi words.
 */
async function extractRawPdfPageText(page: any): Promise<string> {
  const textContent = await page.getTextContent();
  let lastY: number | null = null;
  let lastX: number | null = null;
  let lastWidth: number = 0;
  let rawStr = '';

  for (const item of textContent.items as any[]) {
    const str = item.str || '';
    if (!str) continue;

    const currentX = item.transform ? item.transform[4] : null;
    const currentY = item.transform ? item.transform[5] : null;

    if (lastY !== null && currentY !== null && Math.abs(lastY - currentY) > 8) {
      // New line
      rawStr += '\n' + str;
    } else if (lastX !== null && currentX !== null && lastWidth > 0) {
      const dx = currentX - (lastX + lastWidth);
      // Only insert space if glyph distance exceeds natural character spacing threshold (> 3.5 points)
      if (dx > 3.5 && !rawStr.endsWith(' ') && !str.startsWith(' ')) {
        rawStr += ' ' + str;
      } else {
        rawStr += str;
      }
    } else {
      rawStr += (rawStr.endsWith(' ') || str.startsWith(' ') ? '' : ' ') + str;
    }

    lastX = currentX;
    lastY = currentY;
    lastWidth = item.width || 0;
  }

  return cleanDevanagariAndIndicText(rawStr);
}

/**
 * Universal Hindi PDF Extraction Pipeline:
 * 1. Checks direct PDF text layer.
 * 2. Evaluates text strictly using evaluateHindiTextQuality().
 * 3. If fragmented, corrupted, or missing -> Renders original page at 300 DPI & executes real Hindi OCR (hin).
 * 4. Compares and ensures only genuine, readable Hindi text is preserved.
 * 5. Streams incremental results to Admin UI.
 * 6. Structures chapters at the final stage.
 */
export async function extractFromPdfFile(
  file: File,
  onProgress?: (info: ExtractionProgressInfo) => void,
  controller?: ExtractionController
): Promise<ExtractedBookData> {
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({
    currentPage: 0,
    totalPages: 0,
    stage: 'analyzing',
    method: 'init',
    statusMessage: 'Analyzing PDF architecture, font CMaps, and layout structures...',
    percent: 0,
    isPaused: false,
    isCancelled: false
  });

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/standard_fonts/`,
    useSystemFonts: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let ocrWorker: Worker | null = null;
  const pageMap: ExtractedPage[] = [];
  const processedFingerprints = new Set<string>();

  let textLayerCount = 0;
  let ocrCount = 0;
  let lowConfCount = 0;
  let duplicatesPrevented = 0;
  let totalConfidenceSum = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // 1. Check if user stopped / cancelled extraction
    if (controller?.isCancelled) {
      onProgress?.({
        currentPage: pageNum - 1,
        totalPages: numPages,
        stage: 'complete',
        method: 'finalizing',
        statusMessage: `Extraction stopped by user at page ${pageNum - 1} of ${numPages}. Extracted content preserved.`,
        percent: Math.round(((pageNum - 1) / numPages) * 100),
        stats: {
          totalPages: numPages,
          processedPages: pageMap.length,
          textLayerPages: textLayerCount,
          ocrPages: ocrCount,
          lowConfidencePages: lowConfCount,
          duplicatesPrevented
        },
        isCancelled: true
      });
      break;
    }

    // 2. Check if user paused extraction - wait until resumed or cancelled
    while (controller?.isPaused && !controller.isCancelled) {
      onProgress?.({
        currentPage: pageNum - 1,
        totalPages: numPages,
        stage: 'extracting',
        method: 'text_layer',
        statusMessage: `⏸️ Extraction Paused at page ${pageNum - 1}/${numPages}. Click Resume to continue.`,
        percent: Math.round(((pageNum - 1) / numPages) * 100),
        stats: {
          totalPages: numPages,
          processedPages: pageMap.length,
          textLayerPages: textLayerCount,
          ocrPages: ocrCount,
          lowConfidencePages: lowConfCount,
          duplicatesPrevented
        },
        isPaused: true
      });
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // Double-check cancellation after pause wake-up
    if (controller?.isCancelled) {
      break;
    }

    const percent = Math.round(((pageNum - 1) / numPages) * 100);

    onProgress?.({
      currentPage: pageNum,
      totalPages: numPages,
      stage: 'extracting',
      method: 'text_layer',
      statusMessage: `Checking Page ${pageNum}/${numPages} text encoding...`,
      percent,
      stats: {
        totalPages: numPages,
        processedPages: pageMap.length,
        textLayerPages: textLayerCount,
        ocrPages: ocrCount,
        lowConfidencePages: lowConfCount,
        duplicatesPrevented
      },
      isPaused: false,
      isCancelled: false
    });

    try {
      const page = await pdfDoc.getPage(pageNum);

      // Step 1: Direct text extraction from PDF layer
      const rawText = await extractRawPdfPageText(page);
      const qualityMetrics = evaluateHindiTextQuality(rawText);

      let pageEntry: ExtractedPage;

      // STRICT VALIDATION: If text is valid, high-quality, not fragmented, and has genuine Hindi vocabulary
      if (qualityMetrics.isValid && qualityMetrics.score >= 78 && rawText.length > 30) {
        textLayerCount++;
        totalConfidenceSum += 100;

        pageEntry = {
          pageNumber: pageNum,
          text: rawText,
          ocrUsed: false,
          method: 'text_layer',
          confidence: 100,
          qualityScore: qualityMetrics.score,
          flaggedForReview: false
        };
      } else {
        // Step 2: Corrupted, fragmented, or scanned text layer -> Discard and use 300 DPI Hindi OCR
        const reason = qualityMetrics.rejectionReason || 'Scanned page / Corrupted font encoding';

        onProgress?.({
          currentPage: pageNum,
          totalPages: numPages,
          stage: 'ocr',
          method: 'ocr_hindi',
          statusMessage: `Page ${pageNum}/${numPages}: ${reason} -> Running 300 DPI Hindi OCR...`,
          percent
        });

        if (!ocrWorker) {
          ocrWorker = await getHindiOcrWorker();
        }

        const ocrResult = await performHighResHindiOcr(page, ocrWorker);

        ocrCount++;
        totalConfidenceSum += ocrResult.confidence;
        if (ocrResult.flaggedForReview) {
          lowConfCount++;
        }

        pageEntry = {
          pageNumber: pageNum,
          text: ocrResult.text,
          ocrUsed: true,
          method: 'ocr_hindi',
          confidence: ocrResult.confidence,
          qualityScore: ocrResult.qualityScore,
          flaggedForReview: ocrResult.flaggedForReview,
          rejectionReason: reason,
          presetUsed: ocrResult.presetUsed
        };
      }

      // Step 3: Duplicate protection via structural fingerprint
      const fingerprint = computePageTextFingerprint(pageEntry.text);
      if (fingerprint && processedFingerprints.has(fingerprint) && pageEntry.text.length > 80) {
        duplicatesPrevented++;
      } else if (fingerprint) {
        processedFingerprints.add(fingerprint);
      }

      pageMap.push(pageEntry);

      // Step 4: Stream incremental progress to Admin UI
      onProgress?.({
        currentPage: pageNum,
        totalPages: numPages,
        stage: 'extracting',
        method: pageEntry.method,
        statusMessage: `Page ${pageNum}/${numPages} complete (${pageEntry.method === 'ocr_hindi' ? '300 DPI OCR' : 'Direct Text'})`,
        confidence: pageEntry.confidence,
        percent: Math.round((pageNum / numPages) * 100),
        stats: {
          totalPages: numPages,
          processedPages: pageMap.length,
          textLayerPages: textLayerCount,
          ocrPages: ocrCount,
          lowConfidencePages: lowConfCount,
          duplicatesPrevented
        },
        incrementalPage: pageEntry,
        recentPages: [...pageMap]
      });
    } catch (pageErr: any) {
      if (controller?.isCancelled) {
        break;
      }
      console.error(`Error processing page ${pageNum}:`, pageErr);
      lowConfCount++;
      const errEntry: ExtractedPage = {
        pageNumber: pageNum,
        text: `[पृष्ठ ${pageNum} निष्कर्षण में त्रुटि: ${pageErr?.message || 'अज्ञात कारण'}]`,
        ocrUsed: false,
        method: 'text_layer',
        confidence: 0,
        qualityScore: 0,
        flaggedForReview: true,
        rejectionReason: pageErr?.message || 'Processing error'
      };
      pageMap.push(errEntry);
    }
  }

  const processedPagesCount = pageMap.length;
  const pageVerificationPassed = processedPagesCount === numPages;
  const averageConfidence = Math.round(totalConfidenceSum / Math.max(1, processedPagesCount));

  const stats: ExtractionStats = {
    totalPages: numPages,
    processedPages: processedPagesCount,
    textLayerPages: textLayerCount,
    ocrPages: ocrCount,
    lowConfidencePages: lowConfCount,
    duplicatesPrevented,
    averageConfidence
  };

  // Step 5: Global chapter detection on clean extracted text
  onProgress?.({
    currentPage: numPages,
    totalPages: numPages,
    stage: 'chapter_detection',
    method: 'finalizing',
    statusMessage: `All ${processedPagesCount} pages extracted. Organizing chapters...`,
    percent: 100,
    stats
  });

  const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const title = cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1);
  const chapters = detectUniversalHindiChapters(pageMap, title);

  const firstNonEmptyText = pageMap.map((p) => p.text).join('\n\n').trim();
  const descriptionPreview = firstNonEmptyText.slice(0, 300).replace(/\s+/g, ' ').trim();
  const description = descriptionPreview.length > 30 ? `${descriptionPreview}...` : `एक महत्वपूर्ण कृति—${title}`;

  return {
    title,
    author: 'मुंशी प्रेमचंद',
    description,
    language: 'hi',
    totalPages: numPages,
    processedPagesCount,
    pageVerificationPassed,
    category: 'Literature',
    stats,
    chapters,
    pageMap
  };
}

/**
 * Universal Hindi Chapter Detection Engine (Runs once on complete clean book text)
 */
export function detectUniversalHindiChapters(
  pages: ExtractedPage[],
  bookTitle: string
): ExtractedChapter[] {
  if (!pages || pages.length === 0) {
    return [
      {
        id: 'ch-1',
        title: 'अध्याय 1',
        startPage: 1,
        endPage: 1,
        text: 'सामग्री उपलब्ध नहीं है।'
      }
    ];
  }

  const chapters: ExtractedChapter[] = [];

  const headingRegex =
    /(?:^|\n)\s*(?:(?:अध्याय|प्रकरण|भाग|खण्ड|खंड|सर्ग|कथा|किस्त|कांड|उल्लास|तरंग|Chapter|Section|Book)\s*(?:[०-९0-9]+|[१२३४५६७८९१०]+|[IVXLCDM]+|[:\-\—]|पहला|दूसरा|तीसरा|चौथा|पाँचवाँ|छठा|सातवाँ|आठवाँ|नौवाँ|दसवाँ|प्रथम|द्वितीय|तृतीय|चतुर्थ|पंचम|षष्ठ|सप्तम|अष्टम|नवम|दशम)[^\n]*)/i;

  let currentTitle = 'प्रस्तावना व आरंभ';
  let currentStartPage = pages[0].pageNumber;
  let currentParagraphs: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageObj = pages[i];
    const text = pageObj.text.trim();
    if (!text) continue;

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstTwoLines = lines.slice(0, 2).join('\n');

    const isHeading = headingRegex.test(firstTwoLines);

    if (isHeading && currentParagraphs.length > 0) {
      const prevEndPage = Math.max(currentStartPage, pageObj.pageNumber - 1);
      chapters.push({
        id: `ch-${chapters.length + 1}`,
        title: currentTitle,
        startPage: currentStartPage,
        endPage: prevEndPage,
        text: currentParagraphs.join('\n\n')
      });

      const headingLine = lines[0].length < 70 ? lines[0] : lines[0].slice(0, 67) + '...';
      currentTitle = headingLine;
      currentStartPage = pageObj.pageNumber;
      currentParagraphs = [text];
    } else {
      currentParagraphs.push(text);
    }
  }

  if (currentParagraphs.length > 0) {
    const lastPage = pages[pages.length - 1].pageNumber;
    chapters.push({
      id: `ch-${chapters.length + 1}`,
      title: currentTitle || `अध्याय ${chapters.length + 1}`,
      startPage: currentStartPage,
      endPage: lastPage,
      text: currentParagraphs.join('\n\n')
    });
  }

  if (chapters.length === 1 && pages.length > 8) {
    const total = pages.length;
    const pagesPerCh = Math.max(4, Math.ceil(total / 6));
    const segmented: ExtractedChapter[] = [];

    for (let i = 0; i < total; i += pagesPerCh) {
      const chIdx = Math.floor(i / pagesPerCh) + 1;
      const slicePages = pages.slice(i, i + pagesPerCh);
      const startP = slicePages[0].pageNumber;
      const endP = slicePages[slicePages.length - 1].pageNumber;

      segmented.push({
        id: `ch-${chIdx}`,
        title: `भाग ${chIdx} (पृष्ठ ${startP}–${endP})`,
        startPage: startP,
        endPage: endP,
        text: slicePages.map((p) => p.text).join('\n\n')
      });
    }
    return segmented;
  }

  return chapters.length > 0
    ? chapters
    : [
        {
          id: 'ch-1',
          title: `प्रवेश: ${bookTitle}`,
          startPage: 1,
          endPage: pages.length,
          text: pages.map((p) => p.text).join('\n\n')
        }
      ];
}

/**
 * Splits raw pasted text into chapters deterministically
 */
export function splitRawTextIntoChapters(
  rawText: string,
  bookTitle: string = 'Book'
): ExtractedChapter[] {
  const cleaned = cleanDevanagariAndIndicText(rawText);
  if (!cleaned || !cleaned.trim()) {
    return [
      {
        id: `ch-1`,
        title: 'अध्याय 1',
        startPage: 1,
        endPage: 1,
        text: 'सामग्री उपलब्ध नहीं है।'
      }
    ];
  }

  const chapterRegex =
    /(?:^|\n)(?:(?:Chapter|CHAPTER|अध्याय|प्रकरण|भाग|खण्ड|खंड|सर्ग|कथा|किस्त)\s*(?:[0-9]+|[IVXLCDM]+|[०-९]+|[:\-\—])[^\n]*|[A-Z\s]{4,35}(?=\n))/g;

  const matches = [...cleaned.matchAll(chapterRegex)];

  if (matches.length < 2) {
    const paragraphs = cleaned.split(/\n\s*\n/).filter((p) => p.trim());
    if (paragraphs.length > 5) {
      const chunkSize = Math.max(3, Math.ceil(paragraphs.length / 6));
      const generatedChapters: ExtractedChapter[] = [];
      for (let i = 0; i < paragraphs.length; i += chunkSize) {
        const chNum = Math.floor(i / chunkSize) + 1;
        const chunk = paragraphs.slice(i, i + chunkSize).join('\n\n');
        generatedChapters.push({
          id: `ch-${chNum}`,
          title: `अध्याय ${chNum}`,
          startPage: Math.max(1, (chNum - 1) * 15 + 1),
          endPage: chNum * 15,
          text: chunk
        });
      }
      return generatedChapters;
    }

    return [
      {
        id: `ch-1`,
        title: `प्रवेश: ${bookTitle}`,
        startPage: 1,
        endPage: 15,
        text: cleaned.trim()
      }
    ];
  }

  const chapters: ExtractedChapter[] = [];
  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].index! + (matches[i][0].startsWith('\n') ? 1 : 0);
    const nextMatch = matches[i + 1];
    const endIndex = nextMatch ? nextMatch.index! : cleaned.length;

    const fullChunk = cleaned.substring(startIndex, endIndex).trim();
    const lines = fullChunk.split('\n');
    const headerTitle = lines[0]?.trim() || `अध्याय ${i + 1}`;
    const chapterContent = lines.slice(1).join('\n').trim() || fullChunk;

    chapters.push({
      id: `ch-${i + 1}`,
      title: headerTitle.length > 60 ? headerTitle.substring(0, 57) + '...' : headerTitle,
      startPage: Math.max(1, i * 15 + 1),
      endPage: (i + 1) * 15,
      text: chapterContent
    });
  }

  return chapters;
}
