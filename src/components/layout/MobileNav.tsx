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

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin } = useAuth();

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#E5E2DA] bg-[#F9F7F2]/95 px-2 backdrop-blur-lg md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-all ${
              isActive ? 'text-[#1A1A1A] font-semibold' : 'text-[#888] hover:text-[#1A1A1A]'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'scale-110 text-[#1A1A1A]' : ''}`} />
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
