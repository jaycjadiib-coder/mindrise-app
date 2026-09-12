import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Plus,
  Sparkles,
  BookOpen,
  Send,
  CheckCircle2,
  TrendingUp,
  Flame,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

import { BackButton } from '../common/BackButton';

interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

interface Post {
  id: string;
  author: string;
  authorAvatar: string;
  badge: string;
  city?: string;
  bookTitle: string;
  chapter: string;
  content: string;
  likes: number;
  comments: Comment[];
  timestamp: string;
  isLiked?: boolean;
}

interface CommunityViewProps {
  onBack?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { books } = useData();

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'post-1',
      author: 'आरव शर्मा (Aarav Sharma)',
      authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
      badge: 'साहित्य अनुरागी',
      city: 'वाराणसी (Varanasi)',
      bookTitle: 'गोदान (Godan)',
      chapter: 'होरी का संघर्ष एवं सामाजिक यथार्थ',
      content:
        '“होरी की त्रासदी केवल एक किसान की नहीं, बल्कि हर उस व्यक्ति की है जो ईमानदारी और मर्यादा की रक्षा करते हुए जीवन से जूझता है।” प्रेमचंद जी का यह कालजयी उपन्यास आज भी ग्रामीण भारत और मानवीय संवेदनाओं का सबसे प्रामाणिक दस्तावेज है। क्या आज के युग में भी होरी जैसे चरित्र हमारे आसपास नहीं हैं?',
      likes: 89,
      comments: [
        {
          id: 'c1',
          author: 'प्रिया पटेल (Priya Patel)',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          content: 'बिल्कुल सही आरव जी! गोबर का शहर जाना और होरी का गाँव में संघर्ष—यह आज के माइग्रेशन संकट का भी सटीक चित्रण है।',
          timestamp: '1 hour ago'
        },
        {
          id: 'c2',
          author: 'रोहन वर्मा (Rohan Verma)',
          authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
          content: 'प्रेमचंद की भाषा शैली इतनी सहज और मर्मस्पर्शी है कि पाठक स्वयं को कहानी का हिस्सा महसूस करता है।',
          timestamp: '30 mins ago'
        }
      ],
      timestamp: '2 hours ago',
      isLiked: true,
    },
    {
      id: 'post-2',
      author: 'नेहा देशमुख (Neha Deshmukh)',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
      badge: 'गीता स्वाध्यायी',
      city: 'पुणे (Pune)',
      bookTitle: 'श्रीमद्भगवद्गीता (Bhagavad Gita)',
      chapter: 'अध्याय 2, श्लोक 47 (कर्मयोग)',
      content:
        '“कर्मण्येवाधिकारस्ते मा फलेषु कदाचन...” जब हम फल की चिंता छोड़कर केवल अपने प्रयास की गुणवत्ता (Quality of Action) पर ध्यान केंद्रित करते हैं, तो 90% मानसिक तनाव स्वतः समाप्त हो जाता है। आधुनिक वर्कप्लेस और प्रतियोगी परीक्षाओं में यह श्लोक सबसे बड़ा जीवन-मंत्र है।',
      likes: 142,
      comments: [
        {
          id: 'c3',
          author: 'विक्रमादित्य अय्यर (Vikramaditya Iyer)',
          authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
          content: 'स्वामी विवेकानंद जी ने भी इसी बात पर बल दिया था कि अनासक्त कर्म ही सर्वोच्च आध्यात्मिक और व्यावहारिक शक्ति है।',
          timestamp: '3 hours ago'
        }
      ],
      timestamp: '4 hours ago',
    },
    {
      id: 'post-3',
      author: 'कबीर मेहता (Kabir Mehta)',
      authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
      badge: 'राष्ट्र-चिंतक',
      city: 'नई दिल्ली (New Delhi)',
      bookTitle: 'रश्मिरथी (Rashmirathi)',
      chapter: 'तृतीय सर्ग: कृष्ण की चेतावनी',
      content:
        '“हित-वचन नहीं तूने माना, मैत्री का मूल्य न पहचाना, तो ले, मैं भी अब जाता हूँ, अन्तिम संकल्प सुनाता हूँ। याचना नहीं, अब रण होगा, जीवन-जय या कि मरण होगा!”\nदिनकर जी की यह पंक्तियाँ जब भी पढ़ता हूँ, रोंगटे खड़े हो जाते हैं। आत्मसम्मान और न्याय के लिए दिनकर की ओजस्वी वाणी अमर है।',
      likes: 215,
      comments: [
        {
          id: 'c4',
          author: 'अनन्या गुप्ता (Ananya Gupta)',
          authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
          content: 'दिनकर जी का रश्मिरथी कर्ण के चरित्र को जिस गरिमा के साथ प्रस्तुत करता है, वह विश्व साहित्य में अद्वितीय है!',
          timestamp: 'Yesterday'
        }
      ],
      timestamp: '6 hours ago',
      isLiked: true,
    },
    {
      id: 'post-4',
      author: 'राजेश्वरी देवी (Rajeshwari Devi)',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
      badge: 'प्रेरणा साधक',
      city: 'जयपुर (Jaipur)',
      bookTitle: 'अग्नि की उड़ान (Wings of Fire)',
      chapter: 'सपनों की शक्ति एवं अनुशासन',
      content:
        'डॉ. एपीजे अब्दुल कलाम का जीवन संदेश: "सपने वो नहीं जो हम सोते हुए देखते हैं, सपने वो हैं जो हमें सोने नहीं देते।" एक छोटे से शहर रामेश्वरम से भारत के मिसाइल मैन बनने की उनकी यात्रा हर भारतीय युवा के लिए अदम्य साहस का स्रोत है।',
      likes: 178,
      comments: [],
      timestamp: 'Yesterday',
    }
  ]);

  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedBook, setSelectedBook] = useState(books[0]?.title || 'गोदान (Godan)');
  const [postContent, setPostContent] = useState('');
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const clubs = [
    {
      name: 'कालजयी हिंदी साहित्य मंडल',
      subtitle: 'Premchand, Dinkar, Harivansh Rai Bachchan & Kabir Circle',
      topic: 'गोदान, रश्मिरथी, कुरुक्षेत्र व मधुशाला पर स्वाध्याय व समीक्षा',
      members: 1840,
      badge: 'साहित्य',
      activeNow: 48
    },
    {
      name: 'Vedic Wisdom & Gita Swadhyay Mandal',
      subtitle: 'श्रीमद्भगवद्गीता, उपनिषद् और योगसूत्र विचार गोष्ठी',
      topic: 'दैनिक श्लोक चिंतन, कर्मयोग व ध्यान साधना विमर्श',
      members: 2450,
      badge: 'स्वाध्याय',
      activeNow: 76
    },
    {
      name: 'Indian Mindset & Leadership Guild',
      subtitle: 'APJ Abdul Kalam, Vivekananda, Chanakya Neeti',
      topic: 'चाणक्य नीति, कर्मयोग, आधुनिक भारतीय नेतृत्व और उत्पादकता',
      members: 1290,
      badge: 'नेतृत्व',
      activeNow: 32
    },
    {
      name: 'UPSC & Philosophy Readers Circle',
      subtitle: 'भारतीय दर्शन, न्याय, नीतिशास्त्र और इतिहास विमर्श',
      topic: 'प्राचीन भारतीय राज्यशास्त्र, कौटिल्य अर्थशास्त्र और दर्शनशास्त्र',
      members: 960,
      badge: 'दर्शन',
      activeNow: 19
    }
  ];

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    if (!newCommentText.trim()) return;

    const newC: Comment = {
      id: `c-${Date.now()}`,
      author: user?.name || 'भारतीय स्वाध्यायी (Indian Scholar)',
      authorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      content: newCommentText.trim(),
      timestamp: 'Just now'
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, newC]
          };
        }
        return p;
      })
    );

    setNewCommentText('');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const newP: Post = {
      id: `p-${Date.now()}`,
      author: user?.name || 'भारतीय स्वाध्यायी (Indian Scholar)',
      authorAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      badge: 'स्वाध्यायी मित्र',
      city: 'भारत (India)',
      bookTitle: selectedBook,
      chapter: 'स्वाध्याय विचार एवं चिंतन',
      content: postContent.trim(),
      likes: 1,
      comments: [],
      timestamp: 'Just now',
      isLiked: true,
    };

    setPosts([newP, ...posts]);
    setPostContent('');
    setShowNewPost(false);
    confetti({ particleCount: 35, spread: 50 });
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 dark:border-stone-800 pb-6 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 px-3 py-0.5 text-[10px] font-mono font-semibold">
                BHARAT SCHOLARS CIRCLE • 6,500+ READERS
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">
              Community & Book Clubs (भारतीय स्वाध्याय समाज)
            </h1>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              हिंदी साहित्य, दर्शनशास्त्र और ज्ञान-साधना में लीन स्वाध्यायियों का विचार मंच। अपने विचार साझा करें।
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black px-4 py-2.5 text-xs font-semibold shadow-md transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>नया विचार साझा करें (Share Reflection)</span>
        </button>
      </div>

      {/* Featured Clubs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
            सक्रिय स्वाध्याय मंडल (Active Reading Tribes)
          </h2>
          <span className="text-xs text-stone-500 font-mono">4 Featured Clubs</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {clubs.map((club) => (
            <div
              key={club.name}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-4 transition-all hover:shadow-md dark:hover:border-amber-700/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40">
                    {club.badge}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {club.activeNow} online
                  </span>
                </div>
                <h4 className="mt-3 font-serif text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {club.name}
                </h4>
                <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                  {club.subtitle}
                </p>
                <p className="mt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {club.topic}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-mono">{club.members.toLocaleString()} सदस्य</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400 cursor-pointer hover:underline">
                  Join Circle
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Feed */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
          ताज़ा स्वाध्याय विमर्श (Scholarly Discussions)
        </h2>

        <div className="space-y-5">
          {(posts || []).map((post) => (
            <div
              key={post.id}
              className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-6 text-xs transition-all shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="h-11 w-11 rounded-full object-cover border-2 border-amber-600/40"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {post.author}
                      </span>
                      <span className="rounded bg-amber-500/10 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-300 border border-amber-500/30">
                        {post.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                      {post.city && <span>📍 {post.city}</span>}
                      <span>• {post.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="self-start sm:self-center rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 px-3 py-1 text-[11px] text-stone-600 dark:text-stone-300">
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">{post.bookTitle}</span> • {post.chapter}
                </div>
              </div>

              <p className="mt-4 font-serif text-sm leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line">
                {post.content}
              </p>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-between border-t border-stone-100 dark:border-stone-800/80 pt-3 text-stone-600 dark:text-stone-400">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    post.isLiked ? 'text-rose-600 font-semibold' : 'hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{post.likes} प्रेरणा</span>
                </button>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments.length} टिप्पणियाँ (Comments)</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`"${post.content}" — ${post.author}`);
                      confetti({ particleCount: 15, spread: 30 });
                    }}
                    className="hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                    title="Share quote"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {openCommentsPostId === post.id && (
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                  <div className="space-y-2.5">
                    {post.comments.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic">No comments yet. Be the first to share your view!</p>
                    ) : (
                      post.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 p-3">
                          <img
                            src={comment.authorAvatar}
                            alt={comment.author}
                            className="h-7 w-7 rounded-full object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-stone-900 dark:text-stone-200 text-xs">
                                {comment.author}
                              </span>
                              <span className="text-[10px] text-stone-400">{comment.timestamp}</span>
                            </div>
                            <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 leading-snug">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment input */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      placeholder="Write your insightful thought..."
                      className="flex-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2 text-xs text-stone-900 dark:text-white outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="rounded-xl bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black p-2 hover:scale-105 transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1310] p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white mb-2">
              भारतीय स्वाध्याय समाज में विचार साझा करें
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              किसी पुस्तक के अध्याय, श्लोक या जीवन दर्शन पर अपने विचार लिखें।
            </p>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">पुस्तक का चयन (Select Book)</label>
                <select
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-2.5 text-stone-900 dark:text-white outline-none"
                >
                  {(books || []).slice(0, 30).map((b) => (
                    <option key={b.id} value={b.title}>
                      {b.title} — {b.author}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 mb-1 font-semibold">आपका चिंतन व विचार (Your Reflection) *</label>
                <textarea
                  rows={5}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="इस पुस्तक के किस विचार ने आपको गहराई से प्रभावित किया? अपने विचार या प्रश्न लिखें..."
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-3 text-stone-900 dark:text-white outline-none focus:border-amber-500 font-serif text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPost(false)}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1A1A1A] text-white dark:bg-amber-500 dark:text-black px-5 py-2 font-semibold hover:scale-105 transition"
                >
                  प्रकाशित करें (Publish)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
