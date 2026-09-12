import React, { useState, useMemo } from 'react';
import {
  Flame,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  Headphones,
  Compass,
  Share2,
  Bookmark,
  Quote,
  Layers,
  ChevronRight,
  Pencil,
  Check,
  X,
  Target,
  PenTool,
  Archive,
  Brain,
  Library,
  Zap,
  ShieldCheck,
  FolderLock,
  Search,
  Globe,
  Languages,
  Scroll,
  Feather,
  Heart,
  TrendingUp,
  Sun,
  Eye,
  Users,
  Shield,
  BookMarked,
  Leaf
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ReadingProgress } from '../../types';

// Dynamic Banner Assets: Dark Mode (Image 1: Starry Mountain Sky) vs Light Mode (Image 2: Cozy Sanctuary Library)
import darkBannerImg from '../../assets/images/night_mountain_sky_1789203894253.jpg';
import lightBannerImg from '../../assets/images/cozy_reading_nook_1789203851409.jpg';

interface HomeDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ setActiveTab }) => {
  const { user, updateUserProfile } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const activeBannerImg = isDarkMode ? darkBannerImg : lightBannerImg;

  const {
    books,
    dailyQuote,
    rotateQuote,
    openReader,
    openBookDetails,
    archiveProgress,
    setArchiveSearchQuery
  } = useData();

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

  // Literary Sanctuary Headings
  const sanctuaryGreeting = useMemo(() => {
    const headlines = [
      'Welcome to Your Reading Sanctuary',
      'Universal Wisdom & Knowledge Sanctuary',
      'Your Literary Sanctuary & Desk',
      'Mindful Intellect & Habit Mastery',
    ];
    const slot = Math.floor((Date.now() / (1000 * 60 * 60 * 4)) % headlines.length);
    return headlines[slot];
  }, []);

  const handleSaveName = async () => {
    if (editedName.trim()) {
      await updateUserProfile({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCopyQuote = () => {
    if (!dailyQuote) return;
    navigator.clipboard.writeText(`"${dailyQuote.text}" — ${dailyQuote.author}`);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const handleQuickJump = (query: string) => {
    if (setArchiveSearchQuery) {
      setArchiveSearchQuery(query);
    }
    setActiveTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compact Available Categories for Inline Text Discovery (No bulky boxes)
  const categoryHighlights = [
    { name: 'Hindi Sahitya & Upanyas', hindi: 'हिन्दी उपन्यास', authors: 'Premchand, Godaan, Dinkar', query: 'Premchand' },
    { name: 'Philosophy & Vedanta', hindi: 'दर्शन व गीता', authors: 'Bhagavad Gita, Stoics, Upanishads', query: 'Philosophy' },
    { name: 'Ancient History & Statecraft', hindi: 'इतिहास व नीति', authors: 'Chanakya Niti, Arthashastra', query: 'History of India' },
    { name: 'Psychology & Mindset', hindi: 'मनोविज्ञान', authors: 'Carl Jung, James Allen', query: 'Psychology' },
    { name: 'Discipline & Habits', hindi: 'अनुशासन व आदतें', authors: 'Benjamin Franklin, Marden', query: 'Self Help' },
    { name: 'Wealth & Economics', hindi: 'अर्थशास्त्र', authors: 'Adam Smith, Babylon', query: 'Economics' },
    { name: 'Health & Yoga', hindi: 'योग व स्वास्थ्य', authors: 'Patanjali Sutras, Pranayama', query: 'Health and Yoga' },
    { name: 'World Literature Classics', hindi: 'विश्व साहित्य', authors: 'Tolstoy, Dostoevsky, Hugo', query: 'English literature classics' },
    { name: 'Poetry, Shayari & Sufism', hindi: 'काव्य व शायरी', authors: 'Kabir, Ghalib, Tagore, Rumi', query: 'Poetry' },
    { name: 'Sanskrit & Regional Classics', hindi: 'संस्कृत साहित्य', authors: 'Kalidasa, Panchatantra', query: 'Sanskrit' },
  ];

  // MindRise Core Sanctuary Pillars with High-Definition Aesthetic Images & Archetypes
  const sanctuaryPillars = [
    {
      id: 'habits',
      tab: 'habits',
      title: 'Habit Tracker & Streak Discipline',
      subtitle: 'आदतें और अनुशासन (Atomic Daily Habits)',
      badge: 'DISCIPLINE',
      icon: Target,
      iconBg: 'bg-amber-500',
      badgeColor: 'text-amber-700 dark:text-amber-300',
      badgeBorder: 'border-amber-200/80 dark:border-amber-800/80',
      cardGradient: 'from-amber-50/90 via-orange-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#17120e] border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400',
      arrowBg: 'bg-amber-100 hover:bg-amber-500 text-amber-900 hover:text-black dark:bg-amber-950/80 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
      description:
        'Build powerful reading habits, track daily discipline routines, and unlock long-term compounding growth with atomic streak cues.',
      actionText: 'Open Habit Tracker',
      highlights: ['2-Minute Starter Rule', 'Visual Daily Heatmap', 'Streak Milestones', 'Custom Habit Cues'],
    },
    {
      id: 'journal',
      tab: 'journal',
      title: 'Daily Journal & Deep Reflection',
      subtitle: 'दैनिक जर्नल और आत्मविवेक (Swadhyay Journaling)',
      badge: 'REFLECTION',
      icon: Leaf,
      iconBg: 'bg-emerald-600',
      badgeColor: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-200/80 dark:border-emerald-800/80',
      cardGradient: 'from-emerald-50/90 via-teal-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#0a1510] border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-400',
      arrowBg: 'bg-emerald-100 hover:bg-emerald-500 text-emerald-900 hover:text-black dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1000&q=80',
      description:
        'Write, reflect, and understand yourself better with guided journaling, evening clarity reflections, and mindful check-ins.',
      actionText: 'Write Daily Journal',
      highlights: ['Markdown Clarity Editor', 'Emotional Check-ins', 'Active Recall Prompts', 'Encrypted Local Storage'],
    },
    {
      id: 'notes',
      tab: 'notes',
      title: 'Notes & Knowledge Vault',
      subtitle: 'ज्ञान तिजोरी और उद्धरण (Second Brain & Synthesis)',
      badge: 'WISDOM VAULT',
      icon: FolderLock,
      iconBg: 'bg-cyan-600',
      badgeColor: 'text-cyan-700 dark:text-cyan-300',
      badgeBorder: 'border-cyan-200/80 dark:border-cyan-800/80',
      cardGradient: 'from-cyan-50/90 via-sky-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#09141a] border-cyan-200/80 dark:border-cyan-900/50 hover:border-cyan-400',
      arrowBg: 'bg-cyan-100 hover:bg-cyan-500 text-cyan-900 hover:text-black dark:bg-cyan-950/80 dark:text-cyan-300 dark:hover:bg-cyan-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1000&q=80',
      description:
        'Capture unforgettable book quotes, synthesize atomic concepts into permanent notes, and organize your intellectual second brain.',
      actionText: 'Explore Knowledge Vault',
      highlights: ['Quote Excerpt Vault', 'Color-Coded Taxonomy', 'Instant Text Search', 'Book Cross-Linking'],
    },
    {
      id: 'coach',
      tab: 'coach',
      title: 'MindRise AI Coach & Mentor',
      subtitle: 'बुद्धिमान AI गुरु (Groq Llama 3.3 70B Powered)',
      badge: 'AI SCHOLAR',
      icon: Brain,
      iconBg: 'bg-purple-600',
      badgeColor: 'text-purple-700 dark:text-purple-300',
      badgeBorder: 'border-purple-200/80 dark:border-purple-800/80',
      cardGradient: 'from-purple-50/90 via-violet-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#150d1a] border-purple-200/80 dark:border-purple-900/50 hover:border-purple-400',
      arrowBg: 'bg-purple-100 hover:bg-purple-500 text-purple-900 hover:text-black dark:bg-purple-950/80 dark:text-purple-300 dark:hover:bg-purple-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      description:
        'High-speed intellectual mentoring powered by Llama 3.3 70B. Instant chapter synthesis, tailored reading plans, and Socratic inquiry.',
      actionText: 'Consult AI Coach',
      highlights: ['Groq Llama 3.3 70B Engine', '30-Day Mastery Plans', 'Chapter Syntheses', 'Bilingual Mentoring'],
    },
    {
      id: 'explore',
      tab: 'explore',
      title: 'Universal Open Library (8.5M+ Books)',
      subtitle: 'डिजिटल पुस्तकालय (Internet Archive Real Books)',
      badge: 'OPEN ARCHIVE',
      icon: Archive,
      iconBg: 'bg-rose-600',
      badgeColor: 'text-rose-700 dark:text-rose-300',
      badgeBorder: 'border-rose-200/80 dark:border-rose-800/80',
      cardGradient: 'from-rose-50/90 via-amber-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#1a0f12] border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400',
      arrowBg: 'bg-rose-100 hover:bg-rose-500 text-rose-900 hover:text-black dark:bg-rose-950/80 dark:text-rose-300 dark:hover:bg-rose-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80',
      description:
        'Read complete original scanned public domain books cover-to-cover with zero 100-page limits, dual-page mode, and in-app TTS.',
      actionText: 'Browse 8.5M+ Books',
      highlights: ['8.5M+ Scanned Originals', 'No 100-Page Limits', 'Dual-Page Book Reader', 'Hindi & World Classics'],
    },
    {
      id: 'library',
      tab: 'library',
      title: 'Personal Library & Reading Shelves',
      subtitle: 'मेरी लाइब्रेरी और शेल्फ (Reading Progress & Shelves)',
      badge: 'PROGRESS',
      icon: Library,
      iconBg: 'bg-sky-600',
      badgeColor: 'text-sky-700 dark:text-sky-300',
      badgeBorder: 'border-sky-200/80 dark:border-sky-800/80',
      cardGradient: 'from-sky-50/90 via-indigo-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#0d131a] border-sky-200/80 dark:border-sky-900/50 hover:border-sky-400',
      arrowBg: 'bg-sky-100 hover:bg-sky-500 text-sky-900 hover:text-black dark:bg-sky-950/80 dark:text-sky-300 dark:hover:bg-sky-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80',
      description:
        'Curate your personal collection across custom shelves: "Currently Reading", "Want to Read", and "Favorites" with persistent progress.',
      actionText: 'Open My Library',
      highlights: ['4 Custom Shelves', 'Page Bookmark Memory', 'Reading Time Counter', 'Cloud Sync Persistence'],
    },
    {
      id: 'categories',
      tab: 'categories',
      title: 'Literary Subjects & Archives',
      subtitle: 'विषयवार वर्गीकरण (Curated Genres)',
      badge: 'TAXONOMY',
      icon: BookMarked,
      iconBg: 'bg-emerald-700',
      badgeColor: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-200/80 dark:border-emerald-800/80',
      cardGradient: 'from-emerald-50/90 via-teal-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#0a1510] border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-400',
      arrowBg: 'bg-emerald-100 hover:bg-emerald-500 text-emerald-900 hover:text-black dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80',
      description:
        'Explore categorized collections across Hindi Literature, Vedanta, Stoicism, Psychology, Epics, and World Classics.',
      actionText: 'Explore Categories',
      highlights: ['16 Curated Genres', 'Hindi Literature Stacks', 'Sanskrit Classics', 'Direct Topic Jump'],
    },
    {
      id: 'community',
      tab: 'community',
      title: 'Scholar Circles & Discussions',
      subtitle: 'विद्वान संगति (Community & Book Clubs)',
      badge: 'COMMUNITY',
      icon: Users,
      iconBg: 'bg-indigo-600',
      badgeColor: 'text-indigo-700 dark:text-indigo-300',
      badgeBorder: 'border-indigo-200/80 dark:border-indigo-800/80',
      cardGradient: 'from-indigo-50/90 via-blue-50/40 to-white dark:from-stone-900 dark:via-stone-900 dark:to-[#0b101d] border-indigo-200/80 dark:border-indigo-900/50 hover:border-indigo-400',
      arrowBg: 'bg-indigo-100 hover:bg-indigo-500 text-indigo-900 hover:text-black dark:bg-indigo-950/80 dark:text-indigo-300 dark:hover:bg-indigo-500 dark:hover:text-black',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
      description:
        'Connect with fellow scholars, exchange philosophical insights, join live reading circles, and share book reflections.',
      actionText: 'Join Community',
      highlights: ['Live Book Circles', 'Shared Highlights', 'Socratic Debates', 'Global Fellowship'],
    },
  ];

  return (
    <div className="space-y-10 pb-20 font-sans">
      {/* 1. TOP SANCTUARY BANNER - DYNAMIC THEME (DARK: STARRY MOUNTAIN SKY [IMAGE 1] | LIGHT: COZY LIBRARY NOOK [IMAGE 2]) */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-800/80 shadow-2xl text-white">
        {/* Scenic Background Image - switches dynamically between Dark Mode and Light Mode */}
        <div className="absolute inset-0 z-0">
          <img
            src={activeBannerImg}
            alt={isDarkMode ? 'Night Sky Mountain Sanctuary' : 'Cozy Reading Nook Sanctuary'}
            className="h-full w-full object-cover object-center scale-105 transition-all duration-700 ease-in-out"
            referrerPolicy="no-referrer"
          />
          {/* High-Contrast Gradient Dark Overlay for Ultra-Crisp Legibility */}
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? 'bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/40 backdrop-blur-[0.5px]'
                : 'bg-gradient-to-r from-stone-950/90 via-stone-950/70 to-stone-950/30 backdrop-blur-[0.5px]'
            }`}
          />
        </div>

        {/* Content Container - Generous horizontal length and majestic spacing */}
        <div className="relative z-10 p-7 sm:p-9 lg:p-12 space-y-6">
          {/* Top Badges & Streak Row (Matches Image 1 reference styling) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-950/85 border border-amber-500/50 px-3.5 py-1 text-[11px] font-mono font-bold tracking-wider uppercase text-amber-300 backdrop-blur-md shadow-xs">
                LITERARY SANCTUARY • 8.5M+ REAL BOOKS
              </span>
              <span className="rounded-full bg-stone-950/85 text-emerald-400 border border-emerald-500/50 px-3.5 py-1 text-[11px] font-mono font-bold backdrop-blur-md shadow-xs">
                100% FREE PUBLIC DOMAIN (निःशुल्क पुस्तकालय)
              </span>
              <span className="rounded-full bg-stone-950/85 text-sky-300 border border-sky-500/50 px-3.5 py-1 text-[11px] font-mono font-semibold hidden md:inline-block backdrop-blur-md shadow-xs">
                NO 100-PAGE LIMITS • COVER-TO-COVER
              </span>
            </div>

            <span className="flex items-center gap-1.5 rounded-full bg-stone-950/85 border border-amber-500/50 px-3.5 py-1 text-xs text-amber-300 font-mono font-bold backdrop-blur-md shadow-xs">
              <Flame className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{user?.currentStreak || 0} Day Streak</span>
            </span>
          </div>

          {/* Greeting: Dark, Prominent & Big Typography (as in developed web) */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex-1 space-y-3.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  Universal Wisdom &{' '}
                  <span className="italic font-serif font-normal text-emerald-400">
                    Knowledge
                  </span>{' '}
                  Sanctuary, {user?.name?.split(' ')[0] || 'Scholar'}.
                </h1>
                {!isEditingName ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedName(user?.name || '');
                      setIsEditingName(true);
                    }}
                    className="rounded-full p-1.5 text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Edit display name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-xl border border-stone-600 shadow-lg backdrop-blur-md">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter name"
                      className="bg-transparent text-xs font-semibold px-2 py-0.5 outline-none w-28 sm:w-36 text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="rounded-lg bg-amber-500 text-black p-1 transition cursor-pointer"
                      title="Save name"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="rounded-lg p-1 text-stone-300 hover:bg-stone-700 transition cursor-pointer"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm md:text-base text-stone-200 font-medium leading-relaxed drop-shadow-xs max-w-2xl">
                Your universal sanctuary of <strong>8.5 Million+ authentic open books</strong>, daily habit routines, reflective journaling, and AI-powered intellectual mastery.
              </p>

              {/* Tag Pills: READ, REFLECT, LEARN, GROW, EVOLVE (Like Image 1) */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['READ', 'REFLECT', 'LEARN', 'GROW', 'EVOLVE'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/20 bg-stone-900/60 px-3.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-stone-200 backdrop-blur-sm shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('explore')}
                className="flex items-center gap-2 rounded-xl bg-stone-950/90 hover:bg-black text-white px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold border border-white/20 shadow-lg hover:scale-105 transition cursor-pointer"
              >
                <Compass className="h-4 w-4 text-amber-400" />
                <span>Explore Books</span>
              </button>
              <button
                onClick={() => setActiveTab('coach')}
                className="flex items-center gap-2 rounded-xl bg-white hover:bg-stone-100 text-stone-950 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-black shadow-xl hover:scale-105 transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Ask AI Coach</span>
              </button>
            </div>
          </div>

          {/* Categories Strip: Clean Text with Dot Separators (Image 1 Bottom Section) */}
          <div className="pt-3.5 border-t border-white/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                <BookMarked className="h-3.5 w-3.5 text-amber-300" />
                <span>AVAILABLE FREE CATEGORIES & LITERARY SUBJECTS (उपलब्ध श्रेणियां):</span>
              </span>
              <button
                onClick={() => setActiveTab('categories')}
                className="text-xs font-semibold text-amber-300 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>All Categories</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-stone-200 leading-relaxed font-sans">
              {categoryHighlights.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickJump(cat.query)}
                  className="group inline-flex items-center gap-1 hover:text-amber-300 transition cursor-pointer text-left"
                  title={`Browse free books in ${cat.name}`}
                >
                  <span className="font-semibold text-white group-hover:underline">{cat.name}</span>
                  <span className="text-[11px] text-stone-300 font-mono">({cat.authors})</span>
                  {idx < categoryHighlights.length - 1 && <span className="text-white/30 ml-2 select-none">•</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MINDRISE CORE SANCTUARY PILLARS & FEATURE ARCHITECTURE */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 dark:border-stone-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sanctuary Architecture</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-stone-950 dark:text-white tracking-tight">
              App Pillars & Intelligence Hub (एप्लिकेशन स्तम्भ)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl font-medium">
              Everything you need for disciplined reading, deep personal reflection, knowledge synthesis, and intellectual growth.
            </p>
          </div>
        </div>

        {/* MindRise Core Pillars - 4-Column Grid (4 Cards Per Row) with Immersive Background Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sanctuaryPillars.map((pillar) => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={pillar.id}
                onClick={() => setActiveTab(pillar.tab)}
                className="group relative flex flex-col justify-between rounded-2xl border border-stone-800/80 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer overflow-hidden min-h-[260px] p-5 text-white"
              >
                {/* Background Image with Cinematic Dark Gradient Scrim (Like Banner in Image 2) */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={pillar.image}
                    alt={pillar.title}
                    className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  {/* High-Contrast Gradient Dark Overlay for Crisp Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/85 to-stone-950/50 backdrop-blur-[0.5px]" />
                </div>

                {/* Content Container positioned above background (z-10) */}
                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  {/* Top Row: Floating Circular Solid Icon & Sleek Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg border border-white/20 backdrop-blur-md transition-transform duration-300 group-hover:scale-110 ${pillar.iconBg}`}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>

                    <span className="rounded-full bg-stone-950/85 border border-amber-500/50 backdrop-blur-md px-3 py-1 text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300 shadow-xs">
                      {pillar.badge}
                    </span>
                  </div>

                  {/* Middle: Title, Subtitle and Description */}
                  <div className="space-y-1.5 my-auto">
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {pillar.title}
                    </h3>
                    <div className="text-xs font-semibold text-amber-300/90 font-sans">
                      {pillar.subtitle}
                    </div>
                    <p className="text-xs leading-relaxed text-stone-200 line-clamp-2 pt-0.5">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Bottom Action Row with Circular Arrow */}
                  <div className="pt-3 border-t border-white/15 flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-200 group-hover:text-white group-hover:underline">
                      {pillar.actionText}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 shadow-sm group-hover:scale-110 ${pillar.arrowBg}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.5 FEATURED LITERARY TREASURES & CLASSIC WORKS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-stone-700 dark:text-stone-300 font-bold">
              Featured Literary Treasures • प्रसिद्ध कालजयी ग्रंथ
            </h2>
          </div>
          <button
            onClick={() => {
              if (setArchiveSearchQuery) setArchiveSearchQuery('Premchand');
              setActiveTab('explore');
            }}
            className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All in Archive</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(books || []).slice(0, 6).map((book) => (
            <div
              key={book.id}
              onClick={() => openBookDetails(book.id)}
              className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          const placeholder = parent.querySelector('.home-cover-fallback') as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`home-cover-fallback absolute inset-0 ${
                      book.coverUrl ? 'hidden' : 'flex'
                    } flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-amber-100`}
                  >
                    <BookOpen className="h-6 w-6 text-amber-400 opacity-75 mb-2" />
                    <div className="font-serif text-[11px] font-bold line-clamp-3 leading-snug">
                      {book.title}
                    </div>
                    <div className="mt-1 text-[9px] text-amber-200/80 line-clamp-1">{book.author}</div>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1">
                  <h3
                    className="font-serif text-xs font-bold leading-tight line-clamp-2 text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                    title={book.title}
                  >
                    {book.title}
                  </h3>
                  <p className="text-[11px] line-clamp-1 font-medium text-stone-600 dark:text-stone-400">
                    {book.author}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  {book.category || 'Classics'}
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-400 group-hover:underline flex items-center gap-0.5">
                  Read <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. DAILY SWADHYAY THOUGHT & LITERARY QUOTE */}
      {dailyQuote && (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-6 sm:p-8 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-amber-900 dark:text-amber-300 font-semibold">
                Daily Swadhyay Thought
              </span>
            </div>
            <button
              onClick={rotateQuote}
              className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white underline cursor-pointer"
            >
              Next Quote
            </button>
          </div>

          <blockquote className="mt-4 font-serif text-lg sm:text-xl text-stone-900 dark:text-stone-100 italic leading-relaxed">
            "{dailyQuote.text}"
          </blockquote>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              — {dailyQuote.author} <span className="font-normal opacity-60">({dailyQuote.source})</span>
            </p>
            <button
              onClick={handleCopyQuote}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copiedQuote ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. EXTENDED LITERARY ESSAYS, REAL DATA LEDGER & SWADHYAY PHILOSOPHY (NO BOXES, PURE CRAFT TYPOGRAPHY) */}
      <div className="space-y-12 pt-6 border-t border-stone-200 dark:border-stone-800/80">
        {/* Section 5A: The Great Swadhyay Philosophy (स्वाध्याय एवं प्रज्ञा दर्शन) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
            <Scroll className="h-4 w-4" />
            <span>Philosophical Foundation • स्वाध्याय दर्शन</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-stone-950 dark:text-white tracking-tight leading-tight">
            The Eternal Art of Swadhyay: Reading as Character Architecture
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 text-stone-700 dark:text-stone-300 leading-relaxed text-sm sm:text-base font-sans">
            <div className="space-y-4">
              <p>
                In the Vedic and Upanishadic traditions, <strong>स्वाध्याय (Swadhyay)</strong> is not merely an intellectual leisure or academic duty; it is a sacred self-inquiry—a contemplative mirror wherein the seeker clarifies consciousness through communion with timeless wisdom. When we read classical masters—be it the ethical dialogues of the <em>Bhagavad Gita</em>, the meditative maxims of <em>Marcus Aurelius</em>, or the social conscience of <em>Munshi Premchand</em>—we step outside the noisy turbulence of contemporary distractions and dwell in centuries of perfected thought.
              </p>
              <p>
                Modern digital life bombards the human mind with fractured 15-second impulses, shallow notifications, and volatile emotional triggers. MindRise Sanctuary exists as an intentional counterbalance: an unhurried, serene digital reading sanctuary where you can sit with complete original scanned books, think without algorithmic interruptions, and train the muscle of sustained attention.
              </p>
            </div>
            <div className="space-y-4">
              <p>
                True reading transforms the reader. To read deeply is to engage in an active dialogue with the finest minds humanity has ever produced. As Seneca observed nearly two thousand years ago, <em>"To be everywhere is to be nowhere; people who spend their whole life traveling end up having plenty of places where they can find hospitality, but no real friendships."</em> The same applies to knowledge: skimming a hundred headlines leaves the intellect empty, but meditating on ten pages of profound truth reconstructs the soul.
              </p>
              <p>
                By connecting real, unrestricted public-domain literary archives with reflective journaling, habit tracking, and high-speed AI inquiry, MindRise provides an integrated sanctuary for lifelong scholars, thinkers, and seekers across the globe.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5B: Real Archive Data & Universal Library Ledger (Clean Typography, No Heavy Boxes) */}
        <div className="space-y-6 pt-6 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
            <Globe className="h-4 w-4" />
            <span>Open Library Data & Global Heritage Ledger</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-black text-stone-950 dark:text-white tracking-tight">
            Global Public Commons & Open Cultural Heritage
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
            MindRise connects directly to the Internet Archive's global digitization initiative, granting complete, unhindered access to millions of historical, philosophical, and literary masterworks.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pt-4">
            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                8.5M+
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Scanned Volumes
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Authentic archival facsimiles with original typography and historic illustrations.
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                120+
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                World Languages
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Comprehensive Indic manuscripts in Sanskrit, Hindi, Urdu, Bengali, Tamil alongside world classics.
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
                400+ Yrs
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Preserved History
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Chronological breadth spanning medieval treatises, Renaissance manuscripts, and early 20th-century gems.
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-serif text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                Zero
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                Artificial Limits
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                100% cover-to-cover reading with zero 100-page limit locks or hidden subscription walls.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5C: The 5 Sacred Disciplines of the MindRise Reader (गहन पठन के 5 नियम) */}
        <div className="space-y-6 pt-6 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
            <Feather className="h-4 w-4" />
            <span>The 5 Disciplines • गहन अध्ययन के पंच सूत्र</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-black text-stone-950 dark:text-white tracking-tight">
            How Master Readers Read: The Five MindRise Protocols
          </h3>

          <div className="space-y-6 divide-y divide-stone-200/70 dark:divide-stone-800/70">
            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
              <span className="font-serif text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0 w-8">
                I.
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  The 25-Minute Morning Sanctum (स्थिर चित्त पठन काल)
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Never begin your day by reacting to the world's chaos. Dedicate the first 25 minutes of your morning to reading classical philosophy or profound literature before touching electronic messages or newsfeeds. This anchors your mental state in timeless equilibrium.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
              <span className="font-serif text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0 w-8">
                II.
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Dialogue in the Margins (हाशिये पर वैचारिक मंथन — Marginalia)
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Passive reading lulls the brain into a false sense of comprehension. Read with an active pencil or your MindRise Knowledge Vault open. Question the author’s premises, underline foundational arguments, and note where your lived experience corroborates or refutes the text.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
              <span className="font-serif text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0 w-8">
                III.
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Synthesis Over Accumulation (ज्ञान का आत्मसात करना)
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  A library of unassimilated books is merely decorative vanity. After completing a chapter or volume, write a three-sentence synthesis in your personal notes: <em>What did the author say? Is it true? What does this require of me?</em> If you cannot summarize an idea in your own words, you do not yet own it.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
              <span className="font-serif text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0 w-8">
                IV.
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Evening Reflection & Swadhyay Journaling (संध्याकालीन आत्मचिंतन)
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Close each day by entering a mindful reflection in your Swadhyay Journal. In the words of Pythagoras and Epictetus: <em>"Never allow sleep to close your eyes before each action of the day has been three times reviewed: Where have I transgressed? What have I accomplished? What duty have I neglected?"</em>
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
              <span className="font-serif text-2xl font-black text-amber-600 dark:text-amber-400 shrink-0 w-8">
                V.
              </span>
              <div className="space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  The Moral Test: Translating Wisdom into Conduct (आचरण में रूपांतरण)
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  As Chanakya declared in the <em>Arthashastra</em>, knowledge without practical virtue is like a tree without fruit. Let your reading manifest in greater composure under stress, deeper compassion toward others, and resolute discipline in your daily responsibilities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5D: Timeless Perspectives from the Masters (कालजयी विद्वानों की अमर वाणी) */}
        <div className="space-y-6 pt-6 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
            <Quote className="h-4 w-4" />
            <span>Voices Across Millennia • कालजयी विद्वानों की वाणी</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-black text-stone-950 dark:text-white tracking-tight">
            Reflections on Books, Truth, and the Awakened Life
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <div className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                मुंशी प्रेमचंद (Munshi Premchand)
              </div>
              <p className="text-xs font-mono text-amber-700 dark:text-amber-400">
                साहित्य का उद्देश्य (The Purpose of Literature)
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed italic">
                "साहित्य जीवन की आलोचना है, चाहे वह निबंध के रूप में हो, चाहे कहानी के रूप में या काव्य के रूप में। साहित्यकार का काम केवल मनोरंजन करना नहीं, बल्कि आत्मा को जगाना और समाज के विवेक को झकझोरना है।"
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                Rabindranath Tagore (रवींद्रनाथ ठाकुर)
              </div>
              <p className="text-xs font-mono text-amber-700 dark:text-amber-400">
                साधना व ज्ञान (Sadhana & Spiritual Communion)
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed italic">
                "Books are lighthouses built across the vast expanse of time. Through them, a human soul speaks across centuries to another soul, dissolving all barriers of geography, age, and mortality into pure light."
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                Swami Vivekananda (स्वामी विवेकानंद)
              </div>
              <p className="text-xs font-mono text-amber-700 dark:text-amber-400">
                आत्मबल व एकाग्रता (Inner Power & Focus)
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed italic">
                "Education is the manifestation of the perfection already existing in man. The difference between an ordinary mind and a great mind is purely the difference in the degree of concentration."
              </p>
            </div>
          </div>
        </div>

        {/* Section 5E: Reader's Benediction & Sanctuary Pledge (पठन साधना संकल्प) */}
        <div className="pt-8 pb-4 border-t border-stone-200/80 dark:border-stone-800/80 text-center space-y-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
            <Sparkles className="h-4 w-4" />
            <span>The Daily Reader's Covenant • पठन साधना संकल्प</span>
          </div>
          <p className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 italic leading-snug">
            "I shall read not to contradict and confute, nor to believe and take for granted, but to weigh, to reflect, and to awaken."
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
            MindRise Open Literary Sanctuary • Dedicated to the Universal Commons of Human Wisdom
          </p>
        </div>
      </div>
    </div>
  );
};

