import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db, cleanFirestoreData, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Book,
  CategoryItem,
  QuoteItem,
  ChallengeItem,
  UserChallenge,
  HabitItem,
  HabitLog,
  GoalItem,
  JournalEntry,
  LibraryItem,
  ReadingProgress,
  NoteItem,
  CommunityPost,
  CollectionItem,
  Achievement,
  NotificationItem,
  UserStats
} from '../types';
import {
  ArchiveLibraryItem,
  ArchiveReadingProgress,
  ArchiveBookItem
} from '../types/archive';
import {
  SEED_BOOKS,
  SEED_CATEGORIES,
  SEED_QUOTES,
  SEED_CHALLENGES,
  DEFAULT_HABITS,
  SEED_ACHIEVEMENTS
} from '../data/seedData';
import { CURATED_BOOKS } from '../data/curatedBooks';
import confetti from 'canvas-confetti';

interface DataContextType {
  books: Book[];
  categories: CategoryItem[];
  quotes: QuoteItem[];
  dailyQuote: QuoteItem;
  challenges: ChallengeItem[];
  userChallenges: Record<string, UserChallenge>;
  habits: HabitItem[];
  habitLogs: Record<string, boolean>; // key: `${habitId}_${date}`
  goals: GoalItem[];
  journalEntries: JournalEntry[];
  library: Record<string, LibraryItem>;
  readingProgress: Record<string, ReadingProgress>;
  notes: NoteItem[];
  communityPosts: CommunityPost[];
  collections: CollectionItem[];
  achievements: Achievement[];
  notifications: NotificationItem[];
  stats: UserStats;

  // Internet Archive Online Library State
  archiveLibrary: Record<string, ArchiveLibraryItem>;
  archiveProgress: Record<string, ArchiveReadingProgress>;
  activeArchiveBookId: string | null;
  activeArchiveReader: { identifier: string; title: string; creator?: string; coverUrl?: string } | null;
  archiveSearchQuery: string;
  setArchiveSearchQuery: (query: string) => void;
  openArchiveBookDetails: (identifier: string) => void;
  closeArchiveBookDetails: () => void;
  openArchiveReader: (book: { identifier: string; title: string; creator?: string; coverUrl?: string }) => void;
  closeArchiveReader: () => void;
  saveArchiveReadingProgress: (progress: ArchiveReadingProgress) => Promise<void>;
  addArchiveToLibrary: (item: ArchiveLibraryItem) => Promise<void>;
  removeArchiveFromLibrary: (identifier: string) => Promise<void>;
  
  // Modals & Navigation Helpers
  activeReaderBookId: string | null;
  openReader: (bookId: string) => void;
  closeReader: () => void;
  activeBookDetailsId: string | null;
  openBookDetails: (bookId: string) => void;
  closeBookDetails: () => void;
  recentlyUnlockedAchievement: Achievement | null;
  closeAchievementModal: () => void;
  coachPromptInitial: string | null;
  openCoachWithPrompt: (prompt: string) => void;
  navTabRequest: string | null;
  clearNavTabRequest: () => void;
  isAdmin: boolean;

  // Actions
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  seedInitialBooks: () => Promise<void>;
  resetTo50CuratedBooks: () => Promise<void>;
  resetTo500CuratedBooks: () => Promise<void>;
  deleteAllFirestoreBooks: () => Promise<{ deletedCount: number }>;
  purgeCorruptedAndExtractedJunk: () => Promise<{ deletedCount: number; remainingCount: number }>;

  addToLibrary: (bookId: string, shelf: LibraryItem['shelf']) => Promise<void>;
  removeFromLibrary: (bookId: string) => Promise<void>;
  
  saveReadingProgress: (
    bookId: string,
    page: number,
    chapterIdOrPages?: string | number,
    percentage?: number,
    minutesSpent?: number,
    completed?: boolean
  ) => Promise<void>;

  addNote: (note: Omit<NoteItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;

  toggleHabit: (habitId: string, date: string) => Promise<void>;
  createHabit: (habit: Omit<HabitItem, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak'>) => Promise<void>;
  addHabit: (habit: Omit<HabitItem, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak'>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;

  saveJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  joinChallenge: (challengeId: string) => Promise<void>;
  completeChallengeTask: (challengeId: string, day: number) => Promise<void>;
  progressChallenge: (challengeId: string) => Promise<void>;

  updateGoal: (goalId: string, progressDelta: number) => Promise<void>;

  addCommunityPost: (content: string, quote?: CommunityPost['quote'], bookId?: string, bookTitle?: string, category?: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  reportPost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  createCollection: (title: string, description?: string) => Promise<void>;
  addBookToCollection: (collectionId: string, bookId: string) => Promise<void>;
  removeBookFromCollection: (collectionId: string, bookId: string) => Promise<void>;

  unlockAchievement: (achievementId: string) => void;
  markNotificationRead: (id: string) => void;
  rotateQuote: () => void;
  likeQuote: (quoteId: string) => void;
  addQuote: (q: Omit<QuoteItem, 'id' | 'likes'>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser, updateUserProfile } = useAuth();
  const isAdmin = Boolean(
    user?.email?.toLowerCase() === 'jaycjadiib@gmail.com' ||
    firebaseUser?.email?.toLowerCase() === 'jaycjadiib@gmail.com'
  );

  // Real Curated Books Collection (500 Hindi Masterpieces & Classics)
  const [books, setBooks] = useState<Book[]>(CURATED_BOOKS);

  const [categories, setCategories] = useState<CategoryItem[]>(SEED_CATEGORIES);
  const [quotes, setQuotes] = useState<QuoteItem[]>(SEED_QUOTES);
  const [dailyQuoteIndex, setDailyQuoteIndex] = useState(0);
  const [challenges, setChallenges] = useState<ChallengeItem[]>(SEED_CHALLENGES);
  
  // User specific states
  const [userChallenges, setUserChallenges] = useState<Record<string, UserChallenge>>({});

  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const saved = localStorage.getItem('mindrise_habits');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [habitLogs, setHabitLogs] = useState<Record<string, boolean>>({});

  const [goals, setGoals] = useState<GoalItem[]>([
    {
      id: 'goal-daily-reading',
      title: 'Daily Reading Session',
      type: 'daily',
      target: user?.dailyReadingGoal || 30,
      current: 24,
      unit: 'minutes',
      period: new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: '2026-09-01',
    },
    {
      id: 'goal-weekly-reading',
      title: 'Weekly Focus Sprint',
      type: 'weekly',
      target: 180,
      current: 145,
      unit: 'minutes',
      period: '2026-W36',
      completed: false,
      createdAt: '2026-09-01',
    },
    {
      id: 'goal-monthly-books',
      title: 'Monthly Book Milestone',
      type: 'monthly',
      target: 2,
      current: 1,
      unit: 'books',
      period: '2026-09',
      completed: false,
      createdAt: '2026-09-01',
    },
    {
      id: 'goal-yearly-books',
      title: 'Yearly Intellectual Summit',
      type: 'yearly',
      target: user?.yearlyBookGoal || 24,
      current: 6,
      unit: 'books',
      period: '2026',
      completed: false,
      createdAt: '2026-01-01',
    }
  ]);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: 'journal-1',
      date: '2026-09-04',
      mood: 'fire',
      reflectionDay: 'A remarkably focused Friday. Implemented Seneca’s advice on eliminating discursive wandering and executed two deep 90-minute blocks.',
      accomplished: 'Completed Book II of Marcus Aurelius Meditations. Finished high-priority system architecture.',
      wentWrong: 'Allowed late-afternoon notification check to disrupt second focus session by 15 minutes.',
      learned: 'When mental friction appears, pause for 4 deep breaths rather than picking up the smartphone.',
      improveTomorrow: 'Protect first 90 minutes post-wake completely analog.',
      keyTakeaway: 'Tranquility is nothing other than the good ordering of the mind.',
      tags: ['Stoicism', 'Deep Work', 'Discipline'],
      createdAt: '2026-09-04T21:30:00.000Z'
    }
  ]);

  const [library, setLibrary] = useState<Record<string, LibraryItem>>({
    'meditations-marcus-aurelius': {
      id: 'lib-1',
      bookId: 'meditations-marcus-aurelius',
      shelf: 'currently-reading',
      addedAt: '2026-08-15T00:00:00.000Z',
      updatedAt: '2026-09-05T00:00:00.000Z'
    },
    'mindrise-30-days-discipline': {
      id: 'lib-2',
      bookId: 'mindrise-30-days-discipline',
      shelf: 'currently-reading',
      addedAt: '2026-08-20T00:00:00.000Z',
      updatedAt: '2026-09-04T00:00:00.000Z'
    },
    'as-a-man-thinketh-james-allen': {
      id: 'lib-3',
      bookId: 'as-a-man-thinketh-james-allen',
      shelf: 'completed',
      addedAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z'
    },
    'the-focus-protocol': {
      id: 'lib-4',
      bookId: 'the-focus-protocol',
      shelf: 'want-to-read',
      addedAt: '2026-09-02T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z'
    }
  });

  const [readingProgress, setReadingProgress] = useState<Record<string, ReadingProgress>>({
    'meditations-marcus-aurelius': {
      bookId: 'meditations-marcus-aurelius',
      currentPage: 52,
      currentChapterId: 'book-3',
      percentage: 28,
      minutesSpent: 185,
      lastReadAt: new Date().toISOString(),
      completed: false
    },
    'mindrise-30-days-discipline': {
      bookId: 'mindrise-30-days-discipline',
      currentPage: 45,
      currentChapterId: 'disc-ch2',
      percentage: 35,
      minutesSpent: 90,
      lastReadAt: new Date(Date.now() - 86400000).toISOString(),
      completed: false
    },
    'as-a-man-thinketh-james-allen': {
      bookId: 'as-a-man-thinketh-james-allen',
      currentPage: 112,
      currentChapterId: 'ch-effect-thought',
      percentage: 100,
      minutesSpent: 120,
      lastReadAt: '2026-08-10T15:00:00.000Z',
      completed: true,
      completedAt: '2026-08-10T15:00:00.000Z'
    }
  });

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'note-1',
      bookId: 'meditations-marcus-aurelius',
      bookTitle: 'Meditations',
      page: 25,
      selectedText: 'When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly.',
      note: 'Foundational morning mental preparation. Pre-empting frustration removes the surprise when difficult behavior appears.',
      highlightColor: 'yellow',
      type: 'note',
      createdAt: '2026-08-25T08:15:00.000Z'
    },
    {
      id: 'note-2',
      bookId: 'meditations-marcus-aurelius',
      bookTitle: 'Meditations',
      page: 80,
      selectedText: 'Nowhere can man find a quieter or more untroubled retreat than in his own soul.',
      note: 'True tranquility is an interior fortress, independent of geographic escape.',
      highlightColor: 'green',
      type: 'highlight',
      createdAt: '2026-08-28T22:40:00.000Z'
    },
    {
      id: 'note-3',
      bookId: 'as-a-man-thinketh-james-allen',
      bookTitle: 'As a Man Thinketh',
      page: 30,
      selectedText: 'A man’s mind may be likened to a garden, which may be intelligently cultivated or allowed to run wild.',
      note: 'Weeds grow automatically without effort. Useful fruit requires deliberate daily cultivation.',
      highlightColor: 'blue',
      type: 'note',
      createdAt: '2026-08-05T19:00:00.000Z'
    }
  ]);

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([
    {
      id: 'post-1',
      authorId: 'elena-scholar',
      authorName: 'Elena Rostova',
      authorPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      content: 'Just wrapped up Book II of Meditations. The distinction between events outside our control and our judgment of those events is the ultimate unlock for cognitive peace.',
      quote: {
        text: 'Tranquility is nothing other than the good ordering of the mind.',
        author: 'Marcus Aurelius',
        bookTitle: 'Meditations'
      },
      bookId: 'meditations-marcus-aurelius',
      bookTitle: 'Meditations',
      likes: ['user-1', 'user-2', 'demo-scholar-01'],
      commentsCount: 3,
      category: 'Philosophy',
      createdAt: '2026-09-05T14:20:00.000Z',
      comments: [
        {
          id: 'c-1',
          authorId: 'demo-scholar-01',
          authorName: 'Marcus Vance',
          content: 'Spot on Elena. That single chapter reframes entire days.',
          createdAt: '2026-09-05T15:00:00.000Z'
        }
      ]
    },
    {
      id: 'post-2',
      authorId: 'julian-discipline',
      authorName: 'Julian Hayes',
      authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      content: 'Day 12 of the 30-Day Discipline Protocol. Replacing 45 minutes of morning phone scroll with 20 minutes of reading James Allen completely shifted my anxiety levels.',
      category: 'Discipline',
      likes: ['user-4', 'demo-scholar-01'],
      commentsCount: 2,
      createdAt: '2026-09-05T11:45:00.000Z'
    }
  ]);

  const [collections, setCollections] = useState<CollectionItem[]>([
    {
      id: 'col-stoicism',
      title: 'The Stoic Citadel',
      description: 'Ancient philosophy for modern crisis navigation and mental sovereignty.',
      bookIds: ['meditations-marcus-aurelius', 'letters-from-a-stoic-seneca'],
      createdAt: '2026-08-10'
    },
    {
      id: 'col-discipline',
      title: 'High Performance & Will',
      description: 'Protocols for ruthless execution, focus and habit architecture.',
      bookIds: ['mindrise-30-days-discipline', 'the-focus-protocol', 'build-better-habits-system'],
      createdAt: '2026-08-15'
    }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>(SEED_ACHIEVEMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: '🔥 12-Day Streak Active!',
      message: 'You are 8 days away from achieving the 20-Day Scholar badge. Keep the flame alive today.',
      type: 'reading',
      read: false,
      createdAt: '2026-09-05T09:00:00.000Z',
      linkTab: 'goals'
    },
    {
      id: 'notif-2',
      title: 'Habit Reminder: Evening Reflection',
      message: 'Take 3 minutes to capture today’s lessons in your MindRise Journal.',
      type: 'habit',
      read: false,
      createdAt: '2026-09-04T20:30:00.000Z',
      linkTab: 'journal'
    }
  ]);

  // Modals & Navigation state
  const [activeReaderBookId, setActiveReaderBookId] = useState<string | null>(null);
  const [activeBookDetailsId, setActiveBookDetailsId] = useState<string | null>(null);
  const [recentlyUnlockedAchievement, setRecentlyUnlockedAchievement] = useState<Achievement | null>(null);
  const [coachPromptInitial, setCoachPromptInitial] = useState<string | null>(null);
  const [navTabRequest, setNavTabRequest] = useState<string | null>(null);

  // Internet Archive Online Library State
  const [archiveLibrary, setArchiveLibrary] = useState<Record<string, ArchiveLibraryItem>>(() => {
    try {
      const saved = localStorage.getItem('mindrise_archive_library');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [archiveProgress, setArchiveProgress] = useState<Record<string, ArchiveReadingProgress>>(() => {
    try {
      const saved = localStorage.getItem('mindrise_archive_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeArchiveBookId, setActiveArchiveBookId] = useState<string | null>(null);
  const [activeArchiveReader, setActiveArchiveReader] = useState<{
    identifier: string;
    title: string;
    creator?: string;
    coverUrl?: string;
  } | null>(null);

  const [archiveSearchQuery, setArchiveSearchQueryState] = useState<string>('Premchand');

  const setArchiveSearchQuery = useCallback((query: string) => {
    setArchiveSearchQueryState(query);
    setNavTabRequest('explore');
  }, []);

  const openCoachWithPrompt = useCallback((prompt: string) => {
    setCoachPromptInitial(prompt);
    setNavTabRequest('coach');
  }, []);

  const clearNavTabRequest = useCallback(() => {
    setNavTabRequest(null);
  }, []);

  // Connected Ecosystem: Accurate Realtime User Stats from Firebase
  const stats: UserStats = useMemo(() => {
    const totalReadingTimeMinutes = typeof user?.totalReadingMinutes === 'number' && !isNaN(user.totalReadingMinutes)
      ? user.totalReadingMinutes
      : 0;
    const currentStreak = typeof user?.currentStreak === 'number' && !isNaN(user.currentStreak)
      ? user.currentStreak
      : 0;
    const longestStreak = typeof user?.longestStreak === 'number' && !isNaN(user.longestStreak)
      ? user.longestStreak
      : currentStreak;
    const completedCount = (Object.values(readingProgress) as ReadingProgress[]).filter((p) => p.completed).length +
      (Object.values(archiveProgress) as ArchiveReadingProgress[]).filter((p) => p.completed).length;
    const userCompleted = typeof user?.totalBooksCompleted === 'number' && !isNaN(user.totalBooksCompleted)
      ? user.totalBooksCompleted
      : 0;
    const booksCompleted = Math.max(userCompleted, completedCount);
    const highlightsCount = notes.filter((n) => n.type === 'highlight').length;
    const totalPagesRead = typeof user?.totalPagesRead === 'number' && !isNaN(user.totalPagesRead)
      ? user.totalPagesRead
      : 0;

    return {
      totalReadingTimeMinutes,
      currentStreak,
      longestStreak,
      booksCompleted,
      highlightsCount,
      totalPagesRead,
    };
  }, [user, readingProgress, archiveProgress, notes]);

  // Real-Time Firebase Listeners for Active Authenticated User
  useEffect(() => {
    if (!firebaseUser || !db) return;

    const unsubscribes: (() => void)[] = [];

    try {
      // 1. Habits real-time listener
      const habitsCol = collection(db, 'users', firebaseUser.uid, 'habits');
      const unsubHabits = onSnapshot(
        habitsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedHabits: HabitItem[] = [];
            snapshot.forEach((docSnap) => {
              loadedHabits.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            setHabits(loadedHabits);
            try {
              localStorage.setItem('mindrise_habits', JSON.stringify(loadedHabits));
            } catch {}
          } else {
            // First time user: seed default habits into Firestore
            DEFAULT_HABITS.forEach(async (dh) => {
              try {
                await setDoc(doc(db, 'users', firebaseUser.uid, 'habits', dh.id), cleanFirestoreData(dh));
              } catch (e) {
                handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}/habits/${dh.id}`);
              }
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/habits`)
      );
      unsubscribes.push(unsubHabits);

      // 2. Habit Logs real-time listener
      const habitLogsCol = collection(db, 'users', firebaseUser.uid, 'habitLogs');
      const unsubHabitLogs = onSnapshot(
        habitLogsCol,
        (snapshot) => {
          const loadedLogs: Record<string, boolean> = {};
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.completed) {
              loadedLogs[docSnap.id] = true;
            }
          });
          setHabitLogs(loadedLogs);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/habitLogs`)
      );
      unsubscribes.push(unsubHabitLogs);

      // 3. Daily Journal real-time listener
      const journalCol = collection(db, 'users', firebaseUser.uid, 'journal');
      const unsubJournal = onSnapshot(
        journalCol,
        (snapshot) => {
          const loadedJournals: JournalEntry[] = [];
          snapshot.forEach((docSnap) => {
            loadedJournals.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          loadedJournals.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
          setJournalEntries(loadedJournals);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/journal`)
      );
      unsubscribes.push(unsubJournal);

      // 4. Curated Books Library real-time listener
      const libCol = collection(db, 'users', firebaseUser.uid, 'library');
      const unsubLib = onSnapshot(
        libCol,
        (snapshot) => {
          const loadedLib: Record<string, LibraryItem> = {};
          snapshot.forEach((docSnap) => {
            loadedLib[docSnap.id] = { id: docSnap.id, ...(docSnap.data() as any) };
          });
          setLibrary(loadedLib);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/library`)
      );
      unsubscribes.push(unsubLib);

      // 5. Notes real-time listener
      const notesCol = collection(db, 'users', firebaseUser.uid, 'notes');
      const unsubNotes = onSnapshot(
        notesCol,
        (snapshot) => {
          const loadedNotes: NoteItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedNotes.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setNotes(loadedNotes);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/notes`)
      );
      unsubscribes.push(unsubNotes);

      // 6. Reading Progress real-time listener
      const progCol = collection(db, 'users', firebaseUser.uid, 'readingProgress');
      const unsubProg = onSnapshot(
        progCol,
        (snapshot) => {
          const loadedProg: Record<string, ReadingProgress> = {};
          snapshot.forEach((docSnap) => {
            loadedProg[docSnap.id] = docSnap.data() as ReadingProgress;
          });
          setReadingProgress(loadedProg);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/readingProgress`)
      );
      unsubscribes.push(unsubProg);

      // 7. Archive Library real-time listener
      const archLibCol = collection(db, 'users', firebaseUser.uid, 'archiveLibrary');
      const unsubArchLib = onSnapshot(
        archLibCol,
        (snapshot) => {
          const loadedArchLib: Record<string, ArchiveLibraryItem> = {};
          snapshot.forEach((docSnap) => {
            loadedArchLib[docSnap.id] = docSnap.data() as ArchiveLibraryItem;
          });
          setArchiveLibrary(loadedArchLib);
          try {
            localStorage.setItem('mindrise_archive_library', JSON.stringify(loadedArchLib));
          } catch {}
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/archiveLibrary`)
      );
      unsubscribes.push(unsubArchLib);

      // 8. Archive Progress real-time listener
      const archProgCol = collection(db, 'users', firebaseUser.uid, 'archiveProgress');
      const unsubArchProg = onSnapshot(
        archProgCol,
        (snapshot) => {
          const loadedArchProg: Record<string, ArchiveReadingProgress> = {};
          snapshot.forEach((docSnap) => {
            loadedArchProg[docSnap.id] = docSnap.data() as ArchiveReadingProgress;
          });
          setArchiveProgress(loadedArchProg);
          try {
            localStorage.setItem('mindrise_archive_progress', JSON.stringify(loadedArchProg));
          } catch {}
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `users/${firebaseUser.uid}/archiveProgress`)
      );
      unsubscribes.push(unsubArchProg);

      // 9. User profile stats real-time listener
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubUser = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            updateUserProfile({
              currentStreak: data.currentStreak ?? 0,
              longestStreak: data.longestStreak ?? 0,
              totalReadingMinutes: data.totalReadingMinutes ?? 0,
              totalPagesRead: data.totalPagesRead ?? 0,
              totalBooksCompleted: data.totalBooksCompleted ?? 0,
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`)
      );
      unsubscribes.push(unsubUser);
    } catch (err) {
      console.warn('Real-time listener setup error:', err);
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [firebaseUser]);

  // Internet Archive action methods
  const openArchiveBookDetails = (identifier: string) => {
    setActiveArchiveBookId(identifier);
  };

  const closeArchiveBookDetails = () => {
    setActiveArchiveBookId(null);
  };

  const openArchiveReader = (book: { identifier: string; title: string; creator?: string; coverUrl?: string }) => {
    setActiveArchiveBookId(null);
    setActiveArchiveReader(book);
  };

  const closeArchiveReader = () => {
    setActiveArchiveReader(null);
  };

  const saveArchiveReadingProgress = async (progress: ArchiveReadingProgress) => {
    setArchiveProgress((prev) => {
      const next = { ...prev, [progress.identifier]: progress };
      localStorage.setItem('mindrise_archive_progress', JSON.stringify(next));
      return next;
    });

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(
          doc(db, 'users', firebaseUser.uid, 'archiveProgress', progress.identifier),
          cleanFirestoreData(progress)
        );
      } catch (e) {
        console.warn('Could not save archive reading progress to Firestore:', e);
      }
    }
  };

  const addArchiveToLibrary = async (item: ArchiveLibraryItem) => {
    setArchiveLibrary((prev) => {
      const next = { ...prev, [item.identifier]: item };
      localStorage.setItem('mindrise_archive_library', JSON.stringify(next));
      return next;
    });

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(
          doc(db, 'users', firebaseUser.uid, 'archiveLibrary', item.identifier),
          cleanFirestoreData(item)
        );
      } catch (e) {
        console.warn('Could not save archive library item to Firestore:', e);
      }
    }
  };

  const removeArchiveFromLibrary = async (identifier: string) => {
    setArchiveLibrary((prev) => {
      const next = { ...prev };
      delete next[identifier];
      localStorage.setItem('mindrise_archive_library', JSON.stringify(next));
      return next;
    });

    if (firebaseUser?.uid && db) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'archiveLibrary', identifier));
      } catch (e) {
        console.warn('Could not delete archive item from Firestore:', e);
      }
    }
  };

  const dailyQuote = useMemo(() => {
    return quotes[dailyQuoteIndex % quotes.length] || quotes[0];
  }, [quotes, dailyQuoteIndex]);

  const rotateQuote = () => {
    setDailyQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  const likeQuote = (quoteId: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, likes: q.likes + 1 } : q))
    );
  };

  const addQuote = async (q: Omit<QuoteItem, 'id' | 'likes'>) => {
    const newQ: QuoteItem = {
      ...q,
      id: `q-${Date.now()}`,
      likes: 1
    };
    setQuotes((prev) => [newQ, ...prev]);
    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'quotes', newQ.id), cleanFirestoreData(newQ));
      } catch (e) {
        console.warn('Firestore addQuote warning:', e);
      }
    }
  };

  const deleteQuote = async (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    if (firebaseUser?.uid && db) {
      try {
        await deleteDoc(doc(db, 'quotes', id));
      } catch (e) {
        console.warn('Firestore deleteQuote warning:', e);
      }
    }
  };

  const openReader = (bookId: string) => {
    setActiveBookDetailsId(null);
    setActiveReaderBookId(bookId);
  };

  const closeReader = () => {
    setActiveReaderBookId(null);
  };

  const openBookDetails = (bookId: string) => {
    setActiveBookDetailsId(bookId);
  };

  const closeBookDetails = () => {
    setActiveBookDetailsId(null);
  };

  const closeAchievementModal = () => {
    setRecentlyUnlockedAchievement(null);
  };

  const unlockAchievement = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id === id && !a.unlocked) {
          const unlockedA = { ...a, unlocked: true, unlockedAt: new Date().toISOString() };
          setRecentlyUnlockedAchievement(unlockedA);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10b981', '#d4af37', '#ffffff']
            });
          } catch {}
          return unlockedA;
        }
        return a;
      })
    );
  };

  // Book operations (Strictly restricted to Admin)
  const addBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!isAdmin) {
      throw new Error('Unauthorized: Only verified administrators can add books to the MindRise library.');
    }
    const newId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newBook: Book = {
      ...bookData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setBooks((prev) => [newBook, ...prev]);
    localStorage.setItem('mindrise_books', JSON.stringify([newBook, ...books]));

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'books', newId), cleanFirestoreData(newBook));
      } catch (e) {
        console.warn('Firestore addBook warning:', e);
      }
    }

    return newId;
  };

  const updateBook = async (bookId: string, updates: Partial<Book>) => {
    if (!isAdmin) {
      console.warn('Unauthorized updateBook attempt blocked.');
      return;
    }
    const now = new Date().toISOString();
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, ...updates, updatedAt: now } : b))
    );

    if (firebaseUser?.uid && db) {
      try {
        await updateDoc(doc(db, 'books', bookId), cleanFirestoreData({ ...updates, updatedAt: now }));
      } catch (e) {
        console.warn('Firestore updateBook warning:', e);
      }
    }
  };

  const deleteBook = async (bookId: string) => {
    if (!isAdmin) {
      console.warn('Unauthorized deleteBook attempt blocked.');
      return;
    }
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (firebaseUser?.uid && db) {
      try {
        await deleteDoc(doc(db, 'books', bookId));
      } catch (e) {
        console.warn('Firestore deleteBook warning:', e);
      }
    }
  };

  const seedInitialBooks = async () => {
    if (firebaseUser?.uid && db) {
      for (const b of SEED_BOOKS) {
        try {
          await setDoc(doc(db, 'books', b.id), cleanFirestoreData(b));
        } catch (e) {
          console.warn('Seed book error:', e);
        }
      }
    }
    setBooks(SEED_BOOKS);
    localStorage.setItem('mindrise_books_500', JSON.stringify(SEED_BOOKS));
  };

  const resetTo50CuratedBooks = async () => {
    setBooks(SEED_BOOKS);
    localStorage.setItem('mindrise_books_500', JSON.stringify(SEED_BOOKS));
    localStorage.setItem('mindrise_books', JSON.stringify(SEED_BOOKS));
    if (firebaseUser?.uid && db) {
      for (const b of SEED_BOOKS.slice(0, 50)) {
        try {
          await setDoc(doc(db, 'books', b.id), cleanFirestoreData(b));
        } catch (e) {
          console.warn('Sync seed book:', e);
        }
      }
    }
  };

  const resetTo500CuratedBooks = async () => {
    setBooks(SEED_BOOKS);
    localStorage.setItem('mindrise_books_500', JSON.stringify(SEED_BOOKS));
    localStorage.setItem('mindrise_books', JSON.stringify(SEED_BOOKS));
    if (firebaseUser?.uid && db) {
      for (const b of SEED_BOOKS.slice(0, 100)) {
        try {
          await setDoc(doc(db, 'books', b.id), cleanFirestoreData(b));
        } catch (e) {
          console.warn('Sync seed book:', e);
        }
      }
    }
  };

  const deleteAllFirestoreBooks = async (): Promise<{ deletedCount: number }> => {
    let deletedCount = 0;
    if (db) {
      try {
        const booksCol = collection(db, 'books');
        const snap = await getDocs(booksCol);
        const deletePromises: Promise<void>[] = [];
        snap.forEach((docSnap) => {
          deletedCount++;
          deletePromises.push(
            deleteDoc(doc(db, 'books', docSnap.id)).catch((delErr) => {
              console.warn(`Could not delete doc ${docSnap.id}:`, delErr);
            })
          );
        });
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error deleting all books from Firestore:', err);
      }
    }

    setBooks(CURATED_BOOKS);
    localStorage.removeItem('mindrise_books_500');
    localStorage.removeItem('mindrise_books');

    return { deletedCount };
  };

  const purgeCorruptedAndExtractedJunk = async (): Promise<{ deletedCount: number; remainingCount: number }> => {
    let deletedCount = 0;

    if (db) {
      try {
        const booksCol = collection(db, 'books');
        const snap = await getDocs(booksCol);

        const deletePromises: Promise<void>[] = [];
        snap.forEach((docSnap) => {
          deletedCount++;
          deletePromises.push(
            deleteDoc(doc(db, 'books', docSnap.id)).catch((delErr) => {
              console.warn(`Could not delete doc ${docSnap.id}:`, delErr);
            })
          );
        });

        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error purging Firestore books:', err);
      }
    }

    setBooks(CURATED_BOOKS);
    localStorage.removeItem('mindrise_books_500');
    localStorage.removeItem('mindrise_books');

    return { deletedCount, remainingCount: CURATED_BOOKS.length };
  };

  // Library
  const addToLibrary = async (bookId: string, shelf: LibraryItem['shelf']) => {
    const now = new Date().toISOString();
    const item: LibraryItem = {
      id: `lib-${bookId}`,
      bookId,
      shelf,
      addedAt: now,
      updatedAt: now
    };

    setLibrary((prev) => ({ ...prev, [bookId]: item }));

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'library', bookId), cleanFirestoreData(item));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const removeFromLibrary = async (bookId: string) => {
    setLibrary((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });

    if (firebaseUser?.uid && db) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'library', bookId));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Reading Progress & Connected Ecosystem updates
  const saveReadingProgress = useCallback(async (
    bookId: string,
    page: number,
    chapterIdOrPages?: string | number,
    percentage?: number,
    minutesSpent?: number,
    completed = false
  ) => {
    const now = new Date().toISOString();
    const chapterId = typeof chapterIdOrPages === 'string' ? chapterIdOrPages : 'chapter-1';
    let calcPercentage = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0;
    if (typeof chapterIdOrPages === 'number' && chapterIdOrPages > 0) {
      calcPercentage = Math.min(100, Math.round((page / chapterIdOrPages) * 100));
    }
    const safeMinutes = typeof minutesSpent === 'number' && !isNaN(minutesSpent) && minutesSpent > 0 ? minutesSpent : 0;
    const safePage = typeof page === 'number' && !isNaN(page) ? page : 1;
    const isCompleted = Boolean(completed || calcPercentage >= 100);

    let updatedNewProg: ReadingProgress | null = null;
    let isNewlyCompleted = false;

    setReadingProgress((prev) => {
      const currentProg = prev[bookId] || {
        bookId,
        currentPage: 1,
        currentChapterId: chapterId,
        percentage: 0,
        minutesSpent: 0,
        lastReadAt: now,
        completed: false
      };

      if (
        currentProg.currentPage === safePage &&
        currentProg.percentage === calcPercentage &&
        currentProg.completed === isCompleted &&
        safeMinutes === 0
      ) {
        return prev;
      }

      isNewlyCompleted = isCompleted && !currentProg.completed;
      const newProg: ReadingProgress = {
        bookId,
        currentPage: safePage,
        currentChapterId: chapterId,
        percentage: Math.min(100, Math.max(currentProg.percentage, calcPercentage)),
        minutesSpent: currentProg.minutesSpent + safeMinutes,
        lastReadAt: now,
        completed: isCompleted,
        ...(isCompleted ? { completedAt: currentProg.completedAt || now } : {})
      };
      updatedNewProg = newProg;

      if (firebaseUser?.uid && db) {
        setDoc(doc(db, 'users', firebaseUser.uid, 'readingProgress', bookId), cleanFirestoreData(newProg)).catch(console.warn);
      }

      return { ...prev, [bookId]: newProg };
    });

    // Only trigger user profile / goal updates if minutes were logged or a book was newly completed
    if ((safeMinutes > 0 || isNewlyCompleted) && user) {
      const currentMinutes = typeof user.totalReadingMinutes === 'number' && !isNaN(user.totalReadingMinutes) ? user.totalReadingMinutes : 0;
      const currentPages = typeof user.totalPagesRead === 'number' && !isNaN(user.totalPagesRead) ? user.totalPagesRead : 0;
      const currentBooks = typeof user.totalBooksCompleted === 'number' && !isNaN(user.totalBooksCompleted) ? user.totalBooksCompleted : 0;
      
      const updatedTotalMinutes = currentMinutes + safeMinutes;
      const updatedTotalPages = currentPages + (safeMinutes > 0 ? 1 : 0);
      const updatedBooksCompleted = isNewlyCompleted ? currentBooks + 1 : currentBooks;

      updateUserProfile({
        totalReadingMinutes: updatedTotalMinutes,
        totalPagesRead: updatedTotalPages,
        totalBooksCompleted: updatedBooksCompleted
      });

      if (safeMinutes > 0) {
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id === 'goal-daily-reading' || g.id === 'goal-weekly-reading') {
              const nextVal = g.current + safeMinutes;
              return { ...g, current: nextVal, completed: nextVal >= g.target };
            }
            if (g.id === 'goal-monthly-books' && isNewlyCompleted) {
              const nextVal = g.current + 1;
              return { ...g, current: nextVal, completed: nextVal >= g.target };
            }
            return g;
          })
        );
      }

      if (updatedTotalPages >= 1000) unlockAchievement('pages-1000');
      if (updatedBooksCompleted >= 10) unlockAchievement('books-10');
      if (isNewlyCompleted) unlockAchievement('first-book');
    }
  }, [firebaseUser, user, updateUserProfile, unlockAchievement]);

  // Notes
  const addNote = async (noteData: Omit<NoteItem, 'id' | 'createdAt'>) => {
    const newNote: NoteItem = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);

    // Check achievement for highlights
    const totalHighlights = notes.filter((n) => n.type === 'highlight').length + 1;
    if (totalHighlights >= 50) unlockAchievement('highlights-50');

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'notes', newNote.id), cleanFirestoreData(newNote));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const deleteNote = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (firebaseUser?.uid && db) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'notes', noteId));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Habits
  const toggleHabit = async (habitId: string, date: string) => {
    const key = `${habitId}_${date}`;
    const nextState = !habitLogs[key];

    setHabitLogs((prev) => ({ ...prev, [key]: nextState }));

    // Micro-satisfaction confetti on completion
    if (nextState) {
      try {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399']
        });
      } catch {}
    }

    // Update streak on habit
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const currentStreak = nextState ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1);
          const bestStreak = Math.max(h.bestStreak, currentStreak);
          return { ...h, currentStreak, bestStreak };
        }
        return h;
      })
    );

    if (firebaseUser?.uid && db) {
      try {
        const logDocRef = doc(db, 'users', firebaseUser.uid, 'habitLogs', key);
        if (nextState) {
          const logDoc = {
            id: key,
            habitId,
            date,
            completed: true,
            completedAt: new Date().toISOString()
          };
          await setDoc(logDocRef, cleanFirestoreData(logDoc));
        } else {
          await deleteDoc(logDocRef);
        }

        // Update habit streak in Firestore
        const habitItem = habits.find((h) => h.id === habitId);
        const newStreak = nextState ? ((habitItem?.currentStreak || 0) + 1) : Math.max(0, (habitItem?.currentStreak || 0) - 1);
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'habits', habitId), {
          currentStreak: newStreak,
          bestStreak: Math.max(habitItem?.bestStreak || 0, newStreak)
        }).catch(() => {});

        // Update user overall currentStreak in Firestore
        const todayStr = new Date().toISOString().split('T')[0];
        if (date === todayStr && nextState) {
          const updatedUserStreak = (user?.currentStreak || 0) + 1;
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            currentStreak: updatedUserStreak,
            longestStreak: Math.max(user?.longestStreak || 0, updatedUserStreak),
            lastActiveDate: todayStr
          }).catch(async () => {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              currentStreak: updatedUserStreak,
              longestStreak: Math.max(user?.longestStreak || 0, updatedUserStreak),
              lastActiveDate: todayStr
            }, { merge: true });
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}/habitLogs/${key}`);
      }
    }
  };

  const createHabit = async (habitData: Omit<HabitItem, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak'>) => {
    const newHabit: HabitItem = {
      ...habitData,
      id: `habit-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      currentStreak: 0,
      bestStreak: 0,
    };
    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    try {
      localStorage.setItem('mindrise_habits', JSON.stringify(updatedHabits));
    } catch {}

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'habits', newHabit.id), cleanFirestoreData(newHabit));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}/habits/${newHabit.id}`);
      }
    }
  };

  const deleteHabit = async (habitId: string) => {
    const updated = habits.filter((h) => h.id !== habitId);
    setHabits(updated);
    try {
      localStorage.setItem('mindrise_habits', JSON.stringify(updated));
    } catch {}

    if (firebaseUser?.uid && db) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'habits', habitId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${firebaseUser.uid}/habits/${habitId}`);
      }
    }
  };

  // Journal
  const saveJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => {
    const entryId = entry.id || `journal-${Date.now()}`;
    const newEntry: JournalEntry = {
      ...entry,
      id: entryId,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setJournalEntries((prev) => {
      const idx = prev.findIndex((j) => j.id === entryId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newEntry;
        return next;
      }
      return [newEntry, ...prev];
    });

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'journal', entryId), cleanFirestoreData(newEntry));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}/journal/${entryId}`);
      }
    }
  };

  const deleteJournalEntry = async (id: string) => {
    setJournalEntries((prev) => prev.filter((j) => j.id !== id));
    if (firebaseUser?.uid && db) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'journal', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${firebaseUser.uid}/journal/${id}`);
      }
    }
  };

  // Challenges
  const joinChallenge = async (challengeId: string) => {
    const userChallenge: UserChallenge = {
      challengeId,
      joinedAt: new Date().toISOString(),
      completedTasks: [],
      progressPercentage: 0,
      completed: false
    };

    setUserChallenges((prev) => ({ ...prev, [challengeId]: userChallenge }));

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'userChallenges', challengeId), cleanFirestoreData(userChallenge));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const completeChallengeTask = async (challengeId: string, day: number) => {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const current = userChallenges[challengeId] || {
      challengeId,
      joinedAt: new Date().toISOString(),
      completedTasks: [],
      progressPercentage: 0,
      completed: false
    };

    const taskSet = new Set(current.completedTasks);
    if (taskSet.has(day)) {
      taskSet.delete(day);
    } else {
      taskSet.add(day);
    }

    const updatedTasks = Array.from(taskSet);
    const progressPercentage = Math.round((updatedTasks.length / (challenge.tasks.length || 1)) * 100);
    const isCompleted = progressPercentage >= 100;

    const updatedUserChallenge: UserChallenge = {
      ...current,
      completedTasks: updatedTasks,
      progressPercentage,
      completed: isCompleted,
      ...(isCompleted ? { completedAt: current.completedAt || new Date().toISOString() } : {})
    };

    setUserChallenges((prev) => ({ ...prev, [challengeId]: updatedUserChallenge }));

    if (isCompleted) {
      unlockAchievement('challenge-master');
    }

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'userChallenges', challengeId), cleanFirestoreData(updatedUserChallenge));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const progressChallenge = useCallback(async (challengeId: string) => {
    const targetChallenge = challenges.find((c) => c.id === challengeId);
    const duration = targetChallenge?.durationDays || 30;
    const current = userChallenges[challengeId] || {
      challengeId,
      joinedAt: new Date().toISOString(),
      completedTasks: [],
      currentDay: 0,
      progressPercentage: 0,
      completed: false
    };

    const nextDay = Math.min(duration, (current.currentDay || 0) + 1);
    const isCompleted = nextDay >= duration;
    const progressPercentage = Math.round((nextDay / duration) * 100);

    const updatedUserChallenge: UserChallenge = {
      ...current,
      currentDay: nextDay,
      progressPercentage,
      completed: isCompleted,
      ...(isCompleted ? { completedAt: current.completedAt || new Date().toISOString() } : {})
    };

    setUserChallenges((prev) => ({ ...prev, [challengeId]: updatedUserChallenge }));

    if (isCompleted) {
      unlockAchievement('challenge-master');
    }

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'userChallenges', challengeId), cleanFirestoreData(updatedUserChallenge));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [challenges, userChallenges, firebaseUser, unlockAchievement]);

  const addHabit = createHabit;

  // Goals
  const updateGoal = async (goalId: string, progressDelta: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const nextVal = Math.max(0, g.current + progressDelta);
          return { ...g, current: nextVal, completed: nextVal >= g.target };
        }
        return g;
      })
    );
  };

  // Community
  const addCommunityPost = async (
    content: string,
    quote?: CommunityPost['quote'],
    bookId?: string,
    bookTitle?: string,
    category = 'Mindset'
  ) => {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorId: user?.id || 'demo-user',
      authorName: user?.name || 'MindRise Scholar',
      authorPhoto: user?.photoURL,
      content,
      quote,
      bookId,
      bookTitle,
      category,
      likes: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      comments: []
    };

    setCommunityPosts((prev) => [newPost, ...prev]);

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'community_posts', newPost.id), cleanFirestoreData(newPost));
      } catch (e) {
        console.warn('Firestore addCommunityPost warning:', e);
      }
    }
  };

  const likePost = async (postId: string) => {
    const uid = user?.id || 'demo-user';
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = p.likes.includes(uid);
          const nextLikes = hasLiked ? p.likes.filter((id) => id !== uid) : [...p.likes, uid];
          return { ...p, likes: nextLikes };
        }
        return p;
      })
    );
  };

  const addComment = async (postId: string, content: string) => {
    const newComment = {
      id: `c-${Date.now()}`,
      authorId: user?.id || 'demo-user',
      authorName: user?.name || 'Scholar',
      authorPhoto: user?.photoURL,
      content,
      createdAt: new Date().toISOString()
    };

    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const comments = p.comments || [];
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...comments, newComment]
          };
        }
        return p;
      })
    );
  };

  const reportPost = async (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, reported: true } : p))
    );
  };

  const deletePost = async (postId: string) => {
    setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
    if (db) {
      try {
        await deleteDoc(doc(db, 'community_posts', postId));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Collections
  const createCollection = async (title: string, description?: string) => {
    const newCol: CollectionItem = {
      id: `col-${Date.now()}`,
      title,
      description,
      bookIds: [],
      createdAt: new Date().toISOString()
    };
    setCollections((prev) => [...prev, newCol]);

    if (firebaseUser?.uid && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'collections', newCol.id), cleanFirestoreData(newCol));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const addBookToCollection = async (collectionId: string, bookId: string) => {
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id === collectionId && !col.bookIds.includes(bookId)) {
          return { ...col, bookIds: [...col.bookIds, bookId] };
        }
        return col;
      })
    );
  };

  const removeBookFromCollection = async (collectionId: string, bookId: string) => {
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id === collectionId) {
          return { ...col, bookIds: col.bookIds.filter((id) => id !== bookId) };
        }
        return col;
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <DataContext.Provider
      value={{
        books,
        categories,
        quotes,
        dailyQuote,
        challenges,
        userChallenges,
        habits,
        habitLogs,
        goals,
        journalEntries,
        library,
        readingProgress,
        notes,
        communityPosts,
        collections,
        achievements,
        notifications,
        stats,

        // Internet Archive Online Library
        archiveLibrary,
        archiveProgress,
        activeArchiveBookId,
        activeArchiveReader,
        archiveSearchQuery,
        setArchiveSearchQuery,
        openArchiveBookDetails,
        closeArchiveBookDetails,
        openArchiveReader,
        closeArchiveReader,
        saveArchiveReadingProgress,
        addArchiveToLibrary,
        removeArchiveFromLibrary,

        activeReaderBookId,
        openReader,
        closeReader,
        activeBookDetailsId,
        openBookDetails,
        closeBookDetails,
        recentlyUnlockedAchievement,
        closeAchievementModal,
        coachPromptInitial,
        openCoachWithPrompt,
        navTabRequest,
        clearNavTabRequest,
        isAdmin,
        addBook,
        updateBook,
        deleteBook,
        seedInitialBooks,
        resetTo50CuratedBooks,
        resetTo500CuratedBooks,
        deleteAllFirestoreBooks,
        purgeCorruptedAndExtractedJunk,
        addToLibrary,
        removeFromLibrary,
        saveReadingProgress,
        addNote,
        deleteNote,
        toggleHabit,
        createHabit,
        addHabit,
        deleteHabit,
        saveJournalEntry,
        deleteJournalEntry,
        joinChallenge,
        completeChallengeTask,
        progressChallenge,
        updateGoal,
        addCommunityPost,
        likePost,
        addComment,
        reportPost,
        deletePost,
        createCollection,
        addBookToCollection,
        removeBookFromCollection,
        unlockAchievement,
        markNotificationRead,
        rotateQuote,
        likeQuote,
        addQuote,
        deleteQuote,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
