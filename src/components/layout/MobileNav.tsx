import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Library,
  Repeat,
  Sparkles,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();

  const navItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'habits', label: 'Habits', icon: Repeat },
    { id: 'coach', label: 'Coach', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    navItems[navItems.length - 1] = { id: 'admin', label: 'Admin', icon: ShieldCheck };
  }

  // Theme-aware styles for mobile navigation bar
  const getNavThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'border-[#1E2638] bg-[#0E1320]/95 text-[#94A3B8]';
      case 'sepia':
        return 'border-[#DFD5BD] bg-[#EDE3CB]/95 text-[#6B5A42]';
      case 'white':
        return 'border-gray-200 bg-white/95 text-gray-500';
      case 'paper':
      default:
        return 'border-[#E5E2DA] bg-[#F9F7F2]/95 text-[#716B61]';
    }
  };

  const getActiveItemClasses = (isActive: boolean) => {
    if (!isActive) {
      return theme === 'dark'
        ? 'text-[#94A3B8] hover:text-[#F1F5F9]'
        : 'text-[#888] hover:text-[#1A1A1A]';
    }

    switch (theme) {
      case 'dark':
        return 'text-emerald-400 font-semibold';
      case 'sepia':
        return 'text-[#2C2416] font-semibold';
      case 'white':
        return 'text-black font-semibold';
      case 'paper':
      default:
        return 'text-[#1A1A1A] font-semibold';
    }
  };

  return (
    <div
      id="mobile-bottom-navbar"
      className={`fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t px-2 backdrop-blur-xl transition-colors md:hidden ${getNavThemeClasses()}`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-all ${getActiveItemClasses(
              isActive
            )}`}
          >
            <Icon className={`h-4 w-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

