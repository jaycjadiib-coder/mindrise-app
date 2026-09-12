/**
 * Smart Text Extractor & Normalizer
 * Provides high-accuracy text extraction, reading-order reconstruction,
 * de-hyphenation, ligature normalization, and sentence segmentation
 * for Hindi, Sanskrit, and English books.
 */

export interface ExtractedSentence {
  index: number;
  text: string;
  cleanText: string;
  wordCount: number;
}

export interface ExtractedPageData {
  fullText: string;
  sentences: ExtractedSentence[];
  paragraphs: string[];
  language: 'hi' | 'en' | 'sa' | 'und';
  wordCount: number;
  source: 'pdf-vector' | 'ocr-stream' | 'curated-text';
  confidence: number;
}

/**
 * Normalizes Unicode Devanagari and Latin text, fixing broken ligatures and whitespace.
 */
export function normalizeBookText(rawText: string): string {
  if (!rawText) return '';

  return (
    rawText
      // Unicode Canonical Composition (fixes Devanagari matras and nuktas)
      .normalize('NFC')
      // Remove OCR subscript numbers (e.g., ₁, ₂, ₃, ₄, ₅) commonly found in scanned Sanskrit/Hindi texts
      .replace(/[\u2080-\u2089]/g, '')
      // Remove stray OCR hashes, underscores, caret, tilde, and corrupt symbols
      .replace(/[#_~^|¦¬\uFFFD\u00A0]/g, ' ')
      // Normalize various dashes/hyphens
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
      // Normalize quote characters
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      // Fix Devanagari danda variants to standard Purna Viram (।)
      .replace(/[\u0964]/g, '।')
      .replace(/[\u0965]/g, '॥')
      // Fix spaced-out Devanagari characters caused by raw OCR (e.g. 'अ ध् य य न' -> 'अध्ययन')
      .replace(/([\u0900-\u097F])\s+([\u0902\u0903\u093A-\u094F\u0951-\u0957])/g, '$1$2')
      .replace(/([\u0900-\u097F]\u094D)\s+([\u0900-\u097F])/g, '$1$2')
      // Remove multiple consecutive spaces while preserving standard spacing
      .replace(/[ \t]+/g, ' ')
      .trim()
  );
}

/**
 * Splits extracted page text into intelligent, natural spoken sentences.
 */
export function splitIntoSmartSentences(text: string): ExtractedSentence[] {
  const clean = normalizeBookText(text);
  if (!clean || clean.length < 2) {
    return [];
  }

  // Split by Purna Viram (।), double danda (॥), period (.), exclamation (!), question (?), or significant newlines
  const rawSegments = clean
    .split(/(?<=[।॥!?.\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences: ExtractedSentence[] = [];
  let currentAccumulator = '';

  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i];
    
    // If segment is very short (e.g. just a number or single character like "1." or "क)"), accumulate with next
    if (segment.length < 6 && i < rawSegments.length - 1 && !/[।॥!?]/.test(segment)) {
      currentAccumulator += (currentAccumulator ? ' ' : '') + segment;
      continue;
    }

    const fullSentence = (currentAccumulator ? currentAccumulator + ' ' : '') + segment;
    currentAccumulator = '';

    // Ignore solitary non-alphabetic fragments
    const wordChars = fullSentence.replace(/[\s\d\p{P}]/gu, '');
    if (wordChars.length === 0 && fullSentence.length < 5) {
      continue;
    }

    const cleanSpoken = fullSentence
      // Remove solitary brackets or footnote references like [1], (12)
      .replace(/\[\d+\]|\(\d+\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanSpoken.length > 0) {
      sentences.push({
        index: sentences.length,
        text: fullSentence,
        cleanText: cleanSpoken,
        wordCount: cleanSpoken.split(/\s+/).filter(Boolean).length,
      });
    }
  }

  if (currentAccumulator.trim()) {
    sentences.push({
      index: sentences.length,
      text: currentAccumulator,
      cleanText: currentAccumulator.trim(),
      wordCount: currentAccumulator.trim().split(/\s+/).filter(Boolean).length,
    });
  }

  return sentences;
}

/**
 * Detects whether the text is predominantly Hindi, Sanskrit, or English.
 */
export function detectTextLanguage(text: string): 'hi' | 'en' | 'sa' | 'und' {
  if (!text) return 'und';
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  const latinMatches = text.match(/[a-zA-Z]/g);

  const devCount = devanagariMatches ? devanagariMatches.length : 0;
  const latCount = latinMatches ? latinMatches.length : 0;

  if (devCount > latCount && devCount > 10) {
    if (text.includes('॥') || text.includes('नमः') || text.includes('इति') || text.includes('अथ')) {
      return 'sa';
    }
    return 'hi';
  }
  if (latCount > devCount && latCount > 10) {
    return 'en';
  }
  return devCount > 0 ? 'hi' : 'en';
}

/**
 * Reconstructs accurate 2D reading order from PDF.js getTextContent() items.
 * Sorts lines by vertical Y position and left-to-right X position,
 * stitches broken words across line breaks, and produces clean paragraphs.
 */
export function reconstructPdfPageText(textContent: any): string {
  if (!textContent || !Array.isArray(textContent.items) || textContent.items.length === 0) {
    return '';
  }

  interface TextItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hasEOL: boolean;
  }

  const items: TextItem[] = [];

  for (const raw of textContent.items) {
    if (!raw.str || raw.str.trim() === '') continue;
    const transform = raw.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4] || 0;
    const y = transform[5] || 0;
    const width = raw.width || 0;
    const height = raw.height || 10;

    items.push({
      str: raw.str,
      x,
      y,
      width,
      height,
      hasEOL: Boolean(raw.hasEOL),
    });
  }

  if (items.length === 0) return '';

  // 1. Group items into vertical lines with a tolerance threshold (~4px)
  // Note: PDF coordinate system has (0,0) at bottom-left, so higher Y means higher on the page.
  items.sort((a, b) => {
    // Sort descending by Y (top to bottom)
    if (Math.abs(b.y - a.y) > 4) {
      return b.y - a.y;
    }
    // Same line: sort ascending by X (left to right)
    return a.x - b.x;
  });

  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentY = items[0].y;

  for (const item of items) {
    if (Math.abs(item.y - currentY) > 4) {
      // New line
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim());
      }
      currentLine = [item.str];
      currentY = item.y;
    } else {
      currentLine.push(item.str);
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim());
  }

  // 2. Stitch de-hyphenated lines (e.g. "कर्तव्य-" + "निष्ठ" => "कर्तव्यनिष्ठ")
  const stitchedParagraphs: string[] = [];
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Filter out solitary running header/footer numbers (e.g. standalone "124" at line start or end)
    if (lines.length > 3 && (i === 0 || i === lines.length - 1)) {
      if (/^\d{1,4}$/.test(line.trim())) {
        continue;
      }
    }

    if (!currentParagraph) {
      currentParagraph = line;
      continue;
    }

    // Check if previous line ended with hyphen
    if (currentParagraph.endsWith('-')) {
      currentParagraph = currentParagraph.slice(0, -1) + line;
    } else {
      // Check if line should start a new paragraph (e.g. after Purna Viram or empty line)
      currentParagraph += ' ' + line;
    }
  }

  if (currentParagraph) {
    stitchedParagraphs.push(currentParagraph);
  }

  return normalizeBookText(stitchedParagraphs.join('\n\n'));
}
