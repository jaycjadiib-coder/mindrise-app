import React from 'react';
import {
  Brain,
  Shield,
  Zap,
  Repeat,
  Compass,
  TrendingUp,
  Heart,
  Users,
  Eye,
  Sun,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface CategoriesViewProps {
  onSelectCategory?: (category: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onSelectCategory }) => {
  const { categories, books, openBookDetails } = useData();

  const iconMap: Record<string, any> = {
    Brain,
    Shield,
    Zap,
    Repeat,
    Compass,
    TrendingUp,
    Heart,
    Users,
    Eye,
    Sun,
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Categories
        </h1>
        <p className="mt-1 text-xs text-stone-400">
          Browse by intellectual discipline, philosophical framework, or habit dimension.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(categories || []).map((cat) => {
          const IconComponent = iconMap[cat.icon] || BookOpen;
          const categoryBooks = (books || []).filter(
            (b) => b.category === cat.name || (Array.isArray(b.categories) && b.categories.includes(cat.name))
          );

          return (
            <div
              key={cat.id}
              className="group relative overflow-hidden rounded-3xl border border-emerald-950/60 bg-[#070d09] p-6 transition-all hover:border-emerald-700/60 hover:shadow-xl hover:shadow-emerald-950/40"
            >
              {/* Background cover with gradient overlay */}
              <div
                className="absolute inset-0 -z-10 bg-cover bg-center opacity-15 transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${cat.imageUrl})` }}
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#070d09] via-[#070d09]/80 to-transparent" />

              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 shadow-lg shadow-emerald-950/50">
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-stone-800">
                  {categoryBooks.length || cat.bookCount} Titles
                </span>
              </div>

              <h2 className="mt-4 font-serif text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                {cat.name}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-400">
                {cat.desc || cat.description}
              </p>

              {/* Sample titles */}
              <div className="mt-5 border-t border-stone-800/60 pt-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-300">
                  Featured in this category:
                </span>
                <div className="mt-2 space-y-1.5">
                  {categoryBooks.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => openBookDetails(b.id)}
                      className="flex cursor-pointer items-center justify-between text-xs text-stone-300 hover:text-emerald-300"
                    >
                      <span className="truncate max-w-[200px]">{b.title}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
