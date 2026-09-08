import React, { useState } from 'react';
import {
  FolderHeart,
  BookOpen,
  Plus,
  Compass,
  ArrowRight,
  FolderPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useData } from '../../context/DataContext';

export const CollectionsView: React.FC = () => {
  const { books, openBookDetails } = useData();

  const [curatedCollections, setCuratedCollections] = useState([
    {
      id: 'col-1',
      title: 'The Stoic Citadel',
      description: 'Ancient Roman and Greek resilience protocols for modern psychological peace.',
      bookIds: ['meditations-marcus-aurelius', 'discourses-epictetus', 'letters-from-a-stoic-seneca'],
      badge: 'Philosophy',
    },
    {
      id: 'col-2',
      title: 'Discipline & Micro-Execution',
      description: 'Eliminate internal debate. Execute with unyielding mechanical consistency.',
      bookIds: ['atomic-habits-mastery-protocol', 'deep-work-philosophy'],
      badge: 'Systems',
    },
    {
      id: 'col-3',
      title: 'The Wealth Architect',
      description: 'Master asymmetric leverage, long-term compounding, and independent value.',
      bookIds: ['richest-man-in-babylon', 'the-science-of-getting-rich'],
      badge: 'Wealth',
    },
    {
      id: 'col-4',
      title: 'Self-Reliance & Sovereign Will',
      description: 'Cast off imitation, crowd validation, and manufactured conformity.',
      bookIds: ['self-reliance-emerson', 'art-of-war-sun-tzu'],
      badge: 'Mindset',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCuratedCollections([
      ...curatedCollections,
      {
        id: `col-${Date.now()}`,
        title: newTitle.trim(),
        description: newDesc.trim() || 'Custom scholar collection',
        bookIds: [books[0]?.id || 'meditations-marcus-aurelius'],
        badge: 'Custom',
      },
    ]);

    confetti({ particleCount: 30, spread: 50 });
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-emerald-950/40 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Curated Collections
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Carefully assembled reading pathways and personalized intellectual syllabi.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-emerald-950/50 hover:bg-emerald-400"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Grid of Collections */}
      <div className="space-y-8">
        {curatedCollections.map((col) => {
          const collectionBooks = books.filter((b) => col.bookIds.includes(b.id));

          return (
            <div
              key={col.id}
              className="rounded-3xl border border-emerald-950/80 bg-[#080d0a] p-6 sm:p-8"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/40">
                      {col.badge}
                    </span>
                    <span className="text-xs text-stone-500">{collectionBooks.length} Titles</span>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-white">{col.title}</h3>
                  <p className="mt-1 text-xs text-stone-400">{col.description}</p>
                </div>
              </div>

              {/* Books inside this collection */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {collectionBooks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openBookDetails(b.id)}
                    className="group cursor-pointer rounded-2xl border border-stone-800/70 bg-[#09110d] p-3 transition-all hover:border-emerald-700/60 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-stone-800">
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h4 className="mt-2.5 font-serif text-xs font-bold text-stone-200 line-clamp-1 group-hover:text-emerald-300">
                      {b.title}
                    </h4>
                    <p className="text-[10px] text-stone-500 truncate">{b.author}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-900/60 bg-[#070c09] p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white mb-2">Create Custom Collection</h3>
            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Collection Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Morning Mindset Syllabus"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-white outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is the objective of this reading collection?"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-white outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-stone-800 px-4 py-2 text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
