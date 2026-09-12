import React, { useState } from 'react';
import {
  Library,
  BookOpen,
  CheckCircle2,
  Bookmark,
  Heart,
  FolderPlus,
  Play,
  MoreVertical,
  Plus,
  Trash2,
  Compass,
  Globe
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ReadingStatus, LibraryItem, ArchiveLibraryItem } from '../../types';
import { BackButton } from '../common/BackButton';

interface MyLibraryProps {
  setActiveTab: (tab: string) => void;
  onBack?: () => void;
}

export const MyLibrary: React.FC<MyLibraryProps> = ({ setActiveTab, onBack }) => {
  const {
    books,
    library,
    removeFromLibrary,
    addToLibrary,
    readingProgress,
    openReader,
    openBookDetails,
    archiveLibrary,
    archiveProgress,
    openArchiveReader,
    openArchiveBookDetails,
    removeArchiveFromLibrary
  } = useData();

  const [tabType, setTabType] = useState<'all' | 'archive' | 'curated'>('all');
  const [filter, setFilter] = useState<'all' | ReadingStatus>('all');

  const libraryItems = (Object.values(library || {}) as LibraryItem[]);
  const archiveItems = (Object.values(archiveLibrary || {}) as ArchiveLibraryItem[]);

  const filteredCuratedItems = (libraryItems || []).filter((item) => {
    if (!item) return false;
    if (tabType === 'archive') return false;
    if (filter === 'all') return true;
    const currentShelf = item.shelf || item.status;
    return currentShelf === filter;
  });

  const filteredArchiveItems = (archiveItems || []).filter((item) => {
    if (!item) return false;
    if (tabType === 'curated') return false;
    if (filter === 'all') return true;
    const currentShelf = item.shelf || item.status;
    return currentShelf === filter;
  });

  const totalCount = (tabType === 'archive' ? 0 : filteredCuratedItems.length) + (tabType === 'curated' ? 0 : filteredArchiveItems.length);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-white sm:text-4xl">
              My Personal Library
            </h1>
            <p className="mt-1 text-xs text-[#666] dark:text-stone-400">
              Your personal digital vault of active journeys, Internet Archive bookmarks, and finished volumes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black px-4 py-2.5 text-xs font-semibold shadow-md transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          <span>Explore Books</span>
        </button>
      </div>

      {/* Source Switcher & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-3">
        {/* Source Switcher */}
        <div className="flex items-center gap-2 rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/10 dark:border-white/10">
          <button
            onClick={() => setTabType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabType === 'all'
                ? 'bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black'
                : 'text-inherit opacity-70 hover:opacity-100'
            }`}
          >
            All Sources ({libraryItems.length + archiveItems.length})
          </button>
          <button
            onClick={() => setTabType('archive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabType === 'archive'
                ? 'bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black'
                : 'text-inherit opacity-70 hover:opacity-100'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>Internet Archive ({archiveItems.length})</span>
          </button>
          <button
            onClick={() => setTabType('curated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabType === 'curated'
                ? 'bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black'
                : 'text-inherit opacity-70 hover:opacity-100'
            }`}
          >
            Curated Classics ({libraryItems.length})
          </button>
        </div>

        {/* Shelf Filter */}
        <div className="flex overflow-x-auto gap-2 text-xs">
          {[
            { id: 'all', label: 'All Shelves' },
            { id: 'currently-reading', label: 'Currently Reading' },
            { id: 'want-to-read', label: 'Want to Read' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 transition-all font-medium ${
                filter === tab.id
                  ? 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  : 'text-[#666] dark:text-stone-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {totalCount === 0 ? (
        <div className="rounded-3xl border border-black/10 dark:border-stone-800 bg-white dark:bg-[#080d0a] p-12 text-center">
          <Library className="mx-auto h-10 w-10 text-stone-400 dark:text-stone-600" />
          <h3 className="mt-3 font-serif text-lg font-bold text-[#1A1A1A] dark:text-stone-200">
            Your library is empty in this view
          </h3>
          <p className="mt-1 text-xs text-[#666] dark:text-stone-400 max-w-sm mx-auto">
            Discover great books on the Internet Archive or curated catalog and tap "Add to Library" or start reading to build your personal treasury.
          </p>
          <button
            onClick={() => setActiveTab('explore')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black px-5 py-2.5 text-xs font-semibold hover:opacity-90"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Online Library</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Internet Archive Items */}
          {(filteredArchiveItems || []).map((item) => {
            const prog = archiveProgress[item.identifier];
            return (
              <div
                key={`archive-${item.identifier}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-[#0c120e] p-4 shadow-2xs hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <div
                    onClick={() => openArchiveBookDetails(item.identifier)}
                    className="relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-stone-800 shadow-md w-24 aspect-[3/4] bg-[#f5f1e8] dark:bg-stone-900"
                  >
                    <img
                      src={item.coverUrl || `https://archive.org/services/img/${item.identifier}`}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute top-1 left-1 rounded bg-amber-600 px-1 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider">
                      IA
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      <Globe className="h-3 w-3" />
                      <span>Internet Archive</span>
                    </div>
                    <h3
                      onClick={() => openArchiveBookDetails(item.identifier)}
                      className="cursor-pointer font-serif text-sm font-bold text-[#1A1A1A] dark:text-white line-clamp-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors mt-0.5"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#666] dark:text-stone-400 truncate mt-0.5">{item.author}</p>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-[#777] dark:text-stone-400 mb-1">
                        <span>Reading Progress</span>
                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                          {prog ? `${prog.percentage}%` : '0%'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${prog?.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-black/10 dark:border-stone-800 pt-3">
                  <button
                    onClick={() => openArchiveReader({
                      identifier: item.identifier,
                      title: item.title,
                      creator: item.author || (item as any).creator,
                      coverUrl: item.coverUrl
                    })}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 text-white px-3 py-1.5 text-xs font-semibold shadow-xs hover:bg-amber-700 transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{prog ? 'Resume Reading' : 'Read Now'}</span>
                  </button>

                  <div className="flex items-center gap-2 text-stone-500">
                    <button
                      onClick={() => removeArchiveFromLibrary(item.identifier)}
                      className="p-1.5 hover:text-rose-500 transition-colors"
                      title="Remove from saved books"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Curated Library Items */}
          {(filteredCuratedItems || []).map((item) => {
            const book = books.find((b) => b.id === item.bookId);
            if (!book) return null;
            const prog = readingProgress[book.id];

            return (
              <div
                key={`curated-${item.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-black/10 dark:border-stone-800 bg-white dark:bg-[#080d0a] p-4 shadow-2xs hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <div
                    onClick={() => openBookDetails(book.id)}
                    className="relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-stone-800 shadow-md w-24 aspect-[3/4]"
                  >
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-emerald-400">
                      {book.category}
                    </span>
                    <h3
                      onClick={() => openBookDetails(book.id)}
                      className="cursor-pointer font-serif text-sm font-bold text-[#1A1A1A] dark:text-white line-clamp-1 hover:text-amber-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#666] dark:text-stone-400 truncate">{book.author}</p>

                    {/* Reading Status Selector */}
                    <div className="mt-3">
                      <select
                        value={item.shelf || item.status || 'currently-reading'}
                        onChange={(e) => addToLibrary(book.id, e.target.value as ReadingStatus)}
                        className="rounded-lg border border-black/10 dark:border-stone-800 bg-black/5 dark:bg-stone-900 px-2 py-1 text-[10px] text-inherit outline-none"
                      >
                        <option value="currently-reading">Currently Reading</option>
                        <option value="want-to-read">Want to Read</option>
                        <option value="completed">Completed</option>
                        <option value="favorites">Favorites</option>
                      </select>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-[#777] dark:text-stone-400 mb-1">
                        <span>Progress</span>
                        <span className="text-amber-700 dark:text-emerald-400 font-medium">
                          {prog ? `${prog.percentage}%` : '0%'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-stone-900 overflow-hidden">
                        <div
                          className="h-full bg-[#1A1A1A] dark:bg-emerald-500 rounded-full"
                          style={{ width: `${prog?.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-black/10 dark:border-stone-800 pt-3">
                  <button
                    onClick={() => openReader(book.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-black/10 dark:bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] dark:text-emerald-300 border border-black/15 dark:border-emerald-500/30 hover:bg-[#1A1A1A] hover:text-white dark:hover:bg-emerald-500 dark:hover:text-black transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Read</span>
                  </button>

                  <div className="flex items-center gap-1 text-stone-500">
                    <button
                      onClick={() => removeFromLibrary(book.id)}
                      className="p-1.5 hover:text-rose-400 transition-colors"
                      title="Remove from library"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
