import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ArrowRight,
  Headphones,
  Brain,
  Sparkles,
  Search,
  BookMarked,
  Globe,
  Users,
  Infinity as InfinityIcon,
  Palette,
  Sun,
  Moon,
  Scroll,
  Play,
  Pause,
  Volume2,
  CheckCircle2,
  Bookmark,
  Share2,
  HelpCircle,
  ChevronDown,
  Layers,
  Sparkle,
  Compass,
  FileText,
  Clock,
  Flame,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Footer } from '../layout/Footer';
import { useTheme, AppTheme } from '../../context/ThemeContext';

interface LandingPageProps {
  onStartJourney: () => void;
  onExplore: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartJourney,
  onExplore,
  onLogin,
}) => {
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Interactive Live Search Bar on Landing Page
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpineHover, setActiveSpineHover] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Interactive Reader Demo State
  const [readerTheme, setReaderTheme] = useState<'paper' | 'sepia' | 'dark'>('paper');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const themeOptions: { id: AppTheme; label: string; icon: any; color: string }[] = [
    { id: 'paper', label: 'Paper Classic', icon: Scroll, color: '#FAF8F5' },
    { id: 'white', label: 'Pure White', icon: Sun, color: '#FFFFFF' },
    { id: 'sepia', label: 'Sepia Archive', icon: Palette, color: '#F4ECD8' },
    { id: 'dark', label: 'Night Obsidian', icon: Moon, color: '#0F172A' },
  ];

  // Book spines matching the realistic ChatGPT image stack
  const bookSpines = [
    {
      id: 'literature',
      title: 'Literature',
      sub: 'World Fiction, Novels, Epics',
      color: 'from-[#2A4B3A] to-[#1E362A]',
      textColor: 'text-amber-100',
      tag: '1.8M+ Works',
      sample: 'Leo Tolstoy, Munshi Premchand, Jane Austen, Shakespeare, Dostoevsky'
    },
    {
      id: 'philosophy',
      title: 'Philosophy',
      sub: 'Stoicism, Eastern Thought, Ethics',
      color: 'from-[#8B4513] to-[#693108]',
      textColor: 'text-amber-100',
      tag: '950K+ Treatises',
      sample: 'Marcus Aurelius, Swami Vivekananda, Chanakya, Seneca, Lao Tzu'
    },
    {
      id: 'history',
      title: 'History',
      sub: 'Civilizations, Empires, Biographies',
      color: 'from-[#A67C38] to-[#805E26]',
      textColor: 'text-amber-50',
      tag: '1.4M+ Archives',
      sample: 'Ancient India, World Wars, Renaissance, Dr. APJ Abdul Kalam, Churchill'
    },
    {
      id: 'science',
      title: 'Science',
      sub: 'Physics, NCERT Chemistry, Astronomy',
      color: 'from-[#1B3A4B] to-[#11242F]',
      textColor: 'text-cyan-100',
      tag: '1.2M+ Texts',
      sample: 'Albert Einstein, Richard Feynman, NCERT Chemistry & Physics, Carl Sagan'
    },
    {
      id: 'self-improvement',
      title: 'Self Improvement',
      sub: 'Habits, Mindset, Focus, Wealth',
      color: 'from-[#D8C7A5] to-[#C2B08C]',
      textColor: 'text-[#2D2418]',
      tag: '620K+ Guides',
      sample: 'James Clear, Napoleon Hill, Morgan Housel, Dr. Joseph Murphy'
    },
    {
      id: 'art-culture',
      title: 'Art & Culture',
      sub: 'Fine Arts, Architecture, Heritage',
      color: 'from-[#5A202A] to-[#3E141C]',
      textColor: 'text-rose-100',
      tag: '880K+ Books',
      sample: 'Classical Indian Arts, Renaissance Masters, World Heritage, Architecture'
    },
    {
      id: 'better-you',
      title: 'and a Better You',
      sub: 'Lifelong Wisdom & Inner Growth',
      color: 'from-[#B89748] to-[#947833]',
      textColor: 'text-amber-950',
      tag: 'Timeless',
      sample: 'Mindfulness, Meditation, Purpose, The Bhagavad Gita, Daily Reflections'
    }
  ];

  const quickSearchPills = [
    'NCERT Chemistry',
    'Marcus Aurelius',
    'Bhagavad Gita',
    'Pride and Prejudice',
    'Munshi Premchand',
    'Atomic Habits',
    'Albert Einstein',
    'Dostoevsky'
  ];

  const pillars = [
    {
      icon: Globe,
      badge: '8.5M+ Books',
      title: 'Universal World Archive',
      desc: 'Over 85 Lakh (8.5 Million+) books, manuscripts, and textbooks across English, Hindi, Sanskrit, Spanish, French, German, and 50+ world languages.'
    },
    {
      icon: BookOpen,
      badge: 'Kindle Quality',
      title: 'Distraction-Free Reader',
      desc: 'Engineered for uninterrupted focus with custom serif typefaces, adjustable margins, warm sepia/paper modes, and bookmarking.'
    },
    {
      icon: Headphones,
      badge: 'Audio Chapters',
      title: 'Natural Audio Narration',
      desc: 'Listen to books hands-free with high-definition voice narration, speed control from 0.8x to 2.0x, and synchronized text highlighting.'
    },
    {
      icon: Brain,
      badge: 'Groq • Llama 3.3 70B',
      title: 'MindRise AI Mentor',
      desc: 'Ask deep literary questions, query 8.5M+ books, receive instant philosophical breakdowns, and generate custom habit protocols powered by Groq Llama 3.3 70B.'
    },
    {
      icon: Flame,
      badge: 'Habit Mastery',
      title: 'Reading Habits & Growth Vault',
      desc: 'Track your daily reading minutes, maintain reading streaks, preserve your personal reflections, and build an intellectual habit for life.'
    },
    {
      icon: Users,
      badge: 'Always Free',
      title: 'Open Knowledge Sanctuary',
      desc: 'No subscription paywalls, no invasive trackers, and no distracting advertisements. Universal wisdom preserved and open to every curious mind.'
    }
  ];

  const curatedHighlights = [
    {
      title: 'NCERT Chemistry (Class XI & XII)',
      author: 'National Council of Educational Research',
      lang: 'English / Hindi',
      pages: 420,
      genre: 'Science & Education',
      quote: 'Fundamentals of chemical structure, equilibrium, and organic transformations.'
    },
    {
      title: 'Meditations (The Emperor\'s Handbook)',
      author: 'Marcus Aurelius',
      lang: 'Greek / English / Hindi',
      pages: 198,
      genre: 'Stoic Philosophy',
      quote: 'You have power over your mind — not outside events. Realize this, and you will find strength.'
    },
    {
      title: 'Godan (The Gift of a Cow)',
      author: 'Munshi Premchand',
      lang: 'Hindi / English',
      pages: 342,
      genre: 'World Literature',
      quote: 'The immortal epic of Indian rural life, dignity, and human compassion.'
    },
    {
      title: 'The Bhagavad Gita: Song Divine',
      author: 'Vyasa / Translated',
      lang: 'Sanskrit / Hindi / English',
      pages: 280,
      genre: 'Spiritual Philosophy',
      quote: 'Perform your prescribed duty, for action is better than inaction.'
    },
    {
      title: 'Relativity: The Special & General Theory',
      author: 'Albert Einstein',
      lang: 'English / German',
      pages: 184,
      genre: 'Theoretical Physics',
      quote: 'The universe unfolded through geometry, space-time, and gravitational waves.'
    },
    {
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      lang: 'English / Hindi',
      pages: 252,
      genre: 'Wealth & Human Behavior',
      quote: 'Doing well with money has a little to do with how smart you are and a lot to do with how you behave.'
    }
  ];

  const faqs = [
    {
      q: 'Is this library only for Hindi books?',
      a: 'No! MindRise is a universal global library with over 85 Lakh (8.5 Million+) books across all world languages including English, Hindi, Sanskrit, Spanish, French, German, Urdu, Bengali, and many more. It includes classical literature, science, philosophy, history, and textbooks.'
    },
    {
      q: 'Is there any fee or subscription required?',
      a: 'MindRise is 100% free and open. You can browse, search, and read millions of public domain and open-access masterworks without paywalls or subscriptions.'
    },
    {
      q: 'Can I listen to books as audiobooks?',
      a: 'Yes! Every book includes synchronized audio narration so you can listen hands-free while walking, commuting, or relaxing.'
    },
    {
      q: 'How does the MindRise AI Mentor work?',
      a: 'The built-in AI Mentor connects directly to high-speed Groq AI (Llama 3.3 70B) to explain complex philosophical ideas, summarize book chapters, answer literary questions, and construct personalized study & habit blueprints.'
    },
    {
      q: 'Can I use MindRise on my mobile phone or tablet?',
      a: 'Yes, MindRise is fully responsive with desktop, tablet, and mobile layouts tailored with touch-friendly reading controls and offline capabilities.'
    }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onExplore();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1D1B16] font-sans antialiased selection:bg-[#E3DC CE] selection:text-[#111]">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#E7E2D6] bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 py-3.5">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#234230] text-[#FAF7F2] shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-[#1D1B16]">
                  MindRise
                </span>
                <span className="rounded-md border border-[#234230]/20 bg-[#234230]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#234230]">
                  8.5M+ Books
                </span>
              </div>
              <p className="text-[10px] text-[#716B61] hidden sm:block">
                Universal Open Knowledge Sanctuary Across All Languages
              </p>
            </div>
          </div>

          {/* Controls & CTAs */}
          <div className="flex items-center gap-3">
            {/* Theme Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-1.5 rounded-lg border border-[#DCD6C7] bg-white px-2.5 py-1.5 text-xs font-medium text-[#463F34] shadow-2xs hover:bg-[#F2EDE3] transition-colors"
                title="Change Interface Theme"
              >
                <Palette className="h-3.5 w-3.5 text-[#234230]" />
                <span className="hidden sm:inline capitalize">{theme}</span>
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[#DCD6C7] bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-[#888] uppercase tracking-wider">
                    Interface Theme
                  </div>
                  {themeOptions.map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTheme(opt.id);
                          setShowThemeMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                          theme === opt.id
                            ? 'bg-[#EAE4D7] font-bold text-[#1D1B16]'
                            : 'text-[#444] hover:bg-[#F5F0E6]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <IconComp className="h-3.5 w-3.5" />
                          {opt.label}
                        </span>
                        <div
                          className="h-3 w-3 rounded-full border border-[#CCC]"
                          style={{ backgroundColor: opt.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Explore */}
            <button
              type="button"
              onClick={onExplore}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#DCD6C7] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1D1B16] hover:bg-[#F2EDE3] transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-[#666]" />
              Browse 8.5M+ Books
            </button>

            {/* Sign In */}
            <button
              type="button"
              onClick={onLogin}
              className="rounded-lg bg-[#234230] px-4 py-1.5 text-xs font-semibold text-[#FAF7F2] shadow-xs hover:bg-[#1A3325] transition-all hover:scale-[1.02]"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Atmosphere Section (Directly crafted based on ChatGPT Image) */}
      <section className="relative overflow-hidden border-b border-[#E7E2D6] bg-gradient-to-b from-[#FAF7F2] via-[#F6F2EA] to-[#EFEAE0] px-5 sm:px-8 py-14 sm:py-20">
        {/* Soft Ambient Studio Lighting Effects */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-emerald-900/5 blur-2xl" />

        <div className="relative mx-auto max-w-7xl">
          {/* Main Grid: Left Book Spines Stack, Center Content, Right Study Artifacts */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            
            {/* Left Column: Stack of Classic Bound Book Spines with Ivy Vines */}
            <div className="hidden lg:col-span-3 lg:block">
              <div className="relative flex flex-col items-center">
                {/* Draped Botanical Ivy Leaves (Top Accent) */}
                <div className="absolute -top-10 -left-4 z-20 flex items-center gap-1 text-emerald-800/80 drop-shadow-sm">
                  <span className="text-2xl select-none">🌿</span>
                  <span className="text-xl -rotate-12 select-none">🍃</span>
                </div>

                {/* Stack of Leather & Cloth Bound Books (Hover to explore discipline) */}
                <div className="w-full space-y-2 rounded-2xl bg-gradient-to-b from-stone-200/40 to-stone-300/40 p-4 border border-stone-300/60 shadow-lg shadow-amber-950/5 backdrop-blur-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-300/60 text-[10px] font-mono font-bold tracking-wider text-stone-600 uppercase">
                    <span>Curated Volumes</span>
                    <span>8.5M+ Books</span>
                  </div>

                  <div className="flex flex-col space-y-1.5 pt-1">
                    {bookSpines.map((spine, idx) => (
                      <div
                        key={spine.id}
                        onMouseEnter={() => setActiveSpineHover(spine.id)}
                        onMouseLeave={() => setActiveSpineHover(null)}
                        onClick={onExplore}
                        className={`group relative cursor-pointer overflow-hidden rounded-lg bg-gradient-to-r ${spine.color} p-2.5 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md border border-white/10`}
                      >
                        {/* Gold Foil Embossed Spine Look */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                            <span className={`font-serif text-xs font-bold tracking-wider uppercase ${spine.textColor}`}>
                              {spine.title}
                            </span>
                          </div>
                          <span className="font-mono text-[9px] opacity-75 text-white/90">
                            {spine.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-white/70 truncate">
                          {spine.sample}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Warm Walnut Desk Shelf Base */}
                  <div className="mt-2 h-3.5 w-full rounded-b-lg bg-gradient-to-r from-[#5B3A29] via-[#7B4F37] to-[#5B3A29] border-t border-[#8B5A3F] shadow-md" />
                </div>
              </div>
            </div>

            {/* Center Column: The Central ChatGPT Image Headline & Metrics */}
            <div className="text-center lg:col-span-6">
              {/* Top Pill: 🍃 Free & Open Knowledge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/20 bg-emerald-800/10 px-4 py-1.5 text-xs font-semibold text-[#234230] mb-5 shadow-2xs">
                <span className="text-sm">🍃</span>
                <span className="tracking-wide">Free & Open Knowledge</span>
              </div>

              {/* Display Headline */}
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1D1B16] sm:text-5xl md:text-6xl leading-[1.12]">
                A World of Books, <br className="hidden sm:inline" />
                Open to Everyone.
              </h1>

              {/* Subheadline */}
              <p className="mt-4 font-serif text-lg sm:text-xl text-[#5C5243] italic">
                Ideas, stories, and knowledge from across time and cultures.
              </p>

              {/* Narrative Copy */}
              <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-[#554F44]">
                Discover classics, literature, philosophy, history, personal growth, and so much more.
                Read, listen, and explore in one beautiful, distraction-free space.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onExplore}
                  className="flex items-center gap-2.5 rounded-xl bg-[#234230] px-7 py-3.5 text-sm font-semibold text-[#FAF7F2] shadow-md shadow-[#234230]/20 hover:bg-[#1A3325] hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Start Exploring</span>
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={onStartJourney}
                  className="flex items-center gap-2 rounded-xl border border-[#D4CDBE] bg-white px-5 py-3.5 text-sm font-medium text-[#1D1B16] shadow-2xs hover:bg-[#F2EDE3] transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-[#234230]" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Strict Login Requirement Notice */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#716B61] font-mono">
                <Lock className="h-3 w-3 text-emerald-800" />
                <span>Sign in required to enter the library & reader sanctuary</span>
              </div>

              {/* Center Divider: ————— KNOWLEDGE HAS NO BORDERS ————— */}
              <div className="my-10 flex items-center justify-center gap-3">
                <div className="h-px w-16 sm:w-28 bg-[#DCD6C7]" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#736B5E]">
                  Knowledge Has No Borders
                </span>
                <div className="h-px w-16 sm:w-28 bg-[#DCD6C7]" />
              </div>

              {/* 4 Iconic Metric Cards (From ChatGPT Image) */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Metric 1 */}
                <div className="rounded-2xl border border-[#E0D9CB] bg-white/90 p-4 shadow-xs transition-all hover:border-[#234230]/40 hover:shadow-sm">
                  <div className="flex items-center justify-center text-[#234230] mb-2">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-[#1D1B16]">
                    8.5 Million+
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#736B5E] uppercase">
                    Books
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="rounded-2xl border border-[#E0D9CB] bg-white/90 p-4 shadow-xs transition-all hover:border-[#234230]/40 hover:shadow-sm">
                  <div className="flex items-center justify-center text-[#234230] mb-2">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-[#1D1B16]">
                    All Languages
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#736B5E] uppercase">
                    One Library
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="rounded-2xl border border-[#E0D9CB] bg-white/90 p-4 shadow-xs transition-all hover:border-[#234230]/40 hover:shadow-sm">
                  <div className="flex items-center justify-center text-[#234230] mb-2">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-[#1D1B16]">
                    For Everyone
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#736B5E] uppercase">
                    Always Free
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="rounded-2xl border border-[#E0D9CB] bg-white/90 p-4 shadow-xs transition-all hover:border-[#234230]/40 hover:shadow-sm">
                  <div className="flex items-center justify-center text-[#234230] mb-2">
                    <InfinityIcon className="h-5 w-5" />
                  </div>
                  <div className="font-serif text-xl sm:text-2xl font-bold text-[#1D1B16]">
                    Timeless
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#736B5E] uppercase">
                    No Limits
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Desk Artifacts (Globe, Green Coffee Mug, Quote Frame) */}
            <div className="hidden lg:col-span-3 lg:block">
              <div className="relative space-y-4">
                {/* Framed Quote Print */}
                <div className="rounded-2xl border-2 border-[#DCD6C7] bg-[#FAF7F2] p-4 text-center shadow-md">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-[#888]">Universal Motto</div>
                  <p className="mt-1 font-serif text-xs font-bold uppercase tracking-wider text-[#2D2820] leading-snug">
                    Different Peoples <br />
                    Same Stories <br />
                    One Humanity
                  </p>
                </div>

                {/* Cozy Study Desk Artifact: Globe & Mug Illustration Box */}
                <div className="rounded-2xl border border-[#E0D9CB] bg-gradient-to-b from-white to-[#F6F2EA] p-5 shadow-sm text-center">
                  {/* Vintage Globe Icon Graphic */}
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAE4D7] border border-[#D5CDBC] text-[#234230] shadow-inner mb-3">
                    <Globe className="h-7 w-7 stroke-[1.5]" />
                  </div>
                  <div className="font-serif text-xs font-bold text-[#1D1B16]">
                    Global Knowledge Heritage
                  </div>
                  <p className="mt-1 text-[11px] text-[#666] leading-relaxed">
                    Open to readers from every country, every culture, and every background.
                  </p>

                  {/* Dark Green Mug Badge */}
                  <div className="mt-4 rounded-xl bg-[#234230] p-2.5 text-center text-white shadow-xs">
                    <div className="font-serif text-xs italic tracking-wide text-emerald-100">
                      "Good Books, Brighter Minds ♡"
                    </div>
                  </div>
                </div>

                {/* Warm Walnut Desk Shelf Base */}
                <div className="h-3.5 w-full rounded-b-lg bg-gradient-to-r from-[#5B3A29] via-[#7B4F37] to-[#5B3A29] border-t border-[#8B5A3F] shadow-md" />
              </div>
            </div>

          </div>

          {/* Live Search Bar directly in Hero */}
          <div className="mt-12 mx-auto max-w-2xl">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center rounded-2xl border border-[#D4CDBE] bg-white p-2 shadow-md shadow-amber-950/5 focus-within:border-[#234230] focus-within:ring-2 focus-within:ring-[#234230]/20 transition-all"
            >
              <Search className="h-5 w-5 text-[#888] ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across 8.5 million books, authors, subjects, or topics..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[#1D1B16] placeholder-[#888] outline-none"
              />
              <button
                type="submit"
                onClick={onExplore}
                className="rounded-xl bg-[#234230] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1A3325] transition-colors shrink-0"
              >
                Search
              </button>
            </form>

            {/* Suggested Searches */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#716B61]">
              <span className="text-[11px] font-medium">Try searching:</span>
              {quickSearchPills.map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSearchQuery(pill);
                    onExplore();
                  }}
                  className="rounded-md border border-[#E0D9CB] bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[#463F34] hover:bg-[#234230] hover:text-white transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Reader Experience Preview (Kindle & Audio) */}
      <section className="border-b border-[#E7E2D6] bg-white px-5 sm:px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#234230]">
              Sanctuary Reading Experience
            </span>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#1D1B16]">
              Engineered for Deep Reading & Pure Focus
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#666]">
              Every masterwork is rendered with typography tuned for long reading sessions, natural audio playback, and instant AI insights.
            </p>
          </div>

          {/* Interactive Mock Reader Container */}
          <div className="rounded-3xl border border-[#DCD6C7] bg-[#FAF7F2] p-5 sm:p-8 shadow-md">
            {/* Top Reader Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E2D6] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#234230] bg-[#234230]/10 px-2.5 py-1 rounded-md">
                  Chapter 1: The Nature of Wisdom
                </span>
                <span className="text-xs text-[#888]">· Meditations (Book II)</span>
              </div>

              {/* Theme & Sizing Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#DCD6C7]">
                  <button
                    type="button"
                    onClick={() => setReaderTheme('paper')}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${readerTheme === 'paper' ? 'bg-[#EAE4D7] text-[#1D1B16] font-bold' : 'text-[#666]'}`}
                  >
                    Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderTheme('sepia')}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${readerTheme === 'sepia' ? 'bg-[#F4ECD8] text-[#3E301F] font-bold' : 'text-[#666]'}`}
                  >
                    Sepia
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderTheme('dark')}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${readerTheme === 'dark' ? 'bg-[#1E2530] text-white font-bold' : 'text-[#666]'}`}
                  >
                    Dark
                  </button>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    className="px-2 py-1 rounded bg-white border border-[#DCD6C7] hover:bg-[#F2EDE3]"
                  >
                    A-
                  </button>
                  <span className="font-mono text-xs text-[#666]">{fontSize}px</span>
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                    className="px-2 py-1 rounded bg-white border border-[#DCD6C7] hover:bg-[#F2EDE3]"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* Reader Mock Page Body */}
            <div
              className={`rounded-2xl p-6 sm:p-10 transition-colors shadow-inner border border-black/5 ${
                readerTheme === 'paper'
                  ? 'bg-[#FAF8F5] text-[#222]'
                  : readerTheme === 'sepia'
                  ? 'bg-[#F4ECD8] text-[#3E301F]'
                  : 'bg-[#111827] text-[#E5E7EB]'
              }`}
            >
              <h3 className="font-serif text-2xl font-bold mb-4 tracking-tight">
                When you wake up in the morning, tell yourself:
              </h3>
              <p
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.75' }}
                className="font-serif text-justify"
              >
                The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are like this because they cannot distinguish good from evil. But I have seen the beauty of good, and the ugliness of evil, and have recognized that the wrongdoer has a nature related to my own — not of the same blood or birth, but the same mind, and possessing a share of the divine.
              </p>
              <p
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.75' }}
                className="font-serif text-justify mt-4"
              >
                None of them can hurt me. No one can implicate me in ugliness. Nor can I feel angry at my kin, or hate him. We were born to work together like feet, hands, and eyes, like the two rows of teeth, upper and lower. To obstruct each other is contrary to nature.
              </p>
            </div>

            {/* Audiobook Narration Bar + AI Assistant Drawer Simulation */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Audio Player Bar */}
              <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#DCD6C7]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#234230] text-white hover:bg-[#1A3325] transition"
                  >
                    {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <div>
                    <div className="font-serif text-xs font-bold text-[#1D1B16]">
                      {isPlayingAudio ? 'Audio Narration Playing (1.0x)' : 'Listen to Chapter'}
                    </div>
                    <div className="font-mono text-[10px] text-[#777]">Natural studio narration · 03:42 remaining</div>
                  </div>
                </div>
                <Volume2 className="h-4 w-4 text-[#888]" />
              </div>

              {/* AI Literary Assistant Insight */}
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 p-3 border border-emerald-200/60">
                <div className="flex items-center gap-2.5">
                  <Brain className="h-5 w-5 text-[#234230]" />
                  <div>
                    <div className="font-serif text-xs font-bold text-[#1D1B16]">
                      Query Bot Literary Insight
                    </div>
                    <div className="text-[10px] text-[#555]">"Marcus reframes adversaries as fellow passengers on earth."</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onExplore}
                  className="text-[11px] font-semibold text-[#234230] underline hover:text-black"
                >
                  Query Bot &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Core Sanctuary Pillars */}
      <section className="border-b border-[#E7E2D6] bg-[#FAF7F2] px-5 sm:px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#234230]">
              Built For Lifelong Scholars
            </span>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#1D1B16]">
              Why Thousands Read Daily on MindRise
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#666]">
              Everything you need to learn, reflect, and master human wisdom in one harmonious web application.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E0D9CB] bg-white p-6 shadow-2xs hover:shadow-md hover:border-[#234230]/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#234230] text-[#FAF7F2]">
                      <IconComp className="h-5 w-5" />
                    </div>
                    <span className="rounded-md border border-[#D5CDBC] bg-[#FAF7F2] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#234230]">
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#1D1B16]">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#5C564C] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curated Masterworks Across The 8.5M Library */}
      <section className="border-b border-[#E7E2D6] bg-white px-5 sm:px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#234230]">
                Universal Treasures
              </span>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#1D1B16]">
                Featured Works in the 8.5 Million+ Collection
              </h2>
              <p className="mt-1 text-xs text-[#777]">
                Spanning world literature, science, ancient philosophies, and psychology.
              </p>
            </div>

            <button
              type="button"
              onClick={onExplore}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#234230] hover:underline"
            >
              Browse Full Catalog (8.5M+ Books) &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {curatedHighlights.map((b, i) => (
              <div
                key={i}
                onClick={onExplore}
                className="group cursor-pointer rounded-2xl border border-[#E0D9CB] bg-[#FAF7F2] p-5 shadow-2xs hover:shadow-md hover:border-[#234230]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-2.5 mb-3 text-[10px] font-mono text-[#716B61]">
                    <span className="rounded bg-white px-2 py-0.5 border border-[#DCD6C7] font-semibold text-[#234230]">
                      {b.genre}
                    </span>
                    <span>{b.lang}</span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#1D1B16] group-hover:text-[#234230] transition-colors">
                    {b.title}
                  </h3>
                  <div className="text-xs font-medium text-[#736B5E] mt-0.5">
                    {b.author}
                  </div>
                  <p className="mt-3 text-xs text-[#554F44] italic border-l-2 border-[#234230]/40 pl-2.5 leading-relaxed">
                    "{b.quote}"
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#EAE4D7] text-[11px]">
                  <span className="text-[#888] font-mono">{b.pages} pages</span>
                  <span className="font-semibold text-[#234230] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Read Now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="border-b border-[#E7E2D6] bg-[#FAF7F2] px-5 sm:px-8 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#234230]">
              Everything You Need to Know
            </span>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#1D1B16]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#DCD6C7] bg-white overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 text-left font-serif text-sm sm:text-base font-bold text-[#1D1B16] hover:bg-[#F9F7F2] transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#888] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#234230]' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-[#554F44] leading-relaxed border-t border-[#F0EBE0] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Pre-Login CTA */}
          <div className="mt-12 text-center">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1D1B16]">
              Ready to Explore 8.5 Million+ Books?
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#666]">
              Join readers around the world in a distraction-free open library.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartJourney}
                className="flex items-center gap-2 rounded-xl bg-[#234230] px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#1A3325] transition hover:scale-[1.02]"
              >
                <BookOpen className="h-4 w-4" />
                <span>Begin Your Journey</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="rounded-xl border border-[#D4CDBE] bg-white px-5 py-3 text-xs sm:text-sm font-medium text-[#1D1B16] hover:bg-[#F2EDE3] transition"
              >
                Sign In to Enter Library
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Universal Library Footer */}
      <Footer setActiveTab={(tab) => {
        if (tab === 'home' || tab === 'explore' || tab === 'categories') {
          onExplore();
        } else {
          onStartJourney();
        }
      }} />
    </div>
  );
};
