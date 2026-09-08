import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Grid,
  Library,
  Bookmark,
  Target,
  Repeat,
  Trophy,
  BookOpen,
  BarChart3,
  Sparkles,
  Users,
  FolderHeart,
  ShieldCheck,
  Crown,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();

  // Close on Escape key
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navSections = [
    {
      title: 'DISCOVER & ARCHIVES',
      items: [
        { id: 'home', label: 'Home Dashboard', icon: LayoutDashboard },
        { id: 'explore', label: 'Explore Books', icon: Compass },
        { id: 'categories', label: 'Categories & Subjects', icon: Grid },
        { id: 'library', label: 'My Library', icon: Library },
      ]
    },
    {
      title: 'REFLECTION & SYSTEMS',
      items: [
        { id: 'habits', label: 'Habit Tracker', icon: Repeat },
        { id: 'journal', label: 'Daily Journal', icon: BookOpen },
        { id: 'notes', label: 'Notes & Vault', icon: Bookmark },
      ]
    },
    {
      title: 'MENTORSHIP & TRIBE',
      items: [
        { id: 'coach', label: 'MindRise AI Coach', icon: Sparkles, badge: 'AI' },
        { id: 'community', label: 'Community & Clubs', icon: Users },
      ]
    }
  ];

  if (isAdmin) {
    navSections.push({
      title: 'ADMINISTRATION',
      items: [
        { id: 'admin', label: 'Admin Console', icon: ShieldCheck, badge: 'Admin' }
      ]
    });
  }

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  const getDrawerClasses = () => {
    if (theme === 'paper') {
      return 'border-[#D8D4CA] bg-[#FAF8F5] text-[#1A1A1A] shadow-2xl';
    }
    if (theme === 'white') {
      return 'border-gray-200 bg-white text-gray-900 shadow-2xl';
    }
    if (theme === 'sepia') {
      return 'border-[#E2D7BE] bg-[#F4ECD8] text-[#2C2416] shadow-2xl';
    }
    return 'border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl';
  };

  const getActiveItemClasses = (isActive: boolean) => {
    if (isActive) {
      return 'bg-[#1A1A1A] text-[#FAF8F5] font-semibold shadow-xs';
    }
    return 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5';
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col justify-between border-r ${getDrawerClasses()} p-5 select-none animate-in slide-in-from-left duration-200 cursor-default font-sans`}
      >
        {/* Brand Header with Close (X) button */}
        <div>
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleSelectTab('home')}
              className="group flex cursor-pointer items-center gap-3 px-1 py-1 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] text-white shadow-xs">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] font-mono opacity-60">
                  OPEN LIBRARY
                </div>
                <h1 className="font-serif text-lg font-bold tracking-tight">
                  MindRise
                </h1>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="rounded-xl p-2 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Close Menu"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation list */}
          <nav className="mt-6 space-y-5 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
            {navSections.map((section) => (
              <div key={section.title}>
                <h2 className="px-2 text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">
                  {section.title}
                </h2>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${getActiveItemClasses(
                          isActive
                        )}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4" />
                          <span className="tracking-wide">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-500/20 text-amber-900 border border-amber-600/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Profile Block */}
        <div className="space-y-3 pt-3 border-t border-black/10 dark:border-white/10">
          <div
            onClick={() => handleSelectTab('profile')}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 p-2 transition-all hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A] text-white font-serif text-xs font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{user?.name || 'Scholar'}</p>
              <p className="text-[9px] uppercase tracking-wider text-amber-700 font-mono truncate">
                {user?.currentStreak || 1}-day streak
              </p>
            </div>
            <Settings className="h-3.5 w-3.5 opacity-50" />
          </div>
        </div>
      </aside>
    </div>
  );
};
