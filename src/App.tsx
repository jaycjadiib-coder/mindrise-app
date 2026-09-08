import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { SearchModal } from './components/layout/SearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { LandingPage } from './components/landing/LandingPage';
import { BookReader } from './components/reader/BookReader';
import { BookDetailsModal } from './components/book/BookDetailsModal';
import { ArchiveInAppReader } from './components/archive/ArchiveInAppReader';
import { ArchiveBookDetailsModal } from './components/archive/ArchiveBookDetailsModal';
import { Footer } from './components/layout/Footer';
import { AIChatDrawer } from './components/coach/AIChatDrawer';
import { Sparkles, MessageSquare, BookOpen } from 'lucide-react';

// Views
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { ExploreBooks } from './components/explore/ExploreBooks';
import { CategoriesView } from './components/categories/CategoriesView';
import { MyLibrary } from './components/library/MyLibrary';
import { NotesVault } from './components/notes/NotesVault';
import { ReadingGoals } from './components/goals/ReadingGoals';
import { HabitTracker } from './components/habits/HabitTracker';
import { ChallengesView } from './components/challenges/ChallengesView';
import { DailyJournal } from './components/journal/DailyJournal';
import { GrowthAnalytics } from './components/analytics/GrowthAnalytics';
import { MindRiseCoach } from './components/coach/MindRiseCoach';
import { CommunityView } from './components/community/CommunityView';
import { CollectionsView } from './components/collections/CollectionsView';
import { PremiumView } from './components/premium/PremiumView';
import { UserProfile } from './components/profile/UserProfile';
import { AdminConsole } from './components/admin/AdminConsole';

const MainAppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeReaderBookId, activeArchiveReader, navTabRequest, clearNavTabRequest } = useData();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | undefined>(undefined);

  // Listen to navigation requests from context (e.g. coach open)
  useEffect(() => {
    if (navTabRequest) {
      setActiveTab(navTabRequest);
      clearNavTabRequest();
    }
  }, [navTabRequest, clearNavTabRequest]);

  // Global hotkey: Cmd+K / Ctrl+K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading state while verifying authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-[#234230] flex items-center justify-center text-[#FAF7F2] shadow-md animate-pulse mb-4">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-[#1D1B16] tracking-tight">
          MindRise Open Library
        </h2>
        <p className="mt-1 text-xs text-[#716B61] font-mono">
          Verifying reading sanctuary session...
        </p>
      </div>
    );
  }

  // STRICT REQUIREMENT: App entry strictly requires authentication.
  // Unauthenticated users CANNOT enter the app without signing in or registering.
  if (!user) {
    return (
      <>
        <LandingPage
          onStartJourney={() => {
            setAuthNotice('Create your scholar account to begin reading and accessing 8.5M+ books.');
            setAuthMode('register');
            setIsAuthOpen(true);
          }}
          onExplore={() => {
            // Strictly enforce authentication before accessing the library!
            setAuthNotice('Sign in is mandatory to enter MindRise and explore 8.5M+ books.');
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
          onLogin={() => {
            setAuthNotice(undefined);
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialMode={authMode}
          customMessage={authNotice}
          onSuccess={() => {
            setIsAuthOpen(false);
          }}
        />
      </>
    );
  }

  // If Internet Archive reading mode is active, display the archive reader fullscreen
  if (activeArchiveReader) {
    return <ArchiveInAppReader />;
  }

  // If local/curated reading mode is active, display the reader fullscreen
  if (activeReaderBookId) {
    return <BookReader />;
  }

  // Render view by active tab
  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboard setActiveTab={setActiveTab} />;
      case 'explore':
        return <ExploreBooks onBack={() => setActiveTab('home')} />;
      case 'categories':
        return <CategoriesView />;
      case 'library':
        return <MyLibrary setActiveTab={setActiveTab} />;
      case 'habits':
        return <HabitTracker />;
      case 'journal':
        return <DailyJournal />;
      case 'notes':
        return <NotesVault />;
      case 'coach':
        return <MindRiseCoach />;
      case 'community':
        return <CommunityView />;
      case 'premium':
        return <PremiumView />;
      case 'profile':
        return <UserProfile />;
      case 'admin':
        return <AdminConsole />;
      default:
        return <HomeDashboard setActiveTab={setActiveTab} />;
    }
  };

  const getContainerBg = () => {
    if (theme === 'paper') return 'bg-[#FAF8F5] text-[#1A1A1A]';
    if (theme === 'white') return 'bg-white text-gray-900';
    if (theme === 'sepia') return 'bg-[#F4ECD8] text-[#2C2416]';
    return 'bg-[#0B0F19] text-slate-100';
  };

  const getMainBg = () => {
    if (theme === 'paper') return 'bg-[#FAF8F5]';
    if (theme === 'white') return 'bg-white';
    if (theme === 'sepia') return 'bg-[#F4ECD8]';
    return 'bg-[#0B0F19]';
  };

  return (
    <div className={`flex min-h-screen ${getContainerBg()} font-sans selection:bg-[#E5E2DA]`}>
      {/* Slide-out Sidebar Drawer (starts closed, opened via 3-lines menu) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-screen">
        {/* Top Navbar with 3-lines menu button */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthOpen(true);
          }}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* View Content Area */}
        <main className={`flex-1 overflow-y-auto pb-24 md:pb-6 ${getMainBg()}`}>
          <div className={`mx-auto w-full ${activeTab === 'explore' ? 'max-w-[1800px] px-3 sm:px-5 lg:px-7 py-5' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>
            {renderActiveView()}
          </div>

          {/* Open Library & MindRise Classic Footer - only on Explore tab */}
          {activeTab === 'explore' && <Footer setActiveTab={setActiveTab} />}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Floating Groq AI Assistant Button - safely positioned above mobile bottom bar */}
      <button
        id="floating-ai-mentor-btn"
        onClick={() => setIsAIChatOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2.5 rounded-full bg-[#1A1A1A] text-[#FAF8F5] px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xl border border-[#403B32]/40 hover:bg-[#333] hover:scale-105 active:scale-95 transition-all group font-sans"
        title="Open MindRise AI Mentor (Groq)"
        aria-label="Open AI Assistant"
      >
        <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
        </div>
        <span className="text-xs font-semibold tracking-wide">AI Mentor</span>
        <span className="hidden sm:inline rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 text-[9px] font-mono font-medium">
          Groq AI
        </span>
      </button>

      {/* Slide-out Groq AI Assistant Drawer (dismiss on outside click or ESC) */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      {/* Modals & Overlays */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      <OnboardingModal
        isOpen={!!user && user.onboardingCompleted === false}
        onClose={() => {}}
      />

      <BookDetailsModal />
      <ArchiveBookDetailsModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <MainAppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
