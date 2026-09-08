import { CURATED_BOOKS } from './curatedBooks';
import { Book, CategoryItem, QuoteItem, ChallengeItem, Achievement, HabitItem } from '../types';

export const SEED_CATEGORIES: CategoryItem[] = [
  {
    id: 'mindset',
    name: 'Mindset',
    description: 'Master your internal narrative, overcome cognitive biases, and cultivate mental toughness.',
    icon: 'Brain',
    bookCount: 14,
    imageUrl: 'https://images.unsplash.com/photo-1507842229451-79b1be886a20?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'discipline',
    name: 'Discipline',
    description: 'Forge unbreakable daily execution and self-mastery beyond fleeting motivation.',
    icon: 'Shield',
    bookCount: 18,
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Systematize your energy, achieve hyper-focus, and eliminate digital distraction.',
    icon: 'Zap',
    bookCount: 22,
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'habits',
    name: 'Habits',
    description: 'Engineer tiny compounding behaviors that transform your lifestyle effortlessly.',
    icon: 'Repeat',
    bookCount: 16,
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    description: 'Ancient wisdom and Stoic mental frameworks tested through centuries of struggle.',
    icon: 'Compass',
    bookCount: 20,
    imageUrl: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'wealth',
    name: 'Wealth & Finance',
    description: 'Understand value creation, strategic leverage, and long-term financial sovereignty.',
    icon: 'TrendingUp',
    bookCount: 15,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'health',
    name: 'Health & Vitality',
    description: 'Optimize sleep architecture, physical endurance, and biological longevity.',
    icon: 'Heart',
    bookCount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'leadership',
    name: 'Leadership',
    description: 'Inspire trust, navigate team complexity, and lead with quiet authority.',
    icon: 'Users',
    bookCount: 11,
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'psychology',
    name: 'Psychology',
    description: 'Decode human decision patterns, behavioral architecture, and emotional resonance.',
    icon: 'Eye',
    bookCount: 17,
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spirituality',
    name: 'Spirituality',
    description: 'Cultivate inner stillness, presence, and profound connection with reality.',
    icon: 'Sun',
    bookCount: 9,
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
  }
];

export const SEED_BOOKS: Book[] = CURATED_BOOKS;

export const SEED_QUOTES: QuoteItem[] = [
  {
    id: 'q-1',
    text: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
    source: 'Meditations',
    category: 'Stoicism',
    likes: 412
  },
  {
    id: 'q-2',
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
    source: 'The Story of Philosophy',
    category: 'Habits',
    likes: 389
  },
  {
    id: 'q-3',
    text: 'A man is literally what he thinks, his character being the complete sum of all his thoughts.',
    author: 'James Allen',
    source: 'As a Man Thinketh',
    category: 'Mindset',
    likes: 295
  },
  {
    id: 'q-4',
    text: 'He who has a why to live can bear almost any how.',
    author: 'Friedrich Nietzsche',
    source: 'Twilight of the Idols',
    category: 'Purpose',
    likes: 350
  },
  {
    id: 'q-5',
    text: 'In the midst of chaos, there is also opportunity.',
    author: 'Sun Tzu',
    source: 'The Art of War',
    category: 'Strategy',
    likes: 310
  },
  {
    id: 'q-6',
    text: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
    source: 'Letters from a Stoic',
    category: 'Philosophy',
    likes: 440
  },
  {
    id: 'q-7',
    text: 'Don’t just read books. Use what you learn to build yourself.',
    author: 'MindRise',
    source: 'Core Philosophy',
    category: 'Growth',
    likes: 520
  }
];

export const SEED_CHALLENGES: ChallengeItem[] = [
  {
    id: 'ch-7-day-reading',
    title: '7-Day Reading Immersion',
    subtitle: 'Ignite your reading engine with daily 20-minute sessions',
    description: 'Commit to reading 20 minutes every day for 7 consecutive days. Take one meaningful highlight each day and record one actionable reflection.',
    durationDays: 7,
    category: 'Reading',
    xp: 350,
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    rewardBadge: 'Reader Ignite',
    participantsCount: 3410,
    published: true,
    tasks: [
      { day: 1, title: 'Day 1: Choose Your Anchor Book', description: 'Select a book from Explore or Library and read for 20 uninterrupted minutes.' },
      { day: 2, title: 'Day 2: First Meaningful Highlight', description: 'Highlight at least one passage that shifts your perspective.' },
      { day: 3, title: 'Day 3: Digital Distraction Zero', description: 'Read with your phone in a separate room.' },
      { day: 4, title: 'Day 4: The 1-Sentence Takeaway', description: 'Write down the single most vital idea from today’s reading in your journal.' },
      { day: 5, title: 'Day 5: Deep Comprehension Check', description: 'Explain what you read today out loud to yourself or a friend.' },
      { day: 6, title: 'Day 6: Speed vs. Depth', description: 'Slow down your pace by 20% to absorb sentence structure and philosophy.' },
      { day: 7, title: 'Day 7: Weekly Reading Audit', description: 'Review all highlights collected and write your weekly growth synthesis.' }
    ]
  },
  {
    id: 'ch-30-day-discipline',
    title: '30-Day Discipline Protocol',
    subtitle: 'Re-engineer your habits and eliminate dopamine friction',
    description: 'A month-long transformational trial built around three daily non-negotiables: morning reading, physical training, and evening journal audit.',
    durationDays: 30,
    category: 'Discipline',
    xp: 1500,
    coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    rewardBadge: 'Iron Will',
    participantsCount: 1890,
    published: true,
    tasks: [
      { day: 1, title: 'The Clean Slate', description: 'Establish baseline schedule: wake up at planned time without hitting snooze.' },
      { day: 2, title: 'Morning Screen Ban', description: 'First 60 minutes screen-free; replace scrolling with 20 minutes reading.' },
      { day: 3, title: 'Non-Negotiable Physicality', description: 'Complete 30 minutes of intentional exercise or movement.' },
      { day: 4, title: 'Evening Journaling Habit', description: 'Complete the MindRise Daily 5-question reflection.' },
      { day: 5, title: 'Dopamine Fast', description: 'Cut all sugary drinks and mindless short-form video content.' },
      { day: 6, title: 'Deep Work Session', description: 'Execute one 90-minute uninterrupted block of deep study or craft.' },
      { day: 7, title: 'Week 1 Resilience Milestone', description: 'Reflect on friction points and strengthen weak spots.' }
    ]
  },
  {
    id: 'ch-21-day-habit',
    title: '21-Day Habit Transformation',
    subtitle: 'Anchor new automatic routines using behavioral design',
    description: 'Lock in three keystone habits using environment redesign, cue bundling, and progressive streaks.',
    durationDays: 21,
    category: 'Habits',
    xp: 900,
    coverImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    rewardBadge: 'Habit Architect',
    participantsCount: 2240,
    published: true,
    tasks: [
      { day: 1, title: 'Define the Keystone Habit', description: 'Identify the one habit that makes all other habits easier.' },
      { day: 2, title: 'Set the Physical Cue', description: 'Place the required tools in plain sight where you cannot miss them.' },
      { day: 3, title: 'The 2-Minute Rule', description: 'Scale the habit down to a 2-minute starting version to remove resistance.' },
      { day: 4, title: 'Habit Stacking', description: 'Attach your new habit immediately after your morning coffee or shower.' },
      { day: 5, title: 'Track Your Streak', description: 'Mark the habit complete in the MindRise habit tracker.' }
    ]
  },
  {
    id: 'ch-12-books-year',
    title: '12 Books in a Year Quest',
    subtitle: 'The ultimate reading milestone for the lifelong scholar',
    description: 'Transform your intellectual compass by finishing one life-altering book each month across mindset, philosophy, wealth, and leadership.',
    durationDays: 365,
    category: 'Reading',
    xp: 5000,
    coverImage: 'https://images.unsplash.com/photo-1507842229451-79b1be886a20?auto=format&fit=crop&w=800&q=80',
    rewardBadge: 'Master Scholar',
    participantsCount: 4120,
    published: true,
    tasks: [
      { day: 30, title: 'Book 1 Completed', description: 'Finish your first month’s book and export your synthesized notes.' },
      { day: 60, title: 'Book 2 Completed', description: 'Complete a philosophy classic and record core principles.' },
      { day: 90, title: 'Book 3 Completed', description: 'Finish a strategy or leadership masterwork.' }
    ]
  }
];

export const DEFAULT_HABITS: HabitItem[] = [
  {
    id: 'habit-read',
    name: 'Daily Reading (स्वाध्याय)',
    icon: 'BookOpen',
    category: 'learning',
    frequency: 'daily',
    target: 1,
    reminderTime: '20:00',
    color: '#10b981',
    createdAt: '2026-01-01',
    currentStreak: 0,
    bestStreak: 0,
  },
  {
    id: 'habit-journal',
    name: 'Evening Reflection & Journal',
    icon: 'Edit3',
    category: 'mindset',
    frequency: 'daily',
    target: 1,
    reminderTime: '21:30',
    color: '#d4af37',
    createdAt: '2026-01-01',
    currentStreak: 0,
    bestStreak: 0,
  },
  {
    id: 'habit-deepwork',
    name: 'Deep Work Focus Sprint (60 min)',
    icon: 'Cpu',
    category: 'productivity',
    frequency: 'daily',
    target: 1,
    reminderTime: '10:00',
    color: '#8b5cf6',
    createdAt: '2026-01-01',
    currentStreak: 0,
    bestStreak: 0,
  }
];

export const SEED_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-book',
    title: 'First Page Turned',
    description: 'Begin your journey by reading the opening chapter of any MindRise book.',
    icon: 'Sparkles',
    unlocked: true,
    unlockedAt: '2026-08-20',
    rarity: 'common'
  },
  {
    id: 'streak-7',
    title: '7-Day Ember',
    description: 'Maintain a continuous 7-day reading streak.',
    icon: 'Flame',
    unlocked: true,
    unlockedAt: '2026-08-27',
    rarity: 'rare'
  },
  {
    id: 'streak-30',
    title: '30-Day Inferno',
    description: 'Reach a formidable 30-day streak of relentless consistency.',
    icon: 'Zap',
    unlocked: false,
    rarity: 'epic'
  },
  {
    id: 'pages-1000',
    title: 'Millennium Scholar',
    description: 'Turn more than 1,000 pages inside the MindRise digital library.',
    icon: 'BookOpen',
    unlocked: false,
    rarity: 'epic'
  },
  {
    id: 'books-10',
    title: 'Decade of Wisdom',
    description: 'Complete 10 full books from start to finish.',
    icon: 'Award',
    unlocked: false,
    rarity: 'epic'
  },
  {
    id: 'highlights-50',
    title: 'Gold Miner',
    description: 'Extract and save 50 powerful highlights in your knowledge vault.',
    icon: 'Bookmark',
    unlocked: true,
    unlockedAt: '2026-09-01',
    rarity: 'rare'
  },
  {
    id: 'notes-100',
    title: 'Philosopher Scribe',
    description: 'Record 100 personal reflection notes across your readings.',
    icon: 'PenTool',
    unlocked: false,
    rarity: 'epic'
  },
  {
    id: 'early-bird',
    title: 'Dawn Reader',
    description: 'Complete a reading session before 07:00 AM.',
    icon: 'Sun',
    unlocked: true,
    unlockedAt: '2026-08-22',
    rarity: 'common'
  },
  {
    id: 'night-reader',
    title: 'Midnight Contemplation',
    description: 'Read and reflect in deep dark mode past 11:00 PM.',
    icon: 'Moon',
    unlocked: true,
    unlockedAt: '2026-08-29',
    rarity: 'common'
  },
  {
    id: 'challenge-master',
    title: 'Challenge Conqueror',
    description: 'Complete any multi-day discipline or reading challenge.',
    icon: 'Trophy',
    unlocked: false,
    rarity: 'legendary'
  }
];
