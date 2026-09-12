export type BookRepresentationType =
  | 'pdf'
  | 'image_stack'
  | 'bookreader'
  | 'text'
  | 'epub'
  | 'fallback';

export interface PdfRepresentation {
  available: boolean;
  url: string;
  fileName?: string;
  size?: number;
  formatName?: string;
  isRestricted?: boolean;
  valid?: boolean;
}

export interface ImageStackRepresentation {
  available: boolean;
  pages: string[]; // Page URLs or page image index references
  count: number;
  naturalAspectRatio?: number;
  samplePageUrl?: string;
  valid?: boolean;
}

export interface BookReaderRepresentation {
  available: boolean;
  manifestUrl?: string;
  embedUrl?: string;
  valid?: boolean;
}

export interface TextRepresentation {
  available: boolean;
  url: string;
  formatName?: string;
  valid?: boolean;
}

export interface EpubRepresentation {
  available: boolean;
  url: string;
  size?: number;
  valid?: boolean;
}

export interface BookRepresentations {
  pdf: PdfRepresentation;
  imageStack: ImageStackRepresentation;
  bookReader: BookReaderRepresentation;
  text: TextRepresentation;
  epub: EpubRepresentation;
}

export interface SelectedRepresentation {
  type: BookRepresentationType;
  renderer: BookRepresentationType;
  url?: string;
  pageCount?: number;
  details?: string;
}

export interface BookRepresentationResult {
  bookId: string;
  title: string;
  creator?: string;
  coverUrl?: string;
  source: 'internet_archive' | 'open_library' | 'direct';
  pageCount: number;
  isRestricted: boolean;
  representations: BookRepresentations;
  selectedRepresentation: SelectedRepresentation;
  availableTypes: BookRepresentationType[];
  detectedAt: string;
}
