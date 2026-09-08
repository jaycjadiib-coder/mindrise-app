import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu,
  Search,
  X,
  Flame,
  Bell,
  Sparkles,
  Shield,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Clock,
  BookOpen,
  Palette,
  Sun,
  Moon,
  Scroll
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme, AppTheme } from '../../context/ThemeContext';
import { ReadingProgress } from '../../types';
import { getSearchRecommendations } from '../../services/internetArchiveService';

interface NavbarProps {
  onOpenSearch: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onToggleSidebar
}) => {
  const { user, isAdmin, logout } = useAuth();
  const {
    notifications,
    markNotificationRead,
    goals,
    readingProgress,
    books,
    openReader,
    archiveSearchQuery,
    setArchiveSearchQuery
  } = useData();
  const { theme, setTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Nav Search and Recommendations
  const [navSearchInput, setNavSearchInput] = useState(archiveSearchQuery || '');
  const [showNavRecs, setShowNavRecs] = useState(false);
  const navSearchRef = useRef<HTMLDivElement>(null);

  // Sync nav search with archiveSearchQuery
  useEffect(() => {
    if (typeof archiveSearchQuery === 'string' && archiveSearchQuery !== navSearchInput) {
      setNavSearchInput(archiveSearchQuery);
    }
  }, [archiveSearchQuery]);

  // Click outside to close nav recommendations
  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (navSearchRef.current && !navSearchRef.current.contains(e.target as Node)) {
        setShowNavRecs(false);
      }
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  const navRecommendations = useMemo(() => {
    return getSearchRecommendations(navSearchInput, 8);
  }, [navSearchInput]);

  const handleNavSearch = (query: string) => {
    const clean = query.trim();
    setArchiveSearchQuery(clean);
    setActiveTab('explore');
    setShowNavRecs(false);
  };

  // Close dropdowns on Escape key
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowThemeMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const dailyGoal = goals.find((g) => g.id === 'goal-daily-reading');

  // Currently reading book for quick resume
  const activeBookProg = (Object.values(readingProgress) as ReadingProgress[]).find((p) => !p.completed);
  const activeBook = activeBookProg ? books.find((b) => b.id === activeBookProg.bookId) : null;

  const themeOptions: { id: AppTheme; label: string; icon: any; color: string }[] = [
    { id: 'paper', label: 'Paper Classic', icon: Scroll, color: '#FAF8F5' },
    { id: 'white', label: 'Pure White', icon: Sun, color: '#FFFFFF' },
    { id: 'sepia', label: 'Sepia Archive', icon: Palette, color: '#F4ECD8' },
    { id: 'dark', label: 'Night Obsidian', icon: Moon, color: '#0F172A' },
  ];

  const getHeaderClasses = () => {
    if (theme === 'paper') {
      return 'border-[#E5E2DA] bg-[#FAF8F5]/95 text-[#1A1A1A]';
    }
    if (theme === 'white') {
      return 'border-gray-200 bg-white/95 text-gray-900';
    }
    if (theme === 'sepia') {
      return 'border-[#E2D7BE] bg-[#F4ECD8]/95 text-[#2C2416]';
    }
    return 'border-slate-800 bg-[#0B0F19]/95 text-slate-100';
  };

  const getPillClasses = () => {
    if (theme === 'paper') {
      return 'border-[#D8D4CA] bg-white text-[#1A1A1A] hover:bg-[#F2EFE9]';
    }
    if (theme === 'white') {
      return 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100';
    }
    if (theme === 'sepia') {
      return 'border-[#E2D7BE] bg-[#EFE4CC] text-[#2C2416] hover:bg-[#E8DCC0]';
    }
    return 'border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800';
  };

  const getDropdownClasses = () => {
    if (theme === 'paper') {
      return 'border-[#D8D4CA] bg-[#FAF8F5] text-[#1A1A1A] shadow-xl';
    }
    if (theme === 'white') {
      return 'border-gray-200 bg-white text-gray-900 shadow-xl';
    }
    if (theme === 'sepia') {
      return 'border-[#E2D7BE] bg-[#F4ECD8] text-[#2C2416] shadow-xl';
    }
    return 'border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl';
  };

  return (
    <>
      {/* Invisible backdrop to dismiss open dropdowns when clicking anywhere outside */}
      {(showNotifications || showProfileMenu || showThemeMenu) && (
        <div
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
            setShowThemeMenu(false);
          }}
          className="fixed inset-0 z-25 bg-transparent cursor-default"
        />
      )}

      <header className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b ${getHeaderClasses()} px-3 backdrop-blur-md md:px-8 font-sans`}>
        {/* Left: 3-lines menu (hamburger) + Brand + Search Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className={`flex items-center gap-2 rounded-xl border ${getPillClasses()} px-3 py-2 text-xs font-medium transition-all shadow-2xs`}
            title="Navigation Menu (3 lines)"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4 text-amber-700" />
            <span className="font-serif text-sm tracking-tight hidden sm:inline font-semibold">
              MindRise
            </span>
          </button>

          {/* Top Search Input with Recommendations Dropdown */}
          <div ref={navSearchRef} className="relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavSearch(navSearchInput);
              }}
              className={`group flex items-center gap-2 rounded-full border ${getPillClasses()} px-3 py-1.5 transition-all w-40 sm:w-60 md:w-72 shadow-2xs focus-within:ring-1 focus-within:ring-amber-500`}
            >
              <Search className={`h-3.5 w-3.5 shrink-0 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`} />
              <input
                type="text"
                value={navSearchInput}
                onChange={(e) => {
                  setNavSearchInput(e.target.value);
                  setShowNavRecs(true);
                }}
                onFocus={() => setShowNavRecs(true)}
                placeholder="Search books, authors..."
                className={`w-full bg-transparent text-xs font-sans font-medium focus:outline-hidden ${
                  theme === 'dark'
                    ? 'text-stone-100 placeholder-stone-400'
                    : 'text-stone-950 placeholder-stone-500'
                }`}
              />
              {navSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setNavSearchInput('');
                    setArchiveSearchQuery('');
                  }}
                  className={`p-0.5 cursor-pointer ${
                    theme === 'dark'
                      ? 'text-stone-400 hover:text-stone-100'
                      : 'text-stone-600 hover:text-stone-950'
                  }`}
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <kbd
                onClick={onOpenSearch}
                className={`hidden md:inline-block rounded px-1.5 py-0.5 text-[9px] font-mono border cursor-pointer shrink-0 ${
                  theme === 'dark'
                    ? 'border-white/20 text-stone-300 hover:text-white'
                    : 'border-black/20 text-stone-600 hover:text-stone-950'
                }`}
                title="Open Advanced Search (⌘K)"
              >
                ⌘K
              </kbd>
            </form>

            {/* Real-Time Recommendations Dropdown */}
            {showNavRecs && navRecommendations.length > 0 && (
              <div
                className={`absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
                  theme === 'dark'
                    ? 'border-stone-800 bg-stone-900 text-stone-100'
                    : 'border-stone-200 bg-white text-stone-900'
                }`}
              >
                <div
                  className={`px-3.5 py-2 border-b flex items-center justify-between text-[11px] font-medium ${
                    theme === 'dark'
                      ? 'border-stone-800 bg-stone-950/50 text-stone-400'
                      : 'border-stone-100 bg-stone-50 text-stone-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Popular Recommendations</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNavRecs(false);
                      onOpenSearch();
                    }}
                    className="text-amber-600 dark:text-amber-400 hover:underline text-[10px] cursor-pointer"
                  >
                    Advanced (⌘K)
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                  {navRecommendations.map((rec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setNavSearchInput(rec.title);
                        handleNavSearch(rec.query);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors group cursor-pointer ${
                        theme === 'dark'
                          ? 'text-stone-200 hover:bg-stone-800/90'
                          : 'text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div className="truncate min-w-0">
                          <div
                            className={`font-semibold truncate text-xs ${
                              theme === 'dark' ? 'text-stone-100' : 'text-stone-950'
                            }`}
                          >
                            {rec.title}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                            }`}
                          >
                            लेखक: {rec.author}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 ml-2 rounded-md px-2 py-0.5 text-[9px] font-medium border ${
                          theme === 'dark'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        Book
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 font-sans">
          {/* Quick Continue Reading Pill if available */}
          {activeBook && (
            <button
              onClick={() => openReader(activeBook.id)}
              className={`hidden items-center gap-2 rounded-full border ${getPillClasses()} px-3.5 py-1 text-xs font-medium lg:flex shadow-2xs`}
              title={`Continue ${activeBook.title}`}
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-700" />
              <span className="max-w-[130px] truncate">{activeBook.title}</span>
              <span className="rounded-full bg-amber-600/20 text-amber-900 px-1.5 py-0.2 text-[9px] font-mono font-semibold">
                {activeBookProg?.percentage}%
              </span>
            </button>
          )}

          {/* Streak Counter */}
          <div
            onClick={() => setActiveTab('habits')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border ${getPillClasses()} px-3.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 shadow-2xs font-mono`}
            title={`${user?.currentStreak || 0} Day Streak`}
          >
            <Flame className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
            <span>{user?.currentStreak || 0} <span className="hidden sm:inline font-sans opacity-70">Days</span></span>
          </div>

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`flex items-center gap-1.5 rounded-full border ${getPillClasses()} px-2.5 py-1 text-xs font-medium shadow-2xs`}
              title="Choose UI Theme"
            >
              <Palette className="h-3.5 w-3.5 text-amber-800" />
              <span className="hidden sm:inline capitalize text-[11px]">{theme}</span>
            </button>

            {showThemeMenu && (
              <div className={`absolute right-0 mt-2 w-44 rounded-2xl border ${getDropdownClasses()} p-1.5 z-50 animate-in fade-in zoom-in-95`}>
                <div className="px-2 py-1 text-[10px] font-bold opacity-60 uppercase tracking-wider">
                  Interface Theme
                </div>
                {themeOptions.map((opt) => {
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id);
                        setShowThemeMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors ${
                        theme === opt.id
                          ? 'bg-amber-500/20 font-bold'
                          : 'opacity-80 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <IconComp className="h-3.5 w-3.5" />
                        {opt.label}
                      </span>
                      <div
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: opt.color }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Switcher / Badge */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className="flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-950/20 px-3 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-300 transition-all hover:bg-violet-900/30"
              title="Access Admin Console"
            >
              <Shield className="h-3 w-3" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border ${getPillClasses()} shadow-2xs`}
              aria-label="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[9px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border ${getDropdownClasses()} p-4 z-50`}>
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2 px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                    Notifications
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {(notifications || []).length === 0 ? (
                    <div className="py-6 text-center text-xs opacity-60">
                      No notifications yet
                    </div>
                  ) : (
                    (notifications || []).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`cursor-pointer rounded-xl p-3 text-xs transition-colors border ${
                          n.read
                            ? 'opacity-60 border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                            : 'border-amber-600/30 bg-amber-500/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">{n.title}</p>
                          <span className="text-[10px] opacity-60 font-mono shrink-0">
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] opacity-80 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar / Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 p-1 hover:border-black/30 transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A] text-white font-serif text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="h-3 w-3 opacity-60 hidden sm:block mr-1" />
              </button>

              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl border ${getDropdownClasses()} p-2 z-50 animate-in fade-in zoom-in-95`}>
                  <div className="border-b border-black/10 dark:border-white/10 px-3 py-2">
                    <p className="font-serif text-sm font-bold truncate">{user.name || 'Scholar'}</p>
                    <p className="text-[11px] opacity-60 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs opacity-80 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <User className="h-3.5 w-3.5" />
                      View Profile & Stats
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('habits');
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs opacity-80 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Habit Tracker
                    </button>
                  </div>

                  <div className="border-t border-black/10 dark:border-white/10 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-rose-600 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="rounded-xl bg-[#1A1A1A] text-[#FAF8F5] px-4 py-2 text-xs font-semibold shadow-xs hover:bg-[#333] transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>
    </>
  );
};
