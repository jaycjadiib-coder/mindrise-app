import {
  ArchiveBookItem,
  ArchiveFile,
  ArchiveItemMetadata,
} from '../types/archive';
import {
  BookRepresentationResult,
  BookRepresentations,
  BookRepresentationType,
  SelectedRepresentation,
} from '../types/representation';
import {
  getArchiveItemMetadata,
  getArchivePdfStreamUrl,
  getArchiveDirectPdfUrl,
  getArchiveEmbedUrl,
} from './internetArchiveService';

const IA_DOWNLOAD_URL = 'https://archive.org/download';

/**
 * Builds candidate numeric page URLs for an image stack book
 */
export function buildImageStackPageUrls(identifier: string, totalPages: number): string[] {
  const pages: string[] = [];
  const cleanId = encodeURIComponent(identifier.trim());
  const count = Math.max(1, Math.min(totalPages, 5000));

  for (let i = 1; i <= count; i++) {
    // We use the proxy endpoint which handles n{page}.jpg, fallback upstream mirrors, and high-DPI sizing
    pages.push(`/api/archive/page-image?identifier=${cleanId}&page=${i}`);
  }
  return pages;
}

/**
 * Deterministic Detection Engine:
 * Analyzes the book metadata, manifest, and all available assets to construct
 * a complete BookRepresentationResult.
 */
export async function detectBookRepresentation(
  book: { identifier: string; title?: string; creator?: string; coverUrl?: string; pages?: number },
  existingMetadata?: ArchiveItemMetadata | null
): Promise<BookRepresentationResult> {
  const identifier = (book.identifier || '').trim();
  const cleanTitle = (book.title || identifier).trim();

  let meta: ArchiveItemMetadata;
  if (existingMetadata && existingMetadata.identifier === identifier) {
    meta = existingMetadata;
  } else {
    meta = await getArchiveItemMetadata(identifier);
  }

  const files: ArchiveFile[] = Array.isArray(meta.files) ? meta.files : [];
  const isRestricted = !!meta.isRestricted;

  // Total readable page count
  let pageCount = Math.max(
    book.pages || 0,
    meta.imagecount || 0,
    meta.pages || 0,
    1
  );

  // 1. DETECT PDF CANDIDATES
  let pdfAvailable = false;
  let pdfUrl = '';
  let pdfFileName = '';
  let pdfSize: number | undefined = undefined;
  let pdfFormatName = '';

  // Filter valid PDF files (exclude thumbnails, text overlays, XMLs, 0-byte stubs)
  const candidatePdfFiles = files.filter((f) => {
    if (!f.name || typeof f.name !== 'string') return false;
    const lowerName = f.name.toLowerCase();
    const size = typeof f.size === 'number' ? f.size : parseInt(String(f.size || '0'), 10);
    return (
      lowerName.endsWith('.pdf') &&
      !lowerName.includes('_thumb') &&
      !lowerName.includes('_preview') &&
      !lowerName.includes('.meta.') &&
      (size > 1024 || isNaN(size) || size === 0)
    );
  });

  if (candidatePdfFiles.length > 0) {
    // Sort priority:
    // A. Text PDF (Searchable vector/text)
    // B. Original Scanned PDF
    // C. Additional Text PDF / Standard PDF
    // D. Black and white / derivative PDF
    candidatePdfFiles.sort((a, b) => {
      const aFormat = (a.format || '').toLowerCase();
      const bFormat = (b.format || '').toLowerCase();
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      const aScore =
        (aFormat.includes('text pdf') ? 100 : 0) +
        (a.source === 'original' ? 50 : 0) +
        (aName.endsWith('_bw.pdf') ? -20 : 0);
      const bScore =
        (bFormat.includes('text pdf') ? 100 : 0) +
        (b.source === 'original' ? 50 : 0) +
        (bName.endsWith('_bw.pdf') ? -20 : 0);

      return bScore - aScore;
    });

    const chosenPdf = candidatePdfFiles[0];
    pdfAvailable = true;
    pdfFileName = chosenPdf.name;
    pdfFormatName = chosenPdf.format || 'Vector/Scanned PDF';
    pdfSize = typeof chosenPdf.size === 'number' ? chosenPdf.size : parseInt(String(chosenPdf.size), 10) || undefined;
    const remoteDownloadUrl = `${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(chosenPdf.name)}`;
    pdfUrl = getArchivePdfStreamUrl(remoteDownloadUrl);
  }

  // 2. DETECT IMAGE STACK (PAGE SCANS FACSIMILE)
  // Check for indicators of scanned book pages (JP2/TIFF archives, Scandata, or multi-page scan counts)
  const hasJp2Zip = files.some((f) => f.name?.toLowerCase().endsWith('_jp2.zip') || (f.format || '').toLowerCase().includes('jp2'));
  const hasTifZip = files.some((f) => f.name?.toLowerCase().endsWith('_tif.zip') || (f.format || '').toLowerCase().includes('tiff'));
  const hasScandata = files.some((f) => f.name?.toLowerCase().endsWith('_scandata.xml') || f.format === 'Scandata');
  const hasPageNumbers = files.some((f) => f.name?.toLowerCase().includes('_page_numbers.json'));
  const hasMultiplePageJpgs = files.filter((f) => f.name?.match(/_page_\d+\.jpg$/i) || f.name?.match(/_\d{4}\.jpg$/i)).length > 1;
  const hasPageCountScan = pageCount > 1 || (meta.imagecount || 0) > 1;

  const imageStackAvailable = hasJp2Zip || hasTifZip || hasScandata || hasPageNumbers || hasMultiplePageJpgs || hasPageCountScan;
  const imageStackPages = imageStackAvailable ? buildImageStackPageUrls(identifier, pageCount) : [];

  // If no PDF found in manifest, and no scan stack confirmed, check if direct archive resolver endpoint might work
  if (!pdfAvailable && !imageStackAvailable && !isRestricted && !identifier.startsWith('ol_') && !identifier.startsWith('ia_rec_')) {
    pdfAvailable = true;
    pdfUrl = getArchiveDirectPdfUrl(identifier);
    pdfFileName = `${identifier}.pdf`;
    pdfFormatName = 'Archive Direct Stream';
  }

  // 3. DETECT BOOKREADER REPRESENTATION
  const bookReaderAvailable = (imageStackAvailable || hasScandata || pageCount > 1) && !identifier.startsWith('ia_rec_');
  const bookReaderEmbedUrl = bookReaderAvailable ? getArchiveEmbedUrl(identifier, 1) : '';

  // 4. DETECT EPUB
  const epubFile = files.find((f) => f.name && f.name.toLowerCase().endsWith('.epub'));
  const epubAvailable = !!epubFile;
  const epubUrl = epubFile
    ? getArchivePdfStreamUrl(`${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(epubFile.name)}`)
    : '';

  // 5. DETECT OCR / TEXT
  const djvuTxtFile = files.find((f) => f.name && (f.name.toLowerCase().endsWith('_djvu.txt') || f.format === 'DjVuTXT'));
  const plainTxtFile = files.find((f) => f.name && f.name.toLowerCase().endsWith('.txt') && !f.name.toLowerCase().includes('_meta'));
  const textFile = djvuTxtFile || plainTxtFile;
  const textAvailable = !!textFile || !identifier.startsWith('ia_rec_');
  const textUrl = textFile
    ? `${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(textFile.name)}`
    : `/api/archive/text/${encodeURIComponent(identifier)}`;

  const representations: BookRepresentations = {
    pdf: {
      available: pdfAvailable,
      url: pdfUrl,
      fileName: pdfFileName,
      size: pdfSize,
      formatName: pdfFormatName,
      isRestricted,
    },
    imageStack: {
      available: imageStackAvailable,
      pages: imageStackPages,
      count: pageCount,
    },
    bookReader: {
      available: bookReaderAvailable,
      embedUrl: bookReaderEmbedUrl,
    },
    text: {
      available: textAvailable,
      url: textUrl,
      formatName: textFile?.format || 'OCR Plain Text',
    },
    epub: {
      available: epubAvailable,
      url: epubUrl,
      size: epubFile?.size ? Number(epubFile.size) : undefined,
    },
  };

  // Build List of Available Types
  const availableTypes: BookRepresentationType[] = [];
  if (representations.pdf.available) availableTypes.push('pdf');
  if (representations.imageStack.available) availableTypes.push('image_stack');
  if (representations.bookReader.available) availableTypes.push('bookreader');
  if (representations.epub.available) availableTypes.push('epub');
  if (representations.text.available) availableTypes.push('text');
  if (availableTypes.length === 0) availableTypes.push('fallback');

  // Deterministic Decision Tree Priority:
  // A. Native PDF (Primary if candidate available)
  // B. Image Stack (Scanned pages facsimile)
  // C. BookReader (Dual-page Flipbook)
  // D. EPUB
  // E. Plain / OCR Text
  // F. Safe Source Fallback
  let selectedType: BookRepresentationType = 'fallback';
  let selectedUrl = '';

  if (representations.pdf.available) {
    selectedType = 'pdf';
    selectedUrl = representations.pdf.url;
  } else if (representations.imageStack.available) {
    selectedType = 'image_stack';
    selectedUrl = representations.imageStack.pages[0] || '';
  } else if (representations.bookReader.available) {
    selectedType = 'bookreader';
    selectedUrl = representations.bookReader.embedUrl || '';
  } else if (representations.epub.available) {
    selectedType = 'epub';
    selectedUrl = representations.epub.url;
  } else if (representations.text.available) {
    selectedType = 'text';
    selectedUrl = representations.text.url;
  }

  const selectedRepresentation: SelectedRepresentation = {
    type: selectedType,
    renderer: selectedType,
    url: selectedUrl,
    pageCount,
    details: `${cleanTitle} • Resolved ${selectedType.toUpperCase()}`,
  };

  return {
    bookId: identifier,
    title: cleanTitle,
    creator: meta.creator || book.creator,
    coverUrl: book.coverUrl || (identifier ? `https://archive.org/services/img/${encodeURIComponent(identifier)}` : undefined),
    source: identifier.startsWith('ol_') ? 'open_library' : 'internet_archive',
    pageCount,
    isRestricted,
    representations,
    selectedRepresentation,
    availableTypes,
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Returns next best available representation if current candidate fails
 * (e.g., if PDF loading throws 404 or corrupted header, failover to image_stack)
 */
export function getNextFallbackRepresentation(
  repResult: BookRepresentationResult,
  failedType: BookRepresentationType
): SelectedRepresentation {
  const reps = repResult.representations;

  // Mark the failed candidate as invalid
  if (failedType === 'pdf') reps.pdf.valid = false;
  if (failedType === 'image_stack') reps.imageStack.valid = false;
  if (failedType === 'bookreader') reps.bookReader.valid = false;
  if (failedType === 'text') reps.text.valid = false;
  if (failedType === 'epub') reps.epub.valid = false;

  // Try Next in Priority Chain
  if (failedType === 'pdf') {
    if (reps.imageStack.available && reps.imageStack.valid !== false) {
      return {
        type: 'image_stack',
        renderer: 'image_stack',
        url: reps.imageStack.pages[0] || '',
        pageCount: repResult.pageCount,
        details: 'PDF unavailable. Automatically switched to Scanned Pages mode.',
      };
    }
    if (reps.bookReader.available && reps.bookReader.valid !== false) {
      return {
        type: 'bookreader',
        renderer: 'bookreader',
        url: reps.bookReader.embedUrl,
        pageCount: repResult.pageCount,
        details: 'PDF unavailable. Automatically switched to BookReader mode.',
      };
    }
    if (reps.text.available && reps.text.valid !== false) {
      return {
        type: 'text',
        renderer: 'text',
        url: reps.text.url,
        pageCount: repResult.pageCount,
        details: 'PDF unavailable. Automatically switched to OCR Text mode.',
      };
    }
  } else if (failedType === 'image_stack') {
    if (reps.pdf.available && reps.pdf.valid !== false) {
      return {
        type: 'pdf',
        renderer: 'pdf',
        url: reps.pdf.url,
        pageCount: repResult.pageCount,
        details: 'Scanned pages unavailable. Switched to PDF renderer.',
      };
    }
    if (reps.bookReader.available && reps.bookReader.valid !== false) {
      return {
        type: 'bookreader',
        renderer: 'bookreader',
        url: reps.bookReader.embedUrl,
        pageCount: repResult.pageCount,
        details: 'Switched to BookReader mode.',
      };
    }
    if (reps.text.available && reps.text.valid !== false) {
      return {
        type: 'text',
        renderer: 'text',
        url: reps.text.url,
        pageCount: repResult.pageCount,
        details: 'Switched to OCR Text mode.',
      };
    }
  } else if (failedType === 'bookreader') {
    if (reps.text.available && reps.text.valid !== false) {
      return {
        type: 'text',
        renderer: 'text',
        url: reps.text.url,
        pageCount: repResult.pageCount,
        details: 'Switched to OCR Text mode.',
      };
    }
  }

  // Safe Fallback
  return {
    type: 'fallback',
    renderer: 'fallback',
    url: `https://archive.org/details/${encodeURIComponent(repResult.bookId)}`,
    pageCount: repResult.pageCount,
    details: 'Digital reader fallback to source archive.',
  };
}
