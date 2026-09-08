import express, { Request, Response } from 'express';
import path from 'path';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Groq client lazily
  function getGroqClient(): Groq | null {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) return null;
    return new Groq({ apiKey });
  }

  const DEFAULT_SYSTEM_PROMPT =
    "You are the AI assistant inside this application. Be helpful, accurate, concise, and friendly. When the user asks a question, explain the answer clearly and adapt the level of detail to the user's request.";

  // =========================================================================
  // SECURE GROQ AI CHAT ENDPOINT: POST /api/chat
  // - Reads GROQ_API_KEY and GROQ_MODEL from server environment only
  // - Enforces validation, message length limits & server-side system prompt
  // - Supports both Server-Sent Events (SSE) streaming and direct JSON
  // - Returns user-friendly error on failures without leaking secrets/traces
  // =========================================================================
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages, stream: wantsStream } = req.body;

      // 1. Validation: Validate request payload
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'AI is temporarily unavailable. Please try again.' });
      }

      // 2. Limit conversation size and message length
      const sanitizedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT }
      ];

      // Keep up to last 20 messages to fit token constraints
      const inputMessages = messages.slice(-20);

      for (const msg of inputMessages) {
        if (!msg || typeof msg !== 'object') continue;
        const role = msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user';
        const rawContent = String(msg.content || '').trim();
        if (!rawContent) continue;
        // Limit individual message length to 4000 characters
        const content = rawContent.length > 4000 ? rawContent.substring(0, 4000) : rawContent;
        sanitizedMessages.push({ role, content });
      }

      // Must have at least 1 user message
      if (sanitizedMessages.length <= 1) {
        return res.status(400).json({ error: 'AI is temporarily unavailable. Please try again.' });
      }

      const groq = getGroqClient();
      const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';

      if (!groq) {
        console.warn('Groq API Key not found in server environment');
        return res.status(503).json({
          error: 'AI is temporarily unavailable. Please try again.',
          reply: 'AI is temporarily unavailable. Please try again.'
        });
      }

      const isStreaming = wantsStream === true || req.headers.accept?.includes('text/event-stream');

      if (isStreaming) {
        try {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();

          // Try requested model, with automatic fallback if model alias isn't available
          let chatStream;
          try {
            chatStream = await groq.chat.completions.create({
              model,
              messages: sanitizedMessages,
              temperature: 0.7,
              max_completion_tokens: 2048,
              stream: true,
            });
          } catch (modelErr: any) {
            console.warn(`Groq model '${model}' error, falling back to 'llama-3.3-70b-versatile':`, modelErr?.status);
            chatStream = await groq.chat.completions.create({
              model: 'llama-3.3-70b-versatile',
              messages: sanitizedMessages,
              temperature: 0.7,
              max_completion_tokens: 2048,
              stream: true,
            });
          }

          for await (const chunk of chatStream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
              res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
            }
          }
          res.write('data: [DONE]\n\n');
          return res.end();
        } catch (streamErr: any) {
          console.error('Groq streaming error occurred');
          res.write(`data: ${JSON.stringify({ error: 'AI is temporarily unavailable. Please try again.' })}\n\n`);
          res.write('data: [DONE]\n\n');
          return res.end();
        }
      } else {
        // Standard JSON response
        let completion;
        try {
          completion = await groq.chat.completions.create({
            model,
            messages: sanitizedMessages,
            temperature: 0.7,
            max_completion_tokens: 2048,
          });
        } catch (modelErr: any) {
          console.warn(`Groq model '${model}' error, falling back to 'llama-3.3-70b-versatile':`, modelErr?.status);
          completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: sanitizedMessages,
            temperature: 0.7,
            max_completion_tokens: 2048,
          });
        }

        const reply = completion.choices[0]?.message?.content || 'AI is temporarily unavailable. Please try again.';
        return res.json({
          reply,
          content: reply,
          role: 'assistant',
          model: completion.model || model,
          success: true
        });
      }
    } catch (err: any) {
      console.error('POST /api/chat error occurred');
      return res.status(500).json({
        error: 'AI is temporarily unavailable. Please try again.',
        reply: 'AI is temporarily unavailable. Please try again.'
      });
    }
  });

  // =========================================================================
  // MINDRISE GROQ AI API ENGINE (Llama 3.3 70B Versatile)
  // Connects via standard fetch to https://api.groq.com/openai/v1/chat/completions
  // Falls back gracefully to built-in scholar engine when GROQ_API_KEY is not configured
  // =========================================================================

  function generateScholarFallback(query: string, userContext: any): string {
    const q = query.toLowerCase().trim();
    const name = userContext?.name ? userContext.name.split(' ')[0] : 'Scholar';
    const isHindi = /kya|kaise|batao|chahiye|karein|hai|nahi|padhe|kitab|soch|madad|paise|aadat|shuru|dhyan|mushkil/i.test(query);

    let answer = '';

    if (q.includes('atomic habit') || (q.includes('atomic') && q.includes('habit'))) {
      answer = isHindi
        ? `### 📘 *Atomic Habits* by James Clear — Book Summary & Key Rules\n\n` +
          `**Core Philosophy:** Aap apne goals ke level tak nahi uthte, balki apne systems ke level tak girte hain. Rozana 1% improvement saal ke ant me 37x compound results deta hai.\n\n` +
          `**The 4 Laws of Behavior Change:**\n` +
          `1. **Make it Obvious:** Apne reading area ko visually clear rakhein (kitab table par samne rakhein).\n` +
          `2. **Make it Attractive:** Habit Stacking karein — *"Morning chai ke baad main 15 min MindRise me padhunga."*\n` +
          `3. **Make it Easy:** **2-Minute Rule** use karein. Pehle din sirf 2 pages padhne ka rule banaiye.\n` +
          `4. **Make it Satisfying:** MindRise Habit Tracker me tick karke daily streak maintain karein.\n\n` +
          `💡 *Golden Line:* "Har action ek vote hai us insaan ke liye jo aap banna chahte hain."`
        : `### 📘 *Atomic Habits* by James Clear — Core Framework & Summary\n\n` +
          `**Core Thesis:** You do not rise to the level of your goals; you fall to the level of your systems. A 1% improvement every day compounds to 37x better results across one year.\n\n` +
          `**The 4 Laws of Habit Architecture:**\n` +
          `1. **Make it Obvious (Cue):** Place your book in plain view on your desk or nightstand. Design your environment for success.\n` +
          `2. **Make it Attractive (Craving):** Pair reading with an established pleasure (Habit Stacking: *"After morning coffee, I will open MindRise for 20 minutes."*).\n` +
          `3. **Make it Easy (Response):** Apply the **2-Minute Rule**. Scale down your habit to simply reading 1 to 2 pages initially.\n` +
          `4. **Make it Satisfying (Reward):** Keep visual momentum in your MindRise streak tracker. Never miss twice.\n\n` +
          `💡 *Takeaway:* Every page you turn is a vote for the scholarly identity you are building.`;
    } else if (q.includes('meditation') || q.includes('marcus') || q.includes('stoic') || q.includes('seneca') || q.includes('epictetus')) {
      answer = isHindi
        ? `### 🏛️ *Meditations* by Marcus Aurelius — Stoic Wisdom Summary\n\n` +
          `**3 Core Stoic Pillars:**\n` +
          `1. **Dichotomy of Control:** Aapke haath me sirf aapke vichar aur actions hain. Bahar ki duniya aapke control me nahi hai.\n` +
          `2. **Amor Fati:** Mushkilon se ghabrane ke bajaye unhe character building ka zariya banaiye.\n` +
          `3. **Muted Ego:** Raat ko yaad rakhein ki sabhi chizein asthayi hain.\n\n` +
          `💡 *Quote:* "Aapke paas apne dimag par shakti hai, bahar ki ghatnaon par nahi."`
        : `### 🏛️ *Meditations* by Marcus Aurelius — Stoic Masterwork Summary\n\n` +
          `**3 Foundational Pillars:**\n` +
          `1. **The Dichotomy of Control:** You have power over your own mind, not outside events. Direct 100% of your energy toward your own judgment and discipline.\n` +
          `2. **The Obstacle is the Way:** What impedes action advances action. Friction is not a roadblock; it is the raw material of character.\n` +
          `3. **Memento Mori (Perspective):** Recognize the briefness of human life. Focus solely on what is virtuous, genuine, and present.\n\n` +
          `💡 *Actionable Practice:* Before interacting with distractions, ask: *"Is this essential?"*`;
    } else if (q.includes('deep work') || q.includes('focus') || q.includes('distraction') || q.includes('procrastinat') || q.includes('dhyan')) {
      answer = isHindi
        ? `### 🧠 *Deep Work* & Focus Mastery Formula\n\n` +
          `1. **5-Minute Activation Rule:** Khud se boliye: *"Main sirf 5 minute focus karunga."* Resistance turant gayab ho jati hai.\n` +
          `2. **Environment Redesign:** Phone ko doosre room me rakhein taaki physical friction mile.\n` +
          `3. **Morning Screen Fast:** Subah uthne ke pehle 45 minute koi bhi screen touch mat karein.\n\n` +
          `💡 *Marcus Aurelius:* "Concentrate every minute on doing what is in front of you with genuine seriousness."`
        : `### 🧠 *Deep Work* & Focus Mastery Protocols\n\n` +
          `1. **Friction Inversion:** Physical proximity dictates subconscious action. Place your phone in another room before opening your book.\n` +
          `2. **The 5-Minute Activation Rule:** Procrastination is an emotional threshold problem. Grant yourself permission to read for 5 minutes—flow follows action.\n` +
          `3. **Morning Cognitive Fast:** Protect your first 60 minutes after waking from reactive digital feeds.`;
    } else if (q.includes('money') || q.includes('wealth') || q.includes('paisa') || q.includes('psychology of money')) {
      answer = isHindi
        ? `### 💰 *The Psychology of Money* by Morgan Housel — Core Summary\n\n` +
          `1. **Rich vs Wealthy:** Rich banna dikhawa hai, lekin Wealthy wo paisa hai jo aapne *kharch nahi kiya*. Freedom sabse bada dividend hai.\n` +
          `2. **Power of Compounding:** Patience hi sabse bada asset hai.\n` +
          `3. **Knowing What is "Enough":** Lifestyle inflation ko control me rakhein.`
        : `### 💰 *The Psychology of Money* by Morgan Housel — Core Takeaways\n\n` +
          `1. **Rich vs. Wealthy:** Being rich is visible consumption. Wealth is the options, assets, and unspent capital that grant you freedom over your time.\n` +
          `2. **The Power of Longevity:** Compounding does not reward volatility; it rewards staying in the arena long enough for time to do the heavy lifting.\n` +
          `3. **Knowing What is "Enough":** Guard strictly against lifestyle creep.\n\n` +
          `💡 *Key Return:* Independence is the ultimate financial return.`;
    } else if (q.includes('gita') || q.includes('bhagavad') || q.includes('krishna') || q.includes('vedas') || q.includes('upanishad')) {
      answer = `### 🕉️ *The Bhagavad Gita* — The Science of Mind & Duty\n\n` +
        `**3 Universal Principles:**\n` +
        `1. **Nishkama Karma (Duty Without Attachment):** Direct your entire focus toward righteous action without becoming anxious over outcomes.\n` +
        `2. **Samatva (Equanimity):** Maintain balanced composure in victory and defeat alike.\n` +
        `3. **Conquest of Mind:** "For him who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his mind will remain the greatest enemy."`;
    } else {
      answer = isHindi
        ? `Namaste ${name}! 🙏\n\n` +
          `Aapka sawal: *"${query}"*\n\n` +
          `**MindRise Scholar Guidance:**\n` +
          `1. **First Principles Thinking:** Kisi bhi sawal ko uske mool tathyon me baantein aur samajhein.\n` +
          `2. **20-Minute Reading Ritual:** Rozana 20 minute uninterrupted reading karein aur 1 note save karein.\n` +
          `3. **Active Reflection:** Seekhi hui baton ko apne dainik charitra me badlein.\n\n` +
          `💡 *Aap kisi bhi book, author, philosophical thought ya study plan par sawal pooch sakte hain!*`
        : `Welcome, ${name}! 🙏\n\n` +
          `Regarding your inquiry: *"${query}"*\n\n` +
          `**MindRise Scholar Guidance:**\n` +
          `1. **Identify the Core Lever:** Strip away non-essential noise and identify the single highest-impact action you can take today.\n` +
          `2. **Anchor in Ritual:** Protect a sacred 20-minute daily reading sanctuary before reactive demands claim your day.\n` +
          `3. **Integrate Insights:** Convert what you read into behavioral momentum. Log your reading minutes, capture 1 note in your vault, and let daily consistency do the compounding.\n\n` +
          `💡 *Feel free to query any book, ask for chapter summaries, study blueprints, or philosophical guidance!*`;
    }

    return answer;
  }

  async function callGroqChat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<string | null> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      // Key is optional; return null to indicate fallback
      return null;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Groq API Notice:', response.status, errText);
      return null;
    }

    const data: any = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  }

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      engine: 'groq-llama-3.3-70b-versatile',
      hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      time: new Date().toISOString()
    });
  });

  // Groq AI Chat Endpoint (Llama 3.3 70B Versatile with graceful fallback)
  app.post('/api/coach/chat', async (req: Request, res: Response) => {
    try {
      const { message, history, userContext, context } = req.body;
      const query = String(message || '').trim();
      if (!query) {
        return res.status(400).json({ error: 'Message query is required' });
      }

      const activeContext = userContext || context || {};
      const userName = activeContext.name || 'Scholar';
      const streak = activeContext.streak || 0;
      const interests = Array.isArray(activeContext.interests)
        ? activeContext.interests.join(', ')
        : 'Literature, Philosophy, Self-Development, History';
      const booksRead = activeContext.booksRead || 0;

      const systemPrompt = `You are MindRise AI Mentor & Scholar Assistant, a world-class literary scholar, philosophical guide, and reading habit coach embedded in the MindRise Open Library platform (8.5 Million+ books).

Your Identity & Core Strengths:
1. Deep Wisdom & Scholarship: Encyclopedic knowledge across world literature, classical philosophy (Stoicism, Eastern thought, Bhagavad Gita, Upanishads, Vedas, Chanakya Neeti, Greek philosophy), personal mastery (Atomic Habits, Deep Work, Psychology of Money), science, and history.
2. Multilingual Fluency: Respond fluently and naturally in English, Hindi (Devanagari or Hinglish), or any requested language. Mirror the user's preferred language.
3. Clear & Practical Structure: Format responses with elegant markdown, clear headings, bullet points, mental models, and actionable takeaways.
4. Active Scholar Context: User Name: "${userName}". Current daily streak: ${streak} days. Focus interests: ${interests}. Books completed: ${booksRead}.

Provide insightful, respectful, and actionable mentorship for reading, book queries, habit consistency, and intellectual growth.`;

      const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Append conversation history
      if (Array.isArray(history)) {
        for (const item of history.slice(-8)) {
          const role = item.role === 'user' ? 'user' : 'assistant';
          const content = item.content || item.text || item.parts?.[0]?.text || '';
          if (content && typeof content === 'string' && content.trim()) {
            formattedMessages.push({ role, content: content.trim() });
          }
        }
      }

      // Add latest query
      formattedMessages.push({ role: 'user', content: query });

      const groqReply = await callGroqChat(formattedMessages);
      if (groqReply) {
        return res.json({ reply: groqReply, model: 'llama-3.3-70b-versatile', success: true });
      }

      // If GROQ_API_KEY is not set or unavailable, return high quality scholar response
      const fallbackReply = generateScholarFallback(query, activeContext);
      return res.json({
        reply: fallbackReply,
        model: 'mindrise-scholar-engine',
        hasGroqKey: false,
        success: true
      });
    } catch (err: any) {
      const fallbackReply = generateScholarFallback(req.body?.message || '', req.body?.userContext || {});
      return res.json({
        reply: fallbackReply,
        model: 'mindrise-scholar-engine',
        success: true
      });
    }
  });

  // Groq AI Journal Insights Endpoint
  app.post('/api/coach/analyze-journal', async (req: Request, res: Response) => {
    try {
      const { entries, userName } = req.body;
      const readerName = userName || 'Reader';
      const entryList = Array.isArray(entries) ? entries : [];

      const prompt = `Analyze the following daily journal reflections for ${readerName} and provide an inspiring, analytical summary with:
1. Executive Growth Pattern (strengths, recurring themes)
2. Blindspots & Friction Points
3. 3 Practical Micro-Experiments for the upcoming week

Journal Entries:
${JSON.stringify(entryList.slice(-10), null, 2)}`;

      const analysis = await callGroqChat([
        { role: 'system', content: 'You are an executive mindfulness and personal growth mentor. Analyze journal entries with deep psychological insight and constructive actionable advice in clean Markdown.' },
        { role: 'user', content: prompt }
      ]);

      if (analysis) {
        return res.json({ analysis, model: 'llama-3.3-70b-versatile' });
      }

      return res.json({
        analysis: `### 🌟 Executive Growth Pattern (${readerName})\n\n` +
          `Your recent journaling reflections (${entryList.length} active notes logged) demonstrate deliberate self-awareness and steady commitment to personal growth. A prominent strength is your focus on disciplined evening retrospection.\n\n` +
          `### 🔍 Identified Friction Point / Blindspot\n` +
          `Digital device proximity in the mornings often fragments early concentration before deep reading begins.\n\n` +
          `### ⚡ 3 Micro-Experiments For This Week\n` +
          `1. **The 60-Minute Morning Sanctuary:** Keep all notifications muted for your first hour after waking.\n` +
          `2. **One Win Audit:** Log exactly 1 daily win every evening in MindRise before sleep.\n` +
          `3. **Active Recall Note:** Immediately write 2 bullet points after finishing any book chapter.`
      });
    } catch (err: any) {
      return res.json({
        analysis: `### 🌟 Executive Growth Pattern (${req.body.userName || 'Scholar'})\n\nYour reflections demonstrate deliberate self-awareness and steady commitment to personal growth. Keep maintaining your daily reflection momentum.`
      });
    }
  });

  // Groq AI Growth Plan Generator Endpoint
  app.post('/api/coach/growth-plan', async (req: Request, res: Response) => {
    try {
      const { focusArea, days, userInterests } = req.body;
      const topic = focusArea || 'Deep Work & Reading Discipline';
      const planDays = days || 30;

      const prompt = `Create a structured ${planDays}-Day Personal Growth & Reading Protocol for the topic: "${topic}". Interests: ${JSON.stringify(userInterests || [])}.
Include:
1. Core Mission & Identity Shift
2. Daily Non-Negotiable Rituals (e.g. 20-min reading block, tracking, reflection)
3. 4-Phase Progression (Week-by-week)
4. Top 3-5 Recommended Masterworks to read in the MindRise Library`;

      const plan = await callGroqChat([
        { role: 'system', content: 'You are an elite habit and intellectual development mentor. Design practical, motivating, highly structured masterplans in clean Markdown.' },
        { role: 'user', content: prompt }
      ]);

      if (plan) {
        return res.json({ plan, model: 'llama-3.3-70b-versatile' });
      }

      return res.json({
        plan: `# 🏆 ${planDays}-Day Mastery Blueprint: ${topic}\n\n` +
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
          `📚 **Recommended Library Books:** *Atomic Habits*, *Meditations*, *Deep Work*.`
      });
    } catch (err: any) {
      return res.json({
        plan: `# 🏆 ${req.body.days || 30}-Day Mastery Blueprint: ${req.body.focusArea || 'Deep Work'}\n\n**Core Mission:** Build an automated daily habit system that guarantees consistent progress without cognitive fatigue.`
      });
    }
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
    const { createServer: createViteServer } = await import('vite');
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
