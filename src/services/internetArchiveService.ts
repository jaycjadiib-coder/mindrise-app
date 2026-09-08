import {
  ArchiveBookItem,
  ArchiveSearchResponse,
  ArchiveSearchOptions,
  ArchiveItemMetadata,
  ArchiveFile,
  ReadableResource
} from '../types/archive';

const IA_ADVANCED_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const IA_METADATA_URL = 'https://archive.org/metadata';
const IA_SERVICES_IMG_URL = 'https://archive.org/services/img';
const IA_DOWNLOAD_URL = 'https://archive.org/download';

// In-memory cache for metadata on demand to reduce network load
const metadataCache = new Map<string, ArchiveItemMetadata>();

/**
 * Normalizes ISO language codes to user-friendly display labels
 */
export function getLanguageName(code?: string): string {
  if (!code) return 'Multi-language';
  const c = code.toLowerCase().trim();
  if (c.includes('hin') || c === 'hi') return 'हिन्दी (Hindi)';
  if (c.includes('mar') || c === 'mr') return 'मराठी (Marathi)';
  if (c.includes('eng') || c === 'en') return 'English';
  if (c.includes('san') || c === 'sa') return 'संस्कृत (Sanskrit)';
  if (c.includes('ben') || c === 'bn') return 'বাংলা (Bengali)';
  if (c.includes('urd') || c === 'ur') return 'اردو (Urdu)';
  if (c.includes('guj') || c === 'gu') return 'ગુજરાતી (Gujarati)';
  if (c.includes('tam') || c === 'ta') return 'தமிழ் (Tamil)';
  if (c.includes('tel') || c === 'te') return 'తెలుగు (Telugu)';
  if (c.includes('kan') || c === 'kn') return 'ಕನ್ನಡ (Kannada)';
  if (c.includes('mal') || c === 'ml') return 'മലയാളം (Malayalam)';
  if (c.includes('pan') || c === 'pa') return 'ਪੰਜਾਬੀ (Punjabi)';
  if (c.includes('fre') || c === 'fra' || c === 'fr') return 'French';
  if (c.includes('ger') || c === 'deu' || c === 'de') return 'German';
  if (c.includes('spa') || c === 'es') return 'Spanish';
  return code.charAt(0).toUpperCase() + code.slice(1);
}

/**
 * Builds standard Internet Archive image cover URL
 */
export function getArchiveCoverUrl(identifier: string): string {
  if (!identifier) return '';
  return `${IA_SERVICES_IMG_URL}/${encodeURIComponent(identifier)}`;
}

export interface SearchRecommendation {
  text: string;
  title: string;
  author: string;
  category: string;
  query: string;
}

const POPULAR_RECOMMENDATION_DATABASE: SearchRecommendation[] = [
  // Famous Indian & Hindi Classics
  { text: 'Godaan (गोदान)', title: 'Godaan (गोदान)', author: 'Munshi Premchand', category: 'Hindi Novel', query: 'Godaan Premchand' },
  { text: 'Gaban (गबन)', title: 'Gaban (गबन)', author: 'Munshi Premchand', category: 'Hindi Novel', query: 'Gaban Premchand' },
  { text: 'Nirmala (निर्मला)', title: 'Nirmala (निर्मला)', author: 'Munshi Premchand', category: 'Hindi Classic', query: 'Nirmala Premchand' },
  { text: 'Karmabhoomi (कर्मभूमि)', title: 'Karmabhoomi (कर्मभूमि)', author: 'Munshi Premchand', category: 'Hindi Novel', query: 'Karmabhoomi Premchand' },
  { text: 'Gitanjali (गीतांजलि)', title: 'Gitanjali (गीतांजलि)', author: 'Rabindranath Tagore', category: 'Poetry', query: 'Gitanjali Tagore' },
  { text: 'Rashmirathi (रश्मिरथी)', title: 'Rashmirathi (रश्मिरथी)', author: 'Ramdhari Singh Dinkar', category: 'Epic Poetry', query: 'Rashmirathi Dinkar' },
  { text: 'Madhushala (मधुशाला)', title: 'Madhushala (मधुशाला)', author: 'Harivansh Rai Bachchan', category: 'Poetry', query: 'Madhushala Bachchan' },
  { text: 'Chanakya Niti (चाणक्य नीति)', title: 'Chanakya Niti (चाणक्य नीति)', author: 'Acharya Chanakya', category: 'Strategy', query: 'Chanakya Niti' },
  { text: 'Bhagavad Gita (श्रीमद्भगवद्गीता)', title: 'Bhagavad Gita (श्रीमद्भगवद्गीता)', author: 'Ved Vyasa', category: 'Philosophy', query: 'Bhagavad Gita' },
  { text: 'Panchatantra (पंचतंत्र)', title: 'Panchatantra (पंचतंत्र)', author: 'Vishnu Sharma', category: 'Moral Tales', query: 'Panchatantra' },
  { text: 'Kamayani (कामायनी)', title: 'Kamayani (कामायनी)', author: 'Jaishankar Prasad', category: 'Mahakavya', query: 'Kamayani Jaishankar Prasad' },
  { text: 'Yama (यामा)', title: 'Yama (यामा)', author: 'Mahadevi Varma', category: 'Hindi Poetry', query: 'Mahadevi Varma' },
  { text: 'Kabir Granthavali (कबीर ग्रंथावली)', title: 'Kabir Granthavali', author: 'Sant Kabir Das', category: 'Mystic Poetry', query: 'Kabir dohe' },
  { text: 'Swami Vivekananda: Complete Works', title: 'Complete Works of Swami Vivekananda', author: 'Swami Vivekananda', category: 'Vedanta', query: 'Complete Works Swami Vivekananda' },
  { text: 'Satyarth Prakash (सत्यार्थ प्रकाश)', title: 'Satyarth Prakash', author: 'Swami Dayanand Saraswati', category: 'Spiritual', query: 'Satyarth Prakash' },
  { text: 'The Story of My Experiments with Truth', title: 'My Experiments with Truth', author: 'Mahatma Gandhi', category: 'Autobiography', query: 'My Experiments with Truth Gandhi' },
  { text: 'The Discovery of India (भारत की खोज)', title: 'Discovery of India', author: 'Jawaharlal Nehru', category: 'History', query: 'Discovery of India Nehru' },
  // Marathi Classics
  { text: 'Shyamchi Aai (श्यामची आई)', title: 'Shyamchi Aai (श्यामची आई)', author: 'Sane Guruji', category: 'Marathi Classic', query: 'Shyamchi Aai' },
  { text: 'Mrityunjay (मृत्युंजय)', title: 'Mrityunjay (मृत्युंजय)', author: 'Shivaji Sawant', category: 'Historical Novel', query: 'Mrityunjay Shivaji Sawant' },
  { text: 'Yayati (ययाति)', title: 'Yayati (ययाति)', author: 'V. S. Khandekar', category: 'Jnanpith Novel', query: 'Yayati Khandekar' },
  { text: 'Tukaram Gatha (तुकाराम गाथा)', title: 'Tukaram Gatha', author: 'Sant Tukaram', category: 'Abhang & Poetry', query: 'Sant Tukaram Gatha' },
  { text: 'Dnyaneshwari (ज्ञानेश्वरी)', title: 'Dnyaneshwari', author: 'Sant Dnyaneshwar', category: 'Spiritual Classic', query: 'Dnyaneshwari' },
  { text: 'Vyakti Aani Valli (व्यक्ति आणि वल्ली)', title: 'Vyakti Aani Valli', author: 'P. L. Deshpande (पु. ल.)', category: 'Humor & Drama', query: 'Pu La Deshpande' },
  // Universal Growth, Psychology & Mindset Classics
  { text: 'Think and Grow Rich', title: 'Think and Grow Rich', author: 'Napoleon Hill', category: 'Self Mastery', query: 'Think and Grow Rich Napoleon Hill' },
  { text: 'As a Man Thinketh', title: 'As a Man Thinketh', author: 'James Allen', category: 'Mindset', query: 'As a Man Thinketh James Allen' },
  { text: 'The Art of War', title: 'The Art of War', author: 'Sun Tzu', category: 'Strategy', query: 'The Art of War Sun Tzu' },
  { text: 'Autobiography of a Yogi', title: 'Autobiography of a Yogi', author: 'Paramahansa Yogananda', category: 'Spiritual Memoir', query: 'Autobiography of a Yogi' },
  { text: 'Meditations', title: 'Meditations', author: 'Marcus Aurelius', category: 'Stoic Philosophy', query: 'Meditations Marcus Aurelius' },
  { text: 'The Prophet', title: 'The Prophet', author: 'Kahlil Gibran', category: 'Wisdom', query: 'The Prophet Kahlil Gibran' },
  { text: 'Man’s Search for Meaning', title: 'Man’s Search for Meaning', author: 'Viktor E. Frankl', category: 'Psychology', query: 'Viktor Frankl Search for Meaning' },
];

export function getSearchRecommendations(input: string, limit = 8): SearchRecommendation[] {
  const clean = (input || '').trim().toLowerCase();
  if (!clean) {
    return POPULAR_RECOMMENDATION_DATABASE.slice(0, limit);
  }
  return POPULAR_RECOMMENDATION_DATABASE.filter(
    (item) =>
      item.title.toLowerCase().includes(clean) ||
      item.author.toLowerCase().includes(clean) ||
      item.text.toLowerCase().includes(clean) ||
      item.category.toLowerCase().includes(clean) ||
      item.query.toLowerCase().includes(clean)
  ).slice(0, limit);
}

/**
 * Constructs robust Advanced Search query for Internet Archive
 */
function buildSearchQuery(options: ArchiveSearchOptions): string {
  const rawQuery = (options.query || '').trim();
  const searchType = options.searchType || 'all';
  const language = options.language || 'all';

  let termPart = '';

  if (rawQuery && rawQuery !== 'ALL_BOOKS' && rawQuery !== '*') {
    // Clean string from problematic punctuation for Solr
    const cleaned = rawQuery.replace(/[:"\\\/()\[\]{}^~*?]/g, ' ').replace(/\s+/g, ' ').trim();
    if (searchType === 'title') {
      termPart = `(title:("${cleaned}" OR ${cleaned}))`;
    } else if (searchType === 'creator') {
      termPart = `(creator:("${cleaned}" OR ${cleaned}))`;
    } else if (searchType === 'subject') {
      termPart = `(subject:("${cleaned}" OR ${cleaned}))`;
    } else {
      // General multi-field keyword search
      termPart = `(title:(${cleaned}) OR creator:(${cleaned}) OR description:(${cleaned}) OR subject:(${cleaned}) OR ${cleaned})`;
    }
  } else {
    // Default high-quality books discovery when exploring all
    termPart = `(collection:(digitallibraryindia OR pub_hindi OR jaigyan OR internetarchivebooks OR JaiGyan OR opensource OR booksbylanguage_hindi OR booksbylanguage_marathi OR booksbylanguage_sanskrit OR additional_collections))`;
  }

  // Language filter clause
  let langPart = '';
  if (language && language !== 'all') {
    if (language === 'hin') {
      langPart = 'AND (language:(hin OR hindi OR "Hindi" OR hin-IN))';
    } else if (language === 'mar') {
      langPart = 'AND (language:(mar OR marathi OR "Marathi"))';
    } else if (language === 'eng') {
      langPart = 'AND (language:(eng OR english OR "English"))';
    } else if (language === 'san') {
      langPart = 'AND (language:(san OR sanskrit OR "Sanskrit"))';
    } else if (language === 'ben') {
      langPart = 'AND (language:(ben OR bengali OR "Bengali"))';
    } else if (language === 'urd') {
      langPart = 'AND (language:(urd OR urdu OR "Urdu"))';
    } else if (language === 'guj') {
      langPart = 'AND (language:(guj OR gujarati OR "Gujarati"))';
    } else if (language === 'tam') {
      langPart = 'AND (language:(tam OR tamil OR "Tamil"))';
    } else {
      langPart = `AND (language:(${language}))`;
    }
  }

  // Base query: strictly texts mediatype
  return `mediatype:texts AND ${termPart} ${langPart}`;
}

/**
 * Searches Internet Archive dynamically with real-time pagination & filters
 */
export async function searchArchiveBooks(options: ArchiveSearchOptions): Promise<ArchiveSearchResponse> {
  const page = Math.max(1, options.page || 1);
  const rows = Math.min(50, Math.max(12, options.rows || 24));
  const sortParam = options.sort === 'date'
    ? 'publicdate desc'
    : options.sort === 'title'
    ? 'title asc'
    : 'downloads desc';

  const queryString = buildSearchQuery(options);

  const params = new URLSearchParams({
    q: queryString,
    'fl[]': 'identifier,title,creator,description,date,year,language,subject,collection,mediatype,format,downloads,item_size,publicdate',
    'sort[]': sortParam,
    rows: rows.toString(),
    page: page.toString(),
    output: 'json'
  });

  const proxyUrl = `/api/archive/search?${params.toString()}`;
  const directUrl = `${IA_ADVANCED_SEARCH_URL}?${params.toString()}`;

  let jsonResult: any = null;

  // Try server proxy first (avoids browser CORS issues)
  try {
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      jsonResult = await proxyRes.json();
    } else {
      throw new Error(`Proxy status ${proxyRes.status}`);
    }
  } catch (proxyErr) {
    console.warn('Proxy archive search failed, attempting direct fetch fallback...', proxyErr);
    try {
      const res = await fetch(directUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });
      if (res.ok) {
        jsonResult = await res.json();
      } else {
        throw new Error(`Direct status ${res.status}`);
      }
    } catch (directErr) {
      console.error('All Internet Archive search channels failed:', directErr);
      throw new Error('Unable to connect to Internet Archive. Please check your internet connection.');
    }
  }

  if (!jsonResult || !jsonResult.response) {
    return {
      numFound: 0,
      start: 0,
      docs: [],
      page,
      totalPages: 1
    };
  }

  const rawDocs: any[] = jsonResult.response.docs || [];
  const numFound: number = jsonResult.response.numFound || 0;
  const totalPages = Math.max(1, Math.ceil(numFound / rows));

  // Filter and normalize results to ensure high quality book publications
  const validDocs: ArchiveBookItem[] = [];

  for (const doc of rawDocs) {
    if (!doc.identifier || typeof doc.identifier !== 'string') continue;

    const rawTitle = Array.isArray(doc.title) ? doc.title.join(', ') : doc.title;
    const cleanTitle = (rawTitle || '').trim();
    if (!cleanTitle || cleanTitle === '[Untitled]' || cleanTitle.toLowerCase() === 'untitled') {
      continue;
    }

    // Format author / creator
    let creator = 'Unknown Author';
    if (doc.creator) {
      if (Array.isArray(doc.creator)) {
        creator = doc.creator.filter(Boolean).join(', ');
      } else if (typeof doc.creator === 'string') {
        creator = doc.creator.trim();
      }
    }

    // Format description
    let description = '';
    if (doc.description) {
      if (Array.isArray(doc.description)) {
        description = doc.description.join(' ').replace(/<[^>]*>?/gm, '').trim();
      } else if (typeof doc.description === 'string') {
        description = doc.description.replace(/<[^>]*>?/gm, '').trim();
      }
    }
    if (description.length > 400) {
      description = description.slice(0, 400) + '...';
    }

    // Format language
    let language = 'und';
    if (doc.language) {
      if (Array.isArray(doc.language)) {
        language = doc.language[0] || 'und';
      } else if (typeof doc.language === 'string') {
        language = doc.language;
      }
    }

    // Format subjects
    let subjects: string[] = [];
    if (doc.subject) {
      if (Array.isArray(doc.subject)) {
        subjects = doc.subject.map(String).filter(Boolean).slice(0, 6);
      } else if (typeof doc.subject === 'string') {
        subjects = doc.subject.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
      }
    }

    // Format collections
    let collections: string[] = [];
    if (doc.collection) {
      if (Array.isArray(doc.collection)) {
        collections = doc.collection.map(String).filter(Boolean);
      } else if (typeof doc.collection === 'string') {
        collections = [doc.collection];
      }
    }

    // Format formats
    let formats: string[] = [];
    if (doc.format) {
      if (Array.isArray(doc.format)) {
        formats = doc.format.map(String).filter(Boolean);
      } else if (typeof doc.format === 'string') {
        formats = [doc.format];
      }
    }

    validDocs.push({
      identifier: doc.identifier,
      title: cleanTitle,
      creator: creator || 'Author Unknown',
      description: description || 'No summary provided in the Archive catalogue record.',
      language,
      date: doc.date || doc.year || '',
      year: doc.year || (doc.date ? String(doc.date).slice(0, 4) : ''),
      subjects,
      collections,
      formats,
      downloads: typeof doc.downloads === 'number' ? doc.downloads : parseInt(doc.downloads, 10) || 0,
      itemSize: typeof doc.item_size === 'number' ? doc.item_size : parseInt(doc.item_size, 10) || 0,
      publicDate: doc.publicdate,
      coverUrl: getArchiveCoverUrl(doc.identifier),
      mediatype: doc.mediatype || 'texts'
    });
  }

  return {
    numFound,
    start: jsonResult.response.start || 0,
    docs: validDocs,
    page,
    totalPages
  };
}

/**
 * Fetches comprehensive metadata for a specific Archive item on demand
 */
export async function getArchiveItemMetadata(identifier: string): Promise<ArchiveItemMetadata> {
  const cached = metadataCache.get(identifier);
  if (cached) return cached;

  const targetUrl = `${IA_METADATA_URL}/${encodeURIComponent(identifier)}`;
  let data: any = null;

  // Try local proxy first (avoids browser CORS issues)
  try {
    const proxyRes = await fetch(`/api/archive/metadata/${encodeURIComponent(identifier)}`);
    if (proxyRes.ok) {
      data = await proxyRes.json();
    } else {
      throw new Error(`Proxy status ${proxyRes.status}`);
    }
  } catch (proxyErr) {
    console.warn(`Local proxy metadata fetch for ${identifier} failed, attempting direct fetch fallback...`, proxyErr);
    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });
      if (res.ok) {
        data = await res.json();
      } else {
        throw new Error(`Direct HTTP status ${res.status}`);
      }
    } catch (directErr) {
      console.error(`Metadata fetch failed for ${identifier}:`, directErr);
      throw new Error(`Could not load metadata for Archive item "${identifier}".`);
    }
  }

  if (!data || !data.metadata) {
    throw new Error(`No metadata found for item "${identifier}".`);
  }

  const m = data.metadata;
  const files: ArchiveFile[] = Array.isArray(data.files) ? data.files : [];

  // Determine restriction signals accurately
  const isRestricted =
    m['access-restricted-item'] === 'true' ||
    m.is_restricted === 'true' ||
    m.is_restricted === true ||
    m.inlibrary === 'true' ||
    m.lending_identifier !== undefined ||
    m.lending_status === 'borrowed' ||
    m.curation === '[curator]associate-restricted@archive.org[/curator]';

  const restrictionReason = isRestricted
    ? 'This item is restricted, borrow-only, or requires controlled digital lending credentials on Internet Archive.'
    : undefined;

  // Resolve permitted readable resource
  const readableResource = resolveReadableResource(identifier, files, isRestricted);

  const rawTitle = Array.isArray(m.title) ? m.title.join(', ') : m.title;
  const title = (rawTitle || identifier).trim();

  let creator = 'Unknown Author';
  if (m.creator) {
    creator = Array.isArray(m.creator) ? m.creator.join(', ') : String(m.creator);
  }

  let description = '';
  if (m.description) {
    description = Array.isArray(m.description) ? m.description.join(' ') : String(m.description);
    description = description.replace(/<[^>]*>?/gm, '').trim();
  }

  let language = 'und';
  if (m.language) {
    language = Array.isArray(m.language) ? m.language[0] : String(m.language);
  }

  let subjects: string[] = [];
  if (m.subject) {
    subjects = Array.isArray(m.subject) ? m.subject : String(m.subject).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  }

  let collections: string[] = [];
  if (m.collection) {
    collections = Array.isArray(m.collection) ? m.collection : [String(m.collection)];
  }

  const result: ArchiveItemMetadata = {
    identifier,
    title,
    creator,
    description,
    language,
    date: m.date || m.year,
    year: m.year || (m.date ? String(m.date).slice(0, 4) : ''),
    subjects,
    collections,
    publisher: m.publisher,
    licenseurl: m.licenseurl,
    rights: m.rights,
    sponsor: m.sponsor,
    isRestricted,
    restrictionReason,
    files,
    readableResource,
    imagecount: m.imagecount ? parseInt(String(m.imagecount), 10) : undefined,
    server: data.server,
    dir: data.dir
  };

  metadataCache.set(identifier, result);
  return result;
}

/**
 * Inspects returned files to identify the best permitted readable resource (PDF, EPUB, DjVuTXT, Text)
 */
export function resolveReadableResource(
  identifier: string,
  files: ArchiveFile[],
  isRestricted: boolean
): ReadableResource | null {
  if (isRestricted) {
    return null;
  }

  // 1. Text PDF (highest fidelity for reading)
  const textPdf = files.find(
    (f) =>
      f.name &&
      f.name.toLowerCase().endsWith('.pdf') &&
      (f.format === 'Text PDF' || f.format === 'Additional Text PDF')
  );
  if (textPdf) {
    return {
      type: 'pdf',
      url: `${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(textPdf.name)}`,
      fileName: textPdf.name,
      size: typeof textPdf.size === 'number' ? textPdf.size : parseInt(String(textPdf.size), 10) || undefined,
      formatName: 'Text PDF (Searchable)'
    };
  }

  // 2. Standard PDF or Image Container PDF
  const standardPdf = files.find(
    (f) =>
      f.name &&
      f.name.toLowerCase().endsWith('.pdf') &&
      !f.name.toLowerCase().endsWith('_bw.pdf') &&
      !f.name.toLowerCase().includes('_thumb')
  );
  if (standardPdf) {
    return {
      type: 'pdf',
      url: `${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(standardPdf.name)}`,
      fileName: standardPdf.name,
      size: typeof standardPdf.size === 'number' ? standardPdf.size : parseInt(String(standardPdf.size), 10) || undefined,
      formatName: standardPdf.format || 'Scanned PDF'
    };
  }

  // 3. EPUB Format
  const epubFile = files.find(
    (f) =>
      f.name &&
      f.name.toLowerCase().endsWith('.epub')
  );
  if (epubFile) {
    return {
      type: 'epub',
      url: `${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(epubFile.name)}`,
      fileName: epubFile.name,
      size: typeof epubFile.size === 'number' ? epubFile.size : parseInt(String(epubFile.size), 10) || undefined,
      formatName: 'EPUB E-Book'
    };
  }

  // 4. DjVuTXT / OCR Text format
  const djvuTxt = files.find(
    (f) =>
      f.name &&
      (f.name.toLowerCase().endsWith('_djvu.txt') || f.format === 'DjVuTXT')
  );
  if (djvuTxt) {
    return {
      type: 'djvu_txt',
      url: `${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(djvuTxt.name)}`,
      fileName: djvuTxt.name,
      size: typeof djvuTxt.size === 'number' ? djvuTxt.size : parseInt(String(djvuTxt.size), 10) || undefined,
      formatName: 'DjVu OCR Text'
    };
  }

  // 5. Raw Text (.txt)
  const plainTxt = files.find(
    (f) =>
      f.name &&
      f.name.toLowerCase().endsWith('.txt') &&
      !f.name.toLowerCase().includes('_meta')
  );
  if (plainTxt) {
    return {
      type: 'text',
      url: `${IA_DOWNLOAD_URL}/${encodeURIComponent(identifier)}/${encodeURIComponent(plainTxt.name)}`,
      fileName: plainTxt.name,
      size: typeof plainTxt.size === 'number' ? plainTxt.size : parseInt(String(plainTxt.size), 10) || undefined,
      formatName: 'Plain Text'
    };
  }

  return null;
}

/**
 * Returns proxy stream URL for remote Internet Archive files to bypass CORS
 */
export function getArchivePdfStreamUrl(remoteUrl: string): string {
  if (!remoteUrl) return '';
  return `/api/archive/proxy-file?url=${encodeURIComponent(remoteUrl)}`;
}

/**
 * Constructs the official Internet Archive embedded book reader URL
 */
export function getArchiveEmbedUrl(identifier: string, page = 1): string {
  if (!identifier) return '';
  return `https://archive.org/embed/${encodeURIComponent(identifier)}?ui=embed#page/${Math.max(1, page)}`;
}

