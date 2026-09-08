/**
 * High-Precision Hindi & Indic Text Quality & Corruption Detection Engine
 * Strictly detects font encoding corruption, non-standard CMaps, character fragmentation
 * (e.g. 'ला म ही जा यों गु...', 'सों शे खे किके...'), replacement boxes (□),
 * floating matras, and excessive character spacing.
 */

export interface TextQualityMetrics {
  isValid: boolean;
  score: number; // 0 to 100
  rejectionReason?: string;
  devanagariCharCount: number;
  wordCount: number;
  averageWordLength: number;
  fragmentedShortTokenRatio: number;
  replacementCharCount: number;
  corruptedSymbolCount: number;
  isolatedMatraCount: number;
  commonHindiWordCount: number;
  hasSuspiciousDuplicates: boolean;
}

// Common Hindi functional grammar particles (words that naturally exist in real Hindi text)
const COMMON_HINDI_PARTICLES = new Set([
  'में', 'से', 'को', 'का', 'के', 'की', 'पर', 'है', 'हैं', 'था', 'थी', 'थे',
  'तो', 'भी', 'ना', 'न', 'दो', 'ले', 'दी', 'दीं', 'हो', 'वे', 'यह', 'वह',
  'जो', 'एवं', 'या', 'जब', 'तब', 'अब', 'कम', 'सब', 'मत', 'तक', 'घर', 'मन',
  'और', 'नहीं', 'एक', 'किया', 'दिया', 'लिया', 'गया', 'गयी', 'गए', 'हुए',
  'हुई', 'हुआ', 'होता', 'होती', 'द्वारा', 'अपने', 'अपनी', 'अपने', 'साथ',
  'लिए', 'बाद', 'पहले', 'कहा', 'कहा', 'कहा', 'कहा', 'बात', 'समय', 'लोग',
  'अगर', 'मगर', 'लेकिन', 'किंतु', 'परंतु', 'क्योंकि', 'जिस', 'जिसके', 'जिसने'
]);

/**
 * Validates extracted Hindi text to verify genuine readability.
 * Strictly rejects corrupted text layers with fragmented characters or bad font CMaps.
 */
export function evaluateHindiTextQuality(text: string): TextQualityMetrics {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      score: 0,
      rejectionReason: 'Empty page content',
      devanagariCharCount: 0,
      wordCount: 0,
      averageWordLength: 0,
      fragmentedShortTokenRatio: 0,
      replacementCharCount: 0,
      corruptedSymbolCount: 0,
      isolatedMatraCount: 0,
      commonHindiWordCount: 0,
      hasSuspiciousDuplicates: false
    };
  }

  const raw = text.normalize('NFC');
  const totalChars = raw.length;

  // 1. Detect replacement boxes, undefined glyphs, and control codes
  const replacementMatches = raw.match(/[\uFFFD\u25A1\u25A0\u25AF\u25AC\u25AD\u25AE\u0000-\u0008\u000B\u000C\u000E-\u001F\u0080-\u009F]/g) || [];
  const replacementCount = replacementMatches.length;

  // 2. Detect Devanagari codepoints
  const devanagariMatches = raw.match(/[\u0900-\u097F]/g) || [];
  const devanagariCount = devanagariMatches.length;

  // 3. Detect standard Latin letters
  const latinMatches = raw.match(/[a-zA-Z]/g) || [];
  const latinCount = latinMatches.length;

  // 4. Detect suspicious symbol noise (indicates Kruti/legacy font unmapped ASCII output like &; = * F H ;)
  const noiseMatches = raw.match(/[\&\*\;\=\_\^\{\}\\\@\#\$\%\<\>\~]/g) || [];
  const noiseCount = noiseMatches.length;

  // 5. Detect isolated Devanagari matras (vowel signs floating without leading consonant)
  // E.g., ' ा ', ' े ', ' ् '
  const isolatedMatraMatches = raw.match(/(?:^|\s)[\u093E-\u094D\u0951-\u0954\u0962\u0963](?:\s|$)/g) || [];
  const isolatedMatraCount = isolatedMatraMatches.length;

  // 6. Tokenize words by whitespace
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const wordCount = tokens.length;

  // 7. Measure average word length and fragment ratio
  let totalDevanagariInWords = 0;
  let invalidShortTokenCount = 0;
  let commonHindiWordCount = 0;

  for (const token of tokens) {
    const devanagariChars = (token.match(/[\u0900-\u097F]/g) || []).length;
    totalDevanagariInWords += devanagariChars;

    // Check if token is a recognized common Hindi word
    const isCommon = COMMON_HINDI_PARTICLES.has(token);
    if (isCommon) {
      commonHindiWordCount++;
    }

    // A token is considered an unnatural fragment if it's 1-2 chars long AND NOT in common Hindi vocabulary
    // Example corrupted tokens: 'ला', 'म', 'ही', 'जा', 'यों', 'गु', 'सों', 'शे', 'खे', 'किके'
    if (devanagariChars > 0 && devanagariChars <= 2 && !isCommon) {
      invalidShortTokenCount++;
    }
  }

  const averageWordLength = wordCount > 0 ? totalDevanagariInWords / wordCount : 0;
  const fragmentedShortTokenRatio = wordCount > 5 ? invalidShortTokenCount / wordCount : 0;

  // 8. Detect suspicious line repetitions
  const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 10);
  const uniqueLines = new Set(lines);
  const hasSuspiciousDuplicates = lines.length > 4 && uniqueLines.size / lines.length < 0.5;

  // Calculate quality score
  let score = 100;

  // Heavy penalties for replacement characters (□)
  if (replacementCount > 0) {
    score -= Math.min(60, replacementCount * 8);
  }

  // Heavy penalty for fragmented single/double-letter words (the user's reported bug)
  if (fragmentedShortTokenRatio > 0.18) {
    score -= Math.min(60, fragmentedShortTokenRatio * 100);
  }

  // Penalty if average word length is suspiciously low (normal Hindi is ~4.5 - 6.5)
  if (wordCount > 10 && averageWordLength < 3.2) {
    score -= Math.min(50, (3.2 - averageWordLength) * 35);
  }

  // Penalty for high noise symbols relative to text length
  const noiseRatio = noiseCount / Math.max(1, totalChars);
  if (noiseRatio > 0.02) {
    score -= Math.min(45, noiseRatio * 400);
  }

  // Penalty for floating detached matras
  if (isolatedMatraCount > 1) {
    score -= Math.min(45, isolatedMatraCount * 10);
  }

  // Boost score if common Hindi grammar particles are present in prose
  if (wordCount > 15 && commonHindiWordCount > 3) {
    score = Math.min(100, score + 10);
  } else if (wordCount > 25 && commonHindiWordCount === 0) {
    // If a whole page of Hindi text has ZERO common Hindi particles, it is likely garbage encoding
    score -= 40;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let isValid = true;
  let rejectionReason: string | undefined;

  // Strict rejection criteria for direct PDF Text Layer
  if (replacementCount >= 2) {
    isValid = false;
    rejectionReason = `Font encoding error: contains ${replacementCount} replacement characters (□)`;
  } else if (isolatedMatraCount >= 3) {
    isValid = false;
    rejectionReason = `Corrupted Devanagari: contains ${isolatedMatraCount} detached/floating matras`;
  } else if (fragmentedShortTokenRatio > 0.22 && wordCount > 10) {
    isValid = false;
    rejectionReason = `Severe character fragmentation (${Math.round(fragmentedShortTokenRatio * 100)}% broken single-letter tokens like 'ला म ही जा...')`;
  } else if (averageWordLength < 2.9 && wordCount > 15) {
    isValid = false;
    rejectionReason = `Abnormally low average word length (${averageWordLength.toFixed(1)} chars/word indicates broken font spacing)`;
  } else if (wordCount > 25 && commonHindiWordCount === 0) {
    isValid = false;
    rejectionReason = 'Text layer lacks recognizable Hindi vocabulary (legacy font encoding)';
  } else if (score < 75) {
    isValid = false;
    rejectionReason = `Low quality score (${score}/100) due to font encoding or layout issues`;
  }

  return {
    isValid,
    score,
    rejectionReason,
    devanagariCharCount: devanagariCount,
    wordCount,
    averageWordLength,
    fragmentedShortTokenRatio,
    replacementCharCount: replacementCount,
    corruptedSymbolCount: noiseCount,
    isolatedMatraCount,
    commonHindiWordCount,
    hasSuspiciousDuplicates
  };
}

/**
 * Computes a structural hash/fingerprint of the page text
 * to prevent duplicate page extractions.
 */
export function computePageTextFingerprint(text: string): string {
  if (!text) return '';
  const normalized = text
    .normalize('NFC')
    .replace(/[^\u0900-\u097Fa-zA-Z0-9]/g, '')
    .slice(0, 300);

  if (normalized.length < 15) return '';

  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
