export interface ArchiveBookItem {
  identifier: string;
  title: string;
  creator: string;
  description: string;
  language: string;
  date?: string;
  year?: string;
  subjects: string[];
  collections: string[];
  formats: string[];
  downloads?: number;
  itemSize?: number;
  publicDate?: string;
  coverUrl: string;
  mediatype?: string;
}

export interface ArchiveFile {
  name: string;
  source: string;
  format: string;
  size?: string | number;
  mtime?: string;
  md5?: string;
  crc32?: string;
  sha1?: string;
  original?: string;
  title?: string;
}

export interface ReadableResource {
  type: 'pdf' | 'epub' | 'djvu_txt' | 'text';
  url: string;
  fileName: string;
  size?: number;
  formatName: string;
  isRestricted?: boolean;
}

export interface ArchiveItemMetadata {
  identifier: string;
  title: string;
  creator: string;
  description: string;
  language: string;
  date?: string;
  year?: string;
  subjects: string[];
  collections: string[];
  publisher?: string;
  licenseurl?: string;
  rights?: string;
  sponsor?: string;
  isRestricted: boolean;
  restrictionReason?: string;
  files: ArchiveFile[];
  readableResource: ReadableResource | null;
  imagecount?: number;
  server?: string;
  dir?: string;
}

export interface ArchiveSearchResponse {
  numFound: number;
  start: number;
  docs: ArchiveBookItem[];
  page: number;
  totalPages: number;
}

export interface ArchiveSearchOptions {
  query: string;
  searchType?: 'all' | 'title' | 'creator' | 'subject';
  language?: string; // 'all', 'hin', 'mar', 'eng', 'san', etc.
  sort?: 'downloads' | 'date' | 'title';
  page?: number;
  rows?: number;
}

export interface ArchiveReadingProgress {
  identifier: string;
  title?: string;
  creator?: string;
  coverUrl?: string;
  currentPage: number;
  totalPages: number;
  progressPercentage?: number;
  percentage?: number;
  bookmarkedPages?: number[];
  lastOpened?: string;
  lastReadAt?: string;
  minutesSpent?: number;
  completed?: boolean;
  shelf?: 'currently-reading' | 'want-to-read' | 'completed' | 'favorites';
}

export interface ArchiveLibraryItem {
  identifier: string;
  title: string;
  author?: string;
  creator?: string;
  coverUrl?: string;
  language?: string;
  shelf?: 'currently-reading' | 'want-to-read' | 'completed' | 'favorites';
  status?: string;
  addedAt: string;
  updatedAt?: string;
  currentPage?: number;
  totalPages?: number;
  progressPercentage?: number;
}
