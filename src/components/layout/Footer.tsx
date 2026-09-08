import React, { useState } from 'react';
import {
  BookOpen,
  Mail,
  Send,
  CheckCircle2,
  X,
  Sparkles,
  Globe,
  ExternalLink
} from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onSelectCategory?: (category: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const [activeModal, setActiveModal] = useState<
    'vision' | 'volunteer' | 'partner' | 'careers' | 'blog' | 'terms' | 'donate' |
    'dev' | 'api' | 'dumps' | 'bots' | 'help' | 'contact' | 'suggest' | 'addbook' | 'release' | null
  >(null);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('हिंदी');

  // Close modals on Escape key
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setActiveModal(null);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const languages = [
    'العربية',
    'Čeština',
    'Deutsch',
    'English',
    'Español',
    'Français',
    'हिंदी',
    'Hrvatski',
    'Italiano',
    '한국어',
    'Português',
    'Română',
    'Sardu',
    'తెలుగు',
    'Українська',
    '中文',
    'Filipino'
  ];

  return (
    <>
      {/* Open Library / MindRise Classic Paper Footer (Matching Image 3) */}
      <footer className="border-t border-[#D8D4CA] bg-[#EAE6DF] text-[#1E3A8A] pt-12 pb-14 px-6 md:px-12 font-sans select-none text-[13px]">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5 lg:gap-10">
            {/* Column 1: Open Library / MindRise */}
            <div>
              <h3 className="font-serif font-bold text-[#1A1A1A] text-sm mb-3.5 tracking-tight">
                Open Library
              </h3>
              <ul className="space-y-2 text-[#1E3A8A]">
                <li>
                  <button onClick={() => setActiveModal('vision')} className="hover:underline text-left">
                    Vision
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('volunteer')} className="hover:underline text-left">
                    Volunteer
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('partner')} className="hover:underline text-left">
                    Partner With Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('careers')} className="hover:underline text-left">
                    Careers
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('blog')} className="hover:underline text-left">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('terms')} className="hover:underline text-left">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('donate')} className="hover:underline text-left font-medium text-amber-900">
                    Donate
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Discover */}
            <div>
              <h3 className="font-serif font-bold text-[#1A1A1A] text-sm mb-3.5 tracking-tight">
                Discover
              </h3>
              <ul className="space-y-2 text-[#1E3A8A]">
                <li>
                  <button onClick={() => { setActiveTab('home'); scrollToTop(); }} className="hover:underline text-left">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('explore'); scrollToTop(); }} className="hover:underline text-left">
                    Books
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('explore'); scrollToTop(); }} className="hover:underline text-left">
                    Authors
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('categories'); scrollToTop(); }} className="hover:underline text-left">
                    Subjects
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('collections'); scrollToTop(); }} className="hover:underline text-left">
                    Collections
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('explore'); scrollToTop(); }} className="hover:underline text-left">
                    Advanced Search
                  </button>
                </li>
                <li>
                  <button onClick={scrollToTop} className="hover:underline text-left font-medium">
                    Return to Top
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Develop */}
            <div>
              <h3 className="font-serif font-bold text-[#1A1A1A] text-sm mb-3.5 tracking-tight">
                Develop
              </h3>
              <ul className="space-y-2 text-[#1E3A8A]">
                <li>
                  <button onClick={() => setActiveModal('dev')} className="hover:underline text-left">
                    Developer Center
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('api')} className="hover:underline text-left">
                    API Documentation
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('dumps')} className="hover:underline text-left">
                    Bulk Data Dumps
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('bots')} className="hover:underline text-left">
                    Writing Bots
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Help */}
            <div>
              <h3 className="font-serif font-bold text-[#1A1A1A] text-sm mb-3.5 tracking-tight">
                Help
              </h3>
              <ul className="space-y-2 text-[#1E3A8A]">
                <li>
                  <button onClick={() => setActiveModal('help')} className="hover:underline text-left">
                    Help Center
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('contact')} className="hover:underline text-left font-bold text-[#1A1A1A] bg-[#DFDAD0] px-2 py-0.5 rounded">
                    Contact Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('suggest')} className="hover:underline text-left">
                    Suggesting Edits
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('addbook')} className="hover:underline text-left">
                    Add a Book
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveModal('release')} className="hover:underline text-left">
                    Release Notes
                  </button>
                </li>
              </ul>

              {/* Social Icons Box (Matching Image 3) */}
              <div className="mt-4 flex items-center gap-1">
                {/* Butterfly / Bluesky Icon */}
                <a
                  href="https://bsky.app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#403B32] text-[#EAE6DF] hover:bg-black transition-colors"
                  title="Bluesky"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566 1.01 1.5 1.767 1.5 3.322c0 1.258.685 8.163 1.135 9.684 1.11 3.754 5.12 5.034 8.365 4.094-4.82 2.015-7.79 5.865-4.43 9.4 4.54 4.777 9.43-.8 11.43-5.2 2 4.4 6.89 9.977 11.43 5.2 3.36-3.535.39-7.385-4.43-9.4 3.245.94 7.255-.34 8.365-4.094.45-1.52 1.135-8.426 1.135-9.684 0-1.555-1.066-2.312-3.702-.517C16.046 4.747 13.087 8.686 12 10.8z"/>
                  </svg>
                </a>
                {/* X / Twitter Icon */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#403B32] text-[#EAE6DF] hover:bg-black transition-colors"
                  title="X (Twitter)"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* GitHub Icon */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded bg-[#403B32] text-[#EAE6DF] hover:bg-black transition-colors"
                  title="GitHub"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 5: Change Website Language */}
            <div>
              <h3 className="font-serif font-bold text-[#1A1A1A] text-sm mb-3.5 tracking-tight">
                Change Website Language
              </h3>
              <ul className="space-y-1 text-[#1E3A8A] max-h-56 overflow-y-auto pr-1">
                {languages.map((lang) => (
                  <li key={lang}>
                    <button
                      onClick={() => setSelectedLanguage(lang)}
                      className={`hover:underline text-left text-xs ${
                        selectedLanguage === lang
                          ? 'font-bold text-[#1A1A1A] bg-[#DFDAD0] px-1.5 py-0.5 rounded'
                          : 'text-[#1E3A8A]'
                      }`}
                    >
                      {lang}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Copyright and Open Access statement */}
          <div className="mt-12 pt-6 border-t border-[#D8D4CA] flex flex-col sm:flex-row items-center justify-between text-xs text-[#555] gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#1A1A1A]">MindRise Open Library</span>
              <span>— Universal Open Sanctuary with 8.5 Million+ Books Across All Languages. Free Forever.</span>
            </div>
            <div className="text-[11px] font-mono text-[#777]">
              Crafted for Lifelong Scholars & Readers
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      {/* 1. Contact Us Modal */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#FAF8F5] p-6 shadow-2xl border border-[#D8D4CA] text-[#1A1A1A] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold">Contact MindRise & Open Library</h3>
                <p className="text-xs text-[#666]">We value feedback, book suggestions, and partnerships.</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-full p-1.5 text-[#666] hover:bg-[#E5E2DA] hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {contactSent ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                <h4 className="font-serif text-base font-bold">Message Received!</h4>
                <p className="mt-1 text-xs text-[#666]">
                  Dhanyawad! Our editorial and support team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="mt-4 space-y-3.5 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-[#444] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444] mb-1">Subject</label>
                  <select
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-hidden"
                  >
                    <option>General Inquiry</option>
                    <option>Suggest a New Hindi Book / Author</option>
                    <option>Audio Narration Quality Feedback</option>
                    <option>Open Source Partnership / Donation</option>
                    <option>Report Typo or Content Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444] mb-1">Message</label>
                  <textarea
                    required
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Write your thoughts, questions, or book recommendations..."
                    className="w-full rounded-xl border border-[#D8D4CA] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E2DA]">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#E5E2DA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-5 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#333] transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. Generic Information Modals (Vision, Volunteer, Donate, API, etc.) */}
      {activeModal && activeModal !== 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[#FAF8F5] p-6 shadow-2xl border border-[#D8D4CA] text-[#1A1A1A] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E5E2DA] pb-3">
              <h3 className="font-serif text-lg font-bold capitalize">
                {activeModal === 'vision' && 'Our Open Knowledge Vision'}
                {activeModal === 'volunteer' && 'Volunteer & Contribute'}
                {activeModal === 'partner' && 'Partner With MindRise'}
                {activeModal === 'careers' && 'Careers at MindRise'}
                {activeModal === 'blog' && 'MindRise Literary Dispatch'}
                {activeModal === 'terms' && 'Open Access & Terms of Service'}
                {activeModal === 'donate' && 'Support the Open Archive'}
                {activeModal === 'dev' && 'Developer Center'}
                {activeModal === 'api' && 'API Documentation'}
                {activeModal === 'dumps' && 'Bulk Data Dumps'}
                {activeModal === 'bots' && 'Writing Bots & Integrations'}
                {activeModal === 'help' && 'Help Center & Guides'}
                {activeModal === 'suggest' && 'Suggesting Edits & Proofreading'}
                {activeModal === 'addbook' && 'Add an Open-Source Book'}
                {activeModal === 'release' && 'Platform Release Notes'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-full p-1.5 text-[#666] hover:bg-[#E5E2DA] hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 text-xs leading-relaxed text-[#444] space-y-3 font-sans">
              {activeModal === 'vision' && (
                <>
                  <p>
                    <strong>MindRise</strong> is dedicated to creating a universal, open-access digital sanctuary with over 8.5 Million+ books spanning world literature, science, philosophy, history, and personal growth traditions across all languages.
                  </p>
                  <p>
                    We believe timeless masterworks by thinkers from every culture — from Marcus Aurelius to Munshi Premchand, Shakespeare to Swami Vivekananda, and Einstein to Chanakya — must be freely available to every student, reader, and seeker with distraction-free reading, audio narration, and AI insights.
                  </p>
                </>
              )}

              {activeModal === 'donate' && (
                <>
                  <p>
                    MindRise is a non-profit open-source initiative. Your support helps us digitize and preserve rare Hindi manuscripts, maintain low-latency audio servers, and build free Query Bot learning tools for all.
                  </p>
                  <div className="rounded-xl bg-[#EFECE6] p-3 text-center border border-[#D8D4CA]">
                    <p className="font-semibold text-sm text-[#1A1A1A]">UPI / Open Grant ID: <code className="font-mono">openlibrary@mindrise</code></p>
                  </div>
                </>
              )}

              {activeModal === 'addbook' && (
                <>
                  <p>
                    Have a public domain or open-access Hindi book or translation? You can submit texts, markdown chapters, or OCR scans directly to our editorial review team.
                  </p>
                  <button
                    onClick={() => { setActiveModal('contact'); }}
                    className="rounded-xl bg-[#1A1A1A] text-white px-4 py-2 text-xs font-semibold"
                  >
                    Submit Book Proposal
                  </button>
                </>
              )}

              {['dev', 'api', 'dumps', 'bots'].includes(activeModal) && (
                <>
                  <p>
                    The MindRise 500 Hindi Books dataset is open for non-commercial educational use. Developers can access JSON endpoints for book metadata, chapter indexes, and full text.
                  </p>
                  <p className="font-mono text-[11px] bg-white p-2 rounded border border-[#D8D4CA]">
                    GET /api/v1/hindi-books (500 Records in JSON)
                  </p>
                </>
              )}

              {!['vision', 'donate', 'addbook', 'dev', 'api', 'dumps', 'bots'].includes(activeModal) && (
                <p>
                  MindRise Open Library is updated continuously. For questions, suggestions, or editorial corrections, please use our Contact Us form.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#333]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
