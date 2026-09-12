export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  interests: string[];
  dailyReadingGoal: number; // in minutes (e.g. 20)
  yearlyBookGoal: number; // e.g. 24
  currentStreak: number;
  longestStreak: number;
  totalReadingMinutes: number;
  totalPagesRead: number;
  totalBooksCompleted: number;
  premium: boolean;
  premiumPlan?: 'monthly' | 'yearly' | 'lifetime';
  role: 'user' | 'admin';
  lastActiveAt: string;
  onboardingCompleted: boolean;
  bio?: string;
}

export interface BookChapter {
  id: string;
  title: string;
  pageStart: number;
  startPage?: number;
  endPage?: number;
  content: string; // rich text or markdown paragraphs
  text?: string;
}

export interface BookPageRecord {
  pageNumber: number;
  text: string;
  ocrUsed: boolean;
  method: 'text_layer' | 'ocr_hindi';
  confidence?: number;
  qualityScore?: number;
  flaggedForReview?: boolean;
  rejectionReason?: string;
  presetUsed?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'epub' | 'text';
  category: string;
  categories: string[];
  tags: string[];
  language: string;
  isbn?: string;
  pages: number;
  totalPages?: number;
  rating: number;
  ratingCount: number;
  readCount: number;
  featured: boolean;
  trending: boolean;
  premium: boolean;
  published: boolean;
  publicDomain?: boolean;
  estimatedReadingTime: number; // minutes
  chapters: BookChapter[];
  pageMap?: BookPageRecord[];
  extractionStatus?: string;
  authorBio?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReadingStatus = 'currently-reading' | 'want-to-read' | 'completed' | 'favorites';

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  currentChapterId: string;
  percentage: number;
  minutesSpent: number;
  lastReadAt: string;
  completed: boolean;
  completedAt?: string;
}

export interface LibraryItem {
  id: string;
  bookId: string;
  shelf: ReadingStatus;
  status?: ReadingStatus; // alias for shelf
  addedAt: string;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  bookId: string;
  bookTitle?: string;
  page: number;
  selectedText: string;
  note?: string;
  highlightColor?: 'yellow' | 'green' | 'blue' | 'pink' | string;
  color?: string;
  type: 'highlight' | 'note' | 'bookmark';
  createdAt: string;
}

export interface GoalItem {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target: number;
  current: number;
  unit: 'minutes' | 'books' | 'pages' | 'habits';
  period: string; // e.g., '2026-09-05' or '2026-W36' or '2026-09'
  completed: boolean;
  createdAt: string;
}

export interface HabitItem {
  id: string;
  name: string;
  icon: string;
  category: 'mindset' | 'health' | 'productivity' | 'focus' | 'discipline' | 'learning';
  frequency: 'daily' | 'weekdays' | 'weekly';
  target: number; // times per day
  reminderTime?: string;
  color: string;
  createdAt: string;
  currentStreak: number;
  bestStreak: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
}

export interface ChallengeTask {
  day: number;
  title: string;
  description: string;
  completed?: boolean;
}

export interface ChallengeItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  durationDays: number;
  category: string;
  xp: number;
  coverImage: string;
  rewardBadge: string;
  rules?: string[];
  tasks: ChallengeTask[];
  participantsCount: number;
  published: boolean;
}

export interface UserStats {
  totalReadingTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  booksCompleted: number;
  highlightsCount: number;
  totalPagesRead: number;
}

export interface UserChallenge {
  challengeId: string;
  joinedAt: string;
  completedTasks: number[]; // task indices
  currentDay?: number;
  progressPercentage: number;
  completed: boolean;
  completedAt?: string;
}

export interface JournalEntry {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  mood: 'sad' | 'neutral' | 'happy' | 'motivated' | 'fire' | string;
  reflectionDay?: string;
  accomplished?: string;
  wentWrong?: string;
  learned?: string;
  improveTomorrow?: string;
  keyTakeaway?: string;
  tags?: string[];
  bookId?: string;
  content?: string;
  prompts?: { question: string; answer: string }[];
  aiAnalysis?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  desc?: string;
  icon: string;
  bookCount: number;
  imageUrl: string;
}

export interface QuoteItem {
  id: string;
  text: string;
  author: string;
  source?: string;
  category: string;
  likes: number;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  quote?: {
    text: string;
    author: string;
    bookTitle?: string;
  };
  bookId?: string;
  bookTitle?: string;
  likes: string[]; // userIds
  commentsCount: number;
  comments?: CommunityComment[];
  category: string;
  reported?: boolean;
  createdAt: string;
}

export interface CollectionItem {
  id: string;
  title: string;
  description?: string;
  bookIds: string[];
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'reading' | 'habit' | 'goal' | 'challenge' | 'achievement' | 'system';
  read: boolean;
  createdAt: string;
  timestamp?: string;
  linkTab?: string;
}

export * from './archive';

