const axios = require('axios');
const { db } = require('../db');
const { items } = require('../db/schema');
const { sql, eq, lte, and } = require('drizzle-orm');

// Simple in-memory cache: { key -> { data, expiresAt } }
const cache = {};
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// @desc    Generate AI insights for the dashboard overview
// @route   POST /api/ai/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const {
      userName,
      userRole,
      reportedCount,
      claimedCount,
      pendingClaimsCount,
      activeVerificationsCount,
      returnedCount,
      recentItemTitles = [],
    } = req.body;

    // ── 1. Stale item count (Req 12) ─────────────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const staleResult = await db.select({ count: sql`count(*)` })
        .from(items)
        .where(and(eq(items.status, 'AVAILABLE'), lte(items.createdAt, thirtyDaysAgo)));
    const staleCount = Number(staleResult[0].count);

    // Cache key includes staleCount so stale data is not served from a warm cache
    const cacheKey = `${req.user._id}_${reportedCount}_${claimedCount}_${pendingClaimsCount}_${staleCount}`;

    if (cache[cacheKey] && cache[cacheKey].expiresAt > Date.now()) {
      return res.json({ ...cache[cacheKey].data, cached: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({ message: 'Gemini API key not configured' });
    }

    // ── 2. Hotspot aggregation (Req 9) ───────────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const hotspotsQuery = await db.execute(sql`
      SELECT 
        ROUND(ST_Y(geo_location::geometry)::numeric, 3) as lat, 
        ROUND(ST_X(geo_location::geometry)::numeric, 3) as lng, 
        COUNT(*) as count, 
        MAX(address) as address
      FROM items 
      WHERE created_at >= ${sevenDaysAgo.toISOString()} 
        AND geo_location IS NOT NULL
      GROUP BY ROUND(ST_Y(geo_location::geometry)::numeric, 3), ROUND(ST_X(geo_location::geometry)::numeric, 3)
      ORDER BY count DESC
      LIMIT 3
    `);

    const hotspots = hotspotsQuery.rows.map(r => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      count: Number(r.count),
      address: r.address || 'Unknown location'
    }));

    // ── 3. Today's category breakdown (Req 9 AC3) ────────────────────────────
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const categoriesQuery = await db.execute(sql`
      SELECT category, COUNT(*) as count 
      FROM items 
      WHERE created_at >= ${startOfDay.toISOString()}
      GROUP BY category
    `);

    const todayCategories = categoriesQuery.rows.map(r => ({
      category: r.category,
      count: Number(r.count)
    }));

    // ── Build enrichment context sections ────────────────────────────────────

    const recentTitles = recentItemTitles.length
      ? recentItemTitles.slice(0, 5).join(', ')
      : 'none';

    const hotspotSection = hotspots.length >= 3
      ? 'Geographic hotspots (last 7 days):\n' +
        hotspots.map((h, i) => `  ${i + 1}. ${h.address} — ${h.count} item${h.count !== 1 ? 's' : ''}`).join('\n')
      : null;

    const categorySection = todayCategories.length
      ? "Today's reports by category:\n" + todayCategories.map(c => `  - ${c.category}: ${c.count}`).join('\n')
      : "Today's reports by category: none yet.";

    const staleSection = staleCount > 0
      ? `Stale items (AVAILABLE for >30 days): ${staleCount} — admin review recommended.`
      : null;

    const enrichmentBlock = [hotspotSection, categorySection, staleSection]
      .filter(Boolean)
      .join('\n\n');

    // ── Gemini prompt ─────────────────────────────────────────────────────────
    const prompt = [
      'You are an AI assistant for a campus Digital Lost and Found system.',
      'Be concise and action-oriented. No long paragraphs.',
      '',
      'User context:',
      `- Name: ${userName}`,
      `- Role: ${userRole}`,
      `- Items reported: ${reportedCount}`,
      `- Claims submitted: ${claimedCount}`,
      `- Pending claims awaiting review: ${pendingClaimsCount}`,
      `- Active verifications: ${activeVerificationsCount}`,
      `- Items successfully returned: ${returnedCount}`,
      `- Recent item titles: ${recentTitles}`,
      '',
      enrichmentBlock,
      '',
      'Respond ONLY with a valid JSON object (no markdown, no explanation) in this exact structure:',
      '{',
      '  "activitySummary": "One sentence summarising the user\'s current activity.",',
      '  "alerts": ["alert 1", "alert 2"],',
      '  "quickActions": ["action 1", "action 2", "action 3"],',
      '  "suggestions": ["suggestion 1", "suggestion 2"]',
      '}',
      '',
      'Rules:',
      '- activitySummary: one sentence, under 80 characters',
      '- alerts: urgent things needing attention (max 2, empty array if none)',
      '- quickActions: 2 to 5 specific, data-driven imperative sentences. Each must be 20 words or fewer. Base them on the hotspot data, category clusters, and stale/unresolved counts above.',
      '- suggestions: longer-term improvements or tips (max 2)',
      '- Keep every string under 80 characters',
      '- Be specific to the numbers provided, not generic',
    ].join('\n');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await axios.post(
      geminiUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    const rawText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        activitySummary: rawText.slice(0, 120) || 'AI insights generated.',
        alerts: [],
        quickActions: [],
        suggestions: [],
      };
    }

    const result = {
      activitySummary: parsed.activitySummary || 'Your dashboard is up to date.',
      alerts:          Array.isArray(parsed.alerts)       ? parsed.alerts.slice(0, 2)       : [],
      quickActions:    Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0, 5) : [],
      suggestions:     Array.isArray(parsed.suggestions)  ? parsed.suggestions.slice(0, 2)  : [],
    };

    cache[cacheKey] = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };

    res.json(result);
  } catch (error) {
    console.error('Gemini AI error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'AI service unavailable', error: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const {
      message,
      history = [],
      userName,
      userRole,
      reportedCount,
      claimedCount,
      pendingClaimsCount,
      activeVerificationsCount,
      returnedCount,
      recentItemTitles = []
    } = req.body;

    if (!message) return res.status(400).json({ message: 'Message is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({ message: 'Gemini API key not configured' });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hotspotsQuery = await db.execute(sql`
      SELECT ROUND(ST_Y(geo_location::geometry)::numeric, 3) as lat, ROUND(ST_X(geo_location::geometry)::numeric, 3) as lng, COUNT(*) as count, MAX(address) as address
      FROM items WHERE created_at >= ${sevenDaysAgo.toISOString()} AND geo_location IS NOT NULL
      GROUP BY ROUND(ST_Y(geo_location::geometry)::numeric, 3), ROUND(ST_X(geo_location::geometry)::numeric, 3) ORDER BY count DESC LIMIT 3
    `);
    const hotspots = hotspotsQuery.rows.map(r => ({ address: r.address || 'Unknown location', count: Number(r.count) }));

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const categoriesQuery = await db.execute(sql`
      SELECT category, COUNT(*) as count FROM items WHERE created_at >= ${startOfDay.toISOString()} GROUP BY category
    `);
    const todayCategories = categoriesQuery.rows.map(r => ({ category: r.category, count: Number(r.count) }));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const staleResult = await db.select({ count: sql`count(*)` })
        .from(items).where(and(eq(items.status, 'AVAILABLE'), lte(items.createdAt, thirtyDaysAgo)));
    const staleCount = Number(staleResult[0].count);

    const systemPrompt = [
      'You are a helpful, conversational AI assistant embedded in a campus Digital Lost and Found dashboard.',
      'Be concise, friendly, and action-oriented.',
      '',
      'Current User Context:',
      `- Name: ${userName} (Role: ${userRole})`,
      `- Items reported by them: ${reportedCount}`,
      `- Claims they submitted: ${claimedCount}`,
      `- Claims waiting for review: ${pendingClaimsCount}`,
      `- Verifications in progress: ${activeVerificationsCount}`,
      `- Items successfully returned: ${returnedCount}`,
      `- Their recent items: ${recentItemTitles.join(', ') || 'None'}`,
      '',
      'Platform Context:',
      `- Geographic hotspots (last 7 days): ${hotspots.map(h => `${h.address} (${h.count})`).join(', ') || 'None'}`,
      `- Today's category breakdown: ${todayCategories.map(c => `${c.category} (${c.count})`).join(', ') || 'None'}`,
      `- Stale items (>30 days old): ${staleCount}`,
      '',
      'Instructions:',
      '1. Directly answer the user\'s queries about their session, items, or the platform.',
      '2. If they ask about hotspots or stale items, provide the platform context info.',
      '3. Keep responses brief. Do not use markdown headers excessively. Use bullet points if listing things.',
      '4. Maintain a helpful and polite tone.'
    ].join('\n');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await axios.post(geminiUrl, {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });

    const reply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I could not generate a response.';
    res.json({ reply });
  } catch (error) {
    console.error('Gemini Chat error:', error?.response?.data || error.message);
    if (error?.response?.status === 429) {
      return res.status(429).json({ message: 'The AI is currently busy (Too Many Requests). Please wait a moment and try again.' });
    }
    res.status(500).json({ message: 'AI service unavailable', error: error.message });
  }
};

module.exports = { getInsights, chatWithAI };
