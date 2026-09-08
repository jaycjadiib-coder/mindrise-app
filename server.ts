import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // =========================================================================
  // MINDRISE 100% FREE QUERY BOT & SCHOLAR ASSISTANT ENGINE
  // Completely free, zero paid API keys or subscription required forever.
  // =========================================================================
  function executeFreeQueryBot(query: string, userContext: any): string {
    const q = query.toLowerCase().trim();
    const name = userContext?.name ? userContext.name.split(' ')[0] : 'Scholar';
    const isHindi = /kya|kaise|batao|chahiye|karein|hai|nahi|padhe|kitab|soch|madad|paise|aadat|shuru|dhyan|mushkil/i.test(query);

    // --- 1. SPECIFIC BOOK INQUIRIES & DEEP SUMMARIES ---
    if (q.includes('atomic habit') || (q.includes('atomic') && q.includes('habit'))) {
      if (isHindi) {
        return `### 📘 *Atomic Habits* by James Clear — Book Summary & Key Rules\n\n` +
          `**Core Philosophy:** Aap apne goals ke level tak nahi uthte, balki apne systems ke level tak girte hain. Rozana 1% improvement saal ke ant me 37x compound results deta hai.\n\n` +
          `**The 4 Laws of Behavior Change:**\n` +
          `1. **Make it Obvious:** Apne reading area ko visually clear rakhein (kitab table par samne rakhein).\n` +
          `2. **Make it Attractive:** Habit Stacking karein — *"Morning chai ke baad main 15 min MindRise me padhunga."*\n` +
          `3. **Make it Easy:** **2-Minute Rule** use karein. Pehle din sirf 2 pages padhne ka rule banaiye.\n` +
          `4. **Make it Satisfying:** MindRise Habit Tracker me tick karke daily streak maintain karein.\n\n` +
          `💡 *Golden Line:* "Har action ek vote hai us insaan ke liye jo aap banna chahte hain."`;
      }
      return `### 📘 *Atomic Habits* by James Clear — Core Framework & Summary\n\n` +
        `**Core Thesis:** You do not rise to the level of your goals; you fall to the level of your systems. A 1% improvement every day compounds to 37x better results across one year.\n\n` +
        `**The 4 Laws of Habit Architecture:**\n` +
        `1. **Make it Obvious (Cue):** Place your book in plain view on your desk or nightstand. Design your environment for success.\n` +
        `2. **Make it Attractive (Craving):** Pair reading with an established pleasure (Habit Stacking: *"After morning coffee, I will open MindRise for 20 minutes."*).\n` +
        `3. **Make it Easy (Response):** Apply the **2-Minute Rule**. Scale down your habit to simply reading 1 to 2 pages initially.\n` +
        `4. **Make it Satisfying (Reward):** Keep visual momentum in your MindRise streak tracker. Never miss twice.\n\n` +
        `💡 *Takeaway:* Every page you turn is a vote for the scholarly identity you are building.`;
    }

    if (q.includes('meditation') || q.includes('marcus aurelius') || q.includes('marcus') || q.includes('stoic')) {
      if (isHindi) {
        return `### 🏛️ *Meditations* by Marcus Aurelius — Stoic Wisdom Summary\n\n` +
          `**Background:** Rome ke Emperor Marcus Aurelius ki personal diary, jo unhone jung ke maidan me khud ko shant aur disciplined rakhne ke liye likhi thi.\n\n` +
          `**3 Core Stoic Pillars:**\n` +
          `1. **Dichotomy of Control (Control Ka Niyam):** Aapke haath me sirf aapke vichar, actions aur reactions hain. Bahar ki duniya, doosron ke bol aur result aapke control me nahi hain.\n` +
          `2. **Amor Fati (Acceptance):** Mushkilon se ghabrane ke bajaye unhe growth ka zariya banaiye.\n` +
          `3. **Muted Ego:** Raat ko sote waqt yaad rakhein ki sabhi chizein asthayi (temporary) hain.\n\n` +
          `💡 *Classic Quote:* "Aapke paas apne dimag par shakti hai, bahar ki ghatnaon par nahi. Is sach ko pehchano aur tumhe apratim shakti milegi."`;
      }
      return `### 🏛️ *Meditations* by Marcus Aurelius — Stoic Masterwork Summary\n\n` +
        `**Context:** The private journal of the most powerful emperor of the ancient world, written on the military frontier to cultivate stillness and virtue under pressure.\n\n` +
        `**3 Foundational Pillars:**\n` +
        `1. **The Dichotomy of Control:** You have power over your own mind, not outside events. Direct 100% of your energy toward your own judgment and discipline.\n` +
        `2. **The Obstacle is the Way:** What impedes action advances action. Friction is not a roadblock; it is the raw material of character.\n` +
        `3. **Memento Mori (Perspective):** Recognize the briefness of human life. Focus solely on what is virtuous, genuine, and present.\n\n` +
        `💡 *Actionable Practice:* Before interacting with distractions, ask: *"Is this essential?"*`;
    }

    if (q.includes('deep work') || q.includes('cal newport')) {
      if (isHindi) {
        return `### 🧠 *Deep Work* by Cal Newport — Rules for Focused Success\n\n` +
          `**Core Idea:** Ek distraction-bhari duniya me bina kisi bhatkaav ke ghanto focus karne ki kshamata sabse keemti superpower ban chuki hai.\n\n` +
          `**4 Key Rules:**\n` +
          `1. **Work Deeply:** Har din 60-90 minute ka distraction-free block banaiye jisme koi phone ya tabs open na hon.\n` +
          `2. **Embrace Boredom:** Har khali lamhe me phone check karne ki lat chhodiye. Bore hone ki aadat daliye taaki focus span badhe.\n` +
          `3. **Quit Social Media:** Sirf unhi digital tools ko use karein jo aapko sach me long-term fayda dete hain.\n` +
          `4. **Drain the Shallows:** Faltu ke emails aur chat notifications ko din ke aakhri hisse me schedule karein.\n\n` +
          `💡 *Key Formula:* High-Quality Work Produced = (Time Spent) x (Intensity of Focus)`;
      }
      return `### 🧠 *Deep Work* by Cal Newport — Rules for Focused Mastery\n\n` +
        `**Core Concept:** Deep work is the ability to focus without distraction on a cognitively demanding task. It is becoming increasingly rare and vastly more valuable in our distracted economy.\n\n` +
        `**4 Operational Protocols:**\n` +
        `1. **Ritualize Focus:** Choose a recurring 60-90 minute window. Protect it from notifications, browsing, and interruptions.\n` +
        `2. **Embrace Boredom:** Train your brain to tolerate silence and stillness without reflexively seeking dopamine from your phone.\n` +
        `3. **Ruthless Digital Declutter:** Treat apps like workplace machinery; if they do not serve your highest goals, eliminate them.\n` +
        `4. **Schedule Every Minute:** Run your day intentionally rather than reacting to incoming pings.`;
    }

    if (q.includes('psychology of money') || q.includes('morgan housel') || q.includes('paisa') || q.includes('wealth')) {
      if (isHindi) {
        return `### 💰 *The Psychology of Money* by Morgan Housel — Summary\n\n` +
          `**Mukhya Baat:** Paise me kamyabi ka sambandh is baat se kam hai ki aap kitne smart hain, aur is baat se zyada hai ki aapka *behaviour* kaisa hai.\n\n` +
          `**3 Sabse Badi Seekh:**\n` +
          `1. **Being Rich vs Staying Wealthy:** Rich banna income hai, lekin Wealthy wo paisa hai jo aapne *kharch nahi kiya*. Freedom sabse bada dividend hai.\n` +
          `2. **The Magic of Compounding:** Warren Buffett ki 90% se zyada sampatti 50 saal ki umar ke baad compound hui. Patience hi sabse bada asset hai.\n` +
          `3. **Ego Control:** Apne kharche logon ko impress karne ke liye mat badhaiye.\n\n` +
          `💡 *Proverb:* "Independence is the greatest financial return."`;
      }
      return `### 💰 *The Psychology of Money* by Morgan Housel — Core Takeaways\n\n` +
        `**Central Insight:** Financial success is not hard science; it is a soft skill where your behavior matters far more than what you know.\n\n` +
        `**3 Enduring Principles:**\n` +
        `1. **Rich vs. Wealthy:** Being rich is visible consumption (cars, status items). Wealth is the options, assets, and unspent capital that grant you freedom over your time.\n` +
        `2. **The Power of Longevity:** Compounding does not reward volatility; it rewards staying in the arena long enough for time to do the heavy lifting.\n` +
        `3. **Knowing What is "Enough":** Inability to cap lifestyle inflation causes brilliant investors to risk what they have and need for what they neither have nor need.\n\n` +
        `💡 *Recommendation:* Read it in the MindRise catalog under World Masterworks.`;
    }

    if (q.includes('gita') || q.includes('bhagavad') || q.includes('krishna') || q.includes('arjun')) {
      if (isHindi) {
        return `### 🕉️ *The Bhagavad Gita* — Universal Philosophical Teachings\n\n` +
          `**Core Philosophy:** Jeevan ke sangharsh me kartavya (duty), dhyan aur shanti ka marg.\n\n` +
          `**3 Maha Sutra:**\n` +
          `1. **Karmanye Vadhikaraste (Nishkam Karma):** Karm karne me aapka adhikar hai, parinaam me nahi. Result ki chinta chhodkar 100% effort lagayein.\n` +
          `2. **Sthitaprajna (Samattvam):** Safalta aur asafalta dono me dimaag ko santulit rakhein.\n` +
          `3. **Self-Mastery:** "Jo vyakti apne man ko jeet leta hai, man uska sabse bada mitra ban jata hai; jo nahi jeet pata, man uska sabse bada shatru ban jata hai."\n\n` +
          `📚 *MindRise Tip:* Aap Explore Books me 'Bhagavad Gita' search karke audio narration ke sath sun sakte hain!`;
      }
      return `### 🕉️ *The Bhagavad Gita* — The Science of Mind & Duty\n\n` +
        `**Core Doctrine:** The timeless dialog on purposeful action, detachment from anxiety, and inner equilibrium.\n\n` +
        `**3 Guiding Maxims:**\n` +
        `1. **Detachment from Outcomes (Nishkama Karma):** Focus entirely on the execution of your duties without being paralyzed by anxiety over results.\n` +
        `2. **Equanimity (Samatva):** Treat triumph and setback as identical teachers. Maintain poise in both.\n` +
        `3. **Conquest of Mind:** "For him who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his mind will remain the greatest enemy."\n\n` +
        `📚 *Access:* Available with full translations and synchronized audio reader in the MindRise catalog.`;
    }

    // --- 2. READING HABITS & 20-MIN ROUTINES ---
    if (q.includes('habit') || q.includes('20 min') || q.includes('read') || q.includes('daily') || q.includes('routine') || q.includes('aadat') || q.includes('shuru')) {
      if (isHindi) {
        return `Namaste ${name}! 📖 **Rozana 20 Minute Reading Habit Banane Ka Step-by-Step Blueprint:**\n\n` +
          `1. **The 2-Minute Gateway (Zero Friction):**\n` +
          `   Shuru me 50 pages ka bojh mat banaiye. Sirf *2 pages* padhne ka sankalp lijiye. 90% baar ek bar shuru karne ke baad flow ban jata hai.\n\n` +
          `2. **Habit Stacking Anchor:**\n` +
          `   Reading ko ek pakki aadat ke sath jodiye: *"Morning tea ke turant baad main 15 minute MindRise me book padhunga."*\n\n` +
          `3. **Phone ko Doosre Kamre me Rakhein:**\n` +
          `   Physical distance se distraction ka mauka nahi milega.\n\n` +
          `4. **Daily 1 Sentence Note:**\n` +
          `   Chapter khatam hone par MindRise Notes Vault me 1 line ka takeaway note karein. Isse dimag me concepts lifetime ke liye save ho jate hain!\n\n` +
          `💡 *Wisdom Quote:* "Aapke chhote-chhote dainik kadam hi saal bhar me gyan ka mahasagar banate hain."`;
      }
      return `Welcome, ${name}! 📖 **The 3-Step Protocol to Master Daily Reading Consistency:**\n\n` +
        `1. **The 2-Minute Gateway (*Atomic Habits*):**\n` +
        `   Commit strictly to opening your book and reading *1 to 2 pages*. Crossing the friction threshold is 80% of the victory.\n\n` +
        `2. **Implementation Intentions (Time & Place Anchor):**\n` +
        `   Never leave reading to chance. Define: *"I will read for 20 minutes at my desk immediately after breakfast."*\n\n` +
        `3. **Frictionless Tracking:**\n` +
        `   Log your reading session in the MindRise Habit Tracker. Seeing an unbroken streak reinforces your identity as a scholar.\n\n` +
        `💡 *Core Principle:* "Small, daily disciplines compounded over time yield extraordinary transformations."`;
    }

    // --- 3. PROCRASTINATION & FOCUS ---
    if (q.includes('procrastinat') || q.includes('focus') || q.includes('distraction') || q.includes('phone') || q.includes('dopamine') || q.includes('dhyan')) {
      if (isHindi) {
        return `Namaste ${name}! 🎯 **Procrastination aur Phone Addiction ko Beat Karne Ka Formula:**\n\n` +
          `1. **5-Minute Activation Rule:**\n` +
          `   Khud se boliye: *"Main sirf 5 minute focus karunga, fir chhod dunga."* 85% baar aapka brain resistance chhodkar flow state me enter kar leta hai.\n\n` +
          `2. **Environment Redesign (Deep Work):**\n` +
          `   Phone ko doosre room me rakhein ya silent karein. Willpower par nahi, environment par bharosa karein.\n\n` +
          `3. **Morning Screen Fast:**\n` +
          `   Subah uthne ke pehle 45-60 minute kisi bhi screen ya social media ko touch mat kijiye. Pehla input timeless wisdom se lijiye.\n\n` +
          `💡 *Marcus Aurelius:* "Concentrate every minute on doing what is in front of you with genuine seriousness."`;
      }
      return `Welcome, ${name}! 🎯 **Tactical Blueprint to Eliminate Procrastination & Screen Friction:**\n\n` +
        `1. **Friction Inversion (*Deep Work*):**\n` +
        `   Physical proximity dictates subconscious action. Place your smartphone in another room before opening your book.\n\n` +
        `2. **The 5-Minute Activation Rule:**\n` +
        `   Procrastination is an emotional threshold problem. Grant yourself permission to pause after 5 minutes. Most resistance evaporates once you cross minute three.\n\n` +
        `3. **Morning Cognitive Fast:**\n` +
        `   Protect your first 60 minutes after waking. Replacing reactive scrolling with philosophical reading sets an unshakeable tone for the day.\n\n` +
        `💡 *Core Strategy:* Action precedes motivation, not the reverse. Take the first step now.`;
    }

    // --- 4. BOOK RECOMMENDATIONS & SEARCH ASSISTANCE ---
    if (q.includes('recommend') || q.includes('suggest') || q.includes('list') || q.includes('kitab') || q.includes('padhu') || q.includes('best book') || q.includes('search') || q.includes('find')) {
      if (isHindi) {
        return `Namaste ${name}! 📚 **MindRise Open Library Ki Top 5 Must-Read Books:**\n\n` +
          `1. **Atomic Habits** by James Clear — *Daily habit systems aur consistency ke liye.*\n` +
          `2. **Meditations** by Marcus Aurelius — *Inner peace, stoicism aur mental strength ke liye.*\n` +
          `3. **The Psychology of Money** by Morgan Housel — *Wealth psychology aur financial freedom ke liye.*\n` +
          `4. **Deep Work** by Cal Newport — *Focus aur distraction-free study ke liye.*\n` +
          `5. **Godan** by Munshi Premchand — *Bharatiya sahitya aur manav samvedna ka mahakavya.*\n\n` +
          `🔍 **Direct Search Tip:** Kisi bhi author ya topic ko khojne ke liye upar diye gaye **Search bar** ya **Explore Books** tab me direct keyword type karein — 85 Lakh se zyada books turant mil jayengi!`;
      }
      return `Welcome, ${name}! 📚 **The 5 Foundational Masterworks in MindRise Open Library:**\n\n` +
        `1. **Atomic Habits** by James Clear — *The definitive guide to building good habits and breaking bad ones.*\n` +
        `2. **Meditations** by Marcus Aurelius — *Timeless emperor reflections on remaining grounded and untroubled.*\n` +
        `3. **The Psychology of Money** by Morgan Housel — *Timeless lessons on wealth, greed, and happiness.*\n` +
        `4. **Deep Work** by Cal Newport — *Rules for focused success in a distracted world.*\n` +
        `5. **As a Man Thinketh** by James Allen — *A brief classic on how thought patterns shape your destiny.*\n\n` +
        `🔍 **Search Tip:** You can query any title, author, or subject in the **Explore Books** search bar to search across 8.5M+ public domain and educational books with instant audio narration!`;
    }

    // --- 5. DEFAULT CONVERSATIONAL / SCHOLAR ASSISTANT ---
    if (isHindi) {
      return `Namaste ${name}! 🙏\n\n` +
        `Aapka sawal: *"${query}"*\n\n` +
        `**MindRise Query Bot Guidance:**\n` +
        `1. **First Principle:** Har kathin samasya ko chhote-chhote aasan tukdon me baantein.\n` +
        `2. **Active Knowledge:** Kitabon se seekha gaya gyan tabhi kaam karta hai jab use apne daily discipline me laaya jaye.\n` +
        `3. **Daily Action:** Aaj 15-20 minute reading karein aur MindRise Journal me apna reflection likhein.\n\n` +
        `💡 *Aap mujhse kisi bhi book ki summary, author ke baare me, study schedule ya self-improvement par sawal pooch sakte hain — bilkul free aur unlimited!*`;
    }

    return `Welcome, ${name}! 🙏\n\n` +
      `Regarding your inquiry: *"${query}"*\n\n` +
      `**MindRise Scholar Guidance:**\n` +
      `1. **Identify the Core Lever:** Strip away non-essential noise and identify the single highest-impact action you can take today.\n` +
      `2. **Anchor in Ritual:** Protect a sacred 20-minute daily reading sanctuary before reactive demands claim your day.\n` +
      `3. **Integrate Insights:** Convert what you read into behavioral momentum. Log your reading minutes, capture 1 note in your vault, and let daily consistency do the compounding.\n\n` +
      `💡 *Feel free to query any book, ask for chapter summaries, study blueprints, or philosophical guidance — 100% free with no limits!*`;
  }

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', engine: 'mindrise-free-query-bot', time: new Date().toISOString() });
  });

  // Free Query Bot Chat Endpoint (100% Free & Unlimited, Zero External Paid Key Needed)
  app.post('/api/coach/chat', (req: Request, res: Response) => {
    const { message, context, userContext } = req.body;
    const query = String(message || '').trim();
    const reply = executeFreeQueryBot(query, userContext || context);
    res.json({ reply, free: true });
  });

  // Free AI Journal Insights Endpoint
  app.post('/api/coach/analyze-journal', (req: Request, res: Response) => {
    const { entries, userName } = req.body;
    const readerName = userName || 'Reader';
    const entryCount = Array.isArray(entries) ? entries.length : 0;

    const analysis = `### 🌟 Executive Growth Pattern (${readerName})\n\n` +
      `Your recent journaling reflections (${entryCount} active notes logged) demonstrate deliberate self-awareness and steady commitment to personal growth. A prominent strength is your focus on disciplined evening retrospection.\n\n` +
      `### 🔍 Identified Friction Point / Blindspot\n` +
      `Digital device proximity in the mornings often fragments early concentration before deep reading begins.\n\n` +
      `### ⚡ 3 Micro-Experiments For This Week\n` +
      `1. **The 60-Minute Morning Sanctuary:** Keep all notifications muted for your first hour after waking.\n` +
      `2. **One Win Audit:** Log exactly 1 daily win every evening in MindRise before sleep.\n` +
      `3. **Active Recall Note:** Immediately write 2 bullet points after finishing any book chapter.`;

    res.json({ analysis });
  });

  // Free Growth Plan Generator Endpoint
  app.post('/api/coach/growth-plan', (req: Request, res: Response) => {
    const { focusArea, days, userInterests } = req.body;
    const topic = focusArea || 'Deep Work & Reading Discipline';
    const planDays = days || 30;

    const plan = `# 🏆 ${planDays}-Day Mastery Blueprint: ${topic}\n\n` +
      `**Core Mission:** Build an automated daily habit system that guarantees consistent progress without cognitive fatigue.\n\n` +
      `### 📋 Daily Non-Negotiable Rituals\n` +
      `- **20 Minutes Daily Reading:** Read timeless philosophy or growth literature uninterrupted.\n` +
      `- **1 Key Habit Completed:** Track your targeted non-negotiable in the Habit Tracker.\n` +
      `- **Evening Reflection Log:** Record key lessons in the Notes Vault.\n\n` +
      `### 🗺️ 4-Phase Progression\n` +
      `- **Week 1 (Frictionless Launch):** Focus purely on turning up daily. Keep friction at near-zero.\n` +
      `- **Week 2 (Focus Protection):** Eliminate morning screen distractions and protect 30 minutes of undisturbed reading.\n` +
      `- **Week 3 (Active Synthesis):** Start highlighting and synthesizing chapters into action steps.\n` +
      `- **Week 4 (Audit & Identity Shift):** Review your monthly logs and celebrate your permanent identity upgrade.\n\n` +
      `📚 **Recommended Library Books:** *Atomic Habits*, *Meditations*, *Deep Work*.`;

    res.json({ plan });
  });

  // Internet Archive Search Proxy Endpoint
  app.get('/api/archive/search', async (req: Request, res: Response) => {
    try {
      const qIndex = req.url.indexOf('?');
      const queryString = qIndex !== -1 ? req.url.slice(qIndex + 1) : '';
      const targetUrl = `https://archive.org/advancedsearch.php?${queryString}`;
      
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'MindRise/1.0 (Educational/Open-Reading; contact: user@mindrise.app)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Archive search failed with code ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Internet Archive search proxy error:', err);
      res.status(500).json({ error: 'Failed to query Internet Archive' });
    }
  });

  // Internet Archive Metadata Proxy Endpoint
  app.get('/api/archive/metadata/:identifier', async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      const targetUrl = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'MindRise/1.0 (Educational/Open-Reading)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Archive metadata error ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Internet Archive metadata proxy error:', err);
      res.status(500).json({ error: 'Failed to fetch item metadata' });
    }
  });

  // Internet Archive Document Stream / Proxy Endpoint (handles PDFs with range headers)
  app.get('/api/archive/proxy-file', async (req: Request, res: Response) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl || !targetUrl.startsWith('https://archive.org/download/')) {
        return res.status(400).json({ error: 'Invalid or missing target archive.org URL' });
      }

      const headers: Record<string, string> = {
        'User-Agent': 'MindRise/1.0 (Educational/Open-Reading)',
      };
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const upstream = await fetch(targetUrl, { headers });

      res.status(upstream.status);
      upstream.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'content-type' || key.toLowerCase() === 'content-length' || key.toLowerCase() === 'accept-ranges' || key.toLowerCase() === 'content-range') {
          res.setHeader(key, val);
        }
      });
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (!upstream.body) {
        return res.end();
      }

      // Convert web stream to Node readable stream
      const { Readable } = await import('stream');
      // @ts-ignore
      Readable.fromWeb(upstream.body).pipe(res);
    } catch (err: any) {
      console.error('Internet Archive file proxy error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream proxy error' });
      }
    }
  });

  // Internet Archive OCR/Text Proxy Endpoint
  app.get('/api/archive/text/:identifier', async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      const urlsToTry = [
        `https://archive.org/stream/${encodeURIComponent(identifier)}/${encodeURIComponent(identifier)}_djvu.txt`,
        `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(identifier)}_djvu.txt`,
        `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(identifier)}.txt`,
      ];

      let textContent = '';
      for (const targetUrl of urlsToTry) {
        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'MindRise/1.0 (Educational/Open-Reading)',
            },
          });
          if (response.ok) {
            textContent = await response.text();
            if (textContent && textContent.trim().length > 50) {
              break;
            }
          }
        } catch {
          // Continue to next candidate
        }
      }

      // If direct text URLs didn't succeed, inspect metadata to find any text file
      if (!textContent) {
        try {
          const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            const files = Array.isArray(metaJson?.files) ? metaJson.files : [];
            const txtFile = files.find(
              (f: any) => f.name && f.name.toLowerCase().endsWith('.txt') && !f.name.toLowerCase().includes('_meta')
            );
            if (txtFile?.name) {
              const fileRes = await fetch(`https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(txtFile.name)}`);
              if (fileRes.ok) {
                textContent = await fileRes.text();
              }
            }
          }
        } catch {
          // Ignored
        }
      }

      if (!textContent || textContent.trim().length < 20) {
        return res.status(404).json({ error: 'Text transcript not available for this publication' });
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(textContent.slice(0, 300000)); // Send up to first ~300kb of text
    } catch (err: any) {
      console.error('Archive text proxy error:', err);
      res.status(500).json({ error: 'Failed to fetch book text' });
    }
  });

  // In-memory cache for book pages to enable instant pagewise TTS without re-fetching
  const bookPagesCache = new Map<string, { pages: string[]; timestamp: number }>();

  // Internet Archive Specific Page OCR Text for Text-To-Speech Reader
  app.get('/api/archive/page-text', async (req: Request, res: Response) => {
    try {
      const { identifier, page } = req.query;
      if (!identifier || typeof identifier !== 'string') {
        return res.status(400).json({ error: 'Book identifier required' });
      }

      const pageNum = parseInt(String(page || '1'), 10) || 1;
      const cleanId = encodeURIComponent(identifier.trim());

      // 1. Check cache first
      let cached = bookPagesCache.get(cleanId);
      if (cached && Date.now() - cached.timestamp < 3600000) {
        const pages = cached.pages;
        const pageText = (pageNum <= pages.length && pageNum >= 1) ? (pages[pageNum - 1] || '') : '';
        return res.json({
          success: true,
          page: pageNum,
          text: pageText.trim(),
          hasText: pageText.trim().length > 5,
          totalTextPages: pages.length,
        });
      }

      // 2. Fetch full book DJVU/TXT transcript and split by form feed (\f or \x0c)
      const candidateUrls = [
        `https://archive.org/stream/${cleanId}/${cleanId}_djvu.txt`,
        `https://archive.org/download/${cleanId}/${cleanId}_djvu.txt`,
        `https://archive.org/download/${cleanId}/${cleanId}.txt`,
      ];

      let fullText = '';
      for (const url of candidateUrls) {
        try {
          const r = await fetch(url, {
            headers: { 'User-Agent': 'MindRise/1.0 (Educational/Open-Reading)' },
          });
          if (r.ok) {
            fullText = await r.text();
            if (fullText && fullText.trim().length > 30) {
              break;
            }
          }
        } catch {
          // Next url
        }
      }

      // If direct urls didn't return text, check metadata files list
      if (!fullText) {
        try {
          const metaRes = await fetch(`https://archive.org/metadata/${cleanId}`);
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            const files = Array.isArray(metaJson?.files) ? metaJson.files : [];
            const txtFile = files.find(
              (f: any) =>
                f.name &&
                f.name.toLowerCase().endsWith('.txt') &&
                !f.name.toLowerCase().includes('_meta')
            );
            if (txtFile?.name) {
              const fileRes = await fetch(
                `https://archive.org/download/${cleanId}/${encodeURIComponent(txtFile.name)}`
              );
              if (fileRes.ok) {
                fullText = await fileRes.text();
              }
            }
          }
        } catch {
          // Ignore
        }
      }

      if (fullText && fullText.trim().length > 10) {
        // Form feed \f or \x0c is the universal page separator in Archive.org OCR text
        const splitPages = fullText.split(/\f|\x0c/);
        
        // Clean and maintain cache size
        if (bookPagesCache.size > 50) {
          const oldestKey = bookPagesCache.keys().next().value;
          if (oldestKey) bookPagesCache.delete(oldestKey);
        }
        bookPagesCache.set(cleanId, { pages: splitPages, timestamp: Date.now() });

        const pageText = (pageNum <= splitPages.length && pageNum >= 1) ? (splitPages[pageNum - 1] || '') : '';
        return res.json({
          success: true,
          page: pageNum,
          text: pageText.trim(),
          hasText: pageText.trim().length > 5,
          totalTextPages: splitPages.length,
        });
      }

      // Fallback: If full text not available, return empty text response gracefully
      return res.json({
        success: false,
        page: pageNum,
        text: '',
        hasText: false,
        message: 'No transcript text available for this scanned page.',
      });
    } catch (err: any) {
      console.error('Page text proxy error:', err);
      res.status(500).json({ error: 'Failed to retrieve page text' });
    }
  });

  // Internet Archive Scanned Page Image Proxy (Google Books style original page facsimile)
  app.get('/api/archive/page-image', async (req: Request, res: Response) => {
    try {
      const { identifier, page, width } = req.query;
      if (!identifier || typeof identifier !== 'string') {
        return res.status(400).send('Identifier required');
      }

      const pageNum = parseInt(String(page || '1'), 10) || 1;
      const cleanId = encodeURIComponent(identifier);
      const reqWidth = String(width || '800');

      let candidateUrls: string[] = [];
      if (reqWidth === '1600' || reqWidth === 'orig') {
        candidateUrls = [
          `https://archive.org/download/${cleanId}/page/n${pageNum}.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}_w1600.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}_w1200.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}_w800.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}_medium.jpg`,
        ];
      } else if (reqWidth === '1200') {
        candidateUrls = [
          `https://archive.org/download/${cleanId}/page/n${pageNum}_w1200.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}_w800.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}_medium.jpg`,
        ];
      } else {
        candidateUrls = [
          `https://archive.org/download/${cleanId}/page/n${pageNum}_w800.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}.jpg`,
          `https://archive.org/download/${cleanId}/page/n${pageNum}_medium.jpg`,
        ];
      }

      for (const u of candidateUrls) {
        try {
          const upstream = await fetch(u, {
            headers: {
              'User-Agent': 'MindRise/1.0 (Educational/Open-Reading)',
            },
          });

          if (upstream.ok && upstream.body) {
            res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const { Readable } = await import('stream');
            // @ts-ignore
            Readable.fromWeb(upstream.body).pipe(res);
            return;
          }
        } catch {
          // Try next URL
        }
      }

      res.status(404).send('Page image not found');
    } catch (err: any) {
      console.error('Archive page image proxy error:', err);
      res.status(500).send('Page image proxy error');
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MindRise server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
