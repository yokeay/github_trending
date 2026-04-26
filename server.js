require('dotenv').config();
const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory cache ───────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ── GitHub API helper ─────────────────────────────────────────────
function githubAPI(apiPath) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'GitHub-Trending-Explorer/1.0',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'ghp_your_token_here') {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const url = `https://api.github.com${apiPath}`;
    https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, message: data.message || 'GitHub API error', rateLimit: {
              remaining: res.headers['x-ratelimit-remaining'],
              reset: res.headers['x-ratelimit-reset'],
            }});
          } else {
            resolve({
              data,
              rateLimit: {
                remaining: res.headers['x-ratelimit-remaining'],
                limit: res.headers['x-ratelimit-limit'],
                reset: res.headers['x-ratelimit-reset'],
              }
            });
          }
        } catch (e) {
          reject({ status: 500, message: 'Failed to parse GitHub response' });
        }
      });
    }).on('error', (e) => reject({ status: 500, message: e.message }));
  });
}

// ── Predefined category queries ───────────────────────────────────
// GitHub Search API doesn't support complex OR chains with qualifiers.
// Use multiple simpler sub-queries and merge results for complex categories.
const SIMPLE_CATEGORIES = {
  trending:       { q: 'stars:>100', sort: 'stars', order: 'desc', label: '🔥 Trending' },
  rust:           { q: 'language:rust stars:>20', sort: 'updated', order: 'desc', label: '🦀 Rust' },
  python:         { q: 'language:python stars:>50', sort: 'updated', order: 'desc', label: '🐍 Python' },
  java:           { q: 'language:java stars:>50', sort: 'updated', order: 'desc', label: '☕ Java' },
  vue:            { q: 'topic:vue stars:>20', sort: 'updated', order: 'desc', label: '💚 Vue' },
  react:          { q: 'topic:react stars:>50', sort: 'updated', order: 'desc', label: '⚛️ React' },
  nestjs:         { q: 'topic:nestjs stars:>5', sort: 'updated', order: 'desc', label: '🐱 NestJS' },
  cpp:            { q: 'language:c++ stars:>20', sort: 'updated', order: 'desc', label: '⚡ C++' },
  'fast-growing': { q: 'stars:>10', sort: 'stars', order: 'desc', label: '📈 Fast Growing' },
};

// Multi-query categories: run several simple queries and merge results
const MULTI_CATEGORIES = {
  ai: {
    label: '🤖 AI / ML',
    sort: 'updated', order: 'desc',
    subQueries: [
      'topic:machine-learning stars:>50',
      'topic:deep-learning stars:>50',
      'topic:llm stars:>30',
    ],
  },
  cicd: {
    label: '🚀 CI/CD',
    sort: 'updated', order: 'desc',
    subQueries: [
      'topic:cicd stars:>20',
      'topic:devops stars:>20',
      'topic:github-actions stars:>20',
    ],
  },
};

const ALL_LABELS = {};
Object.entries(SIMPLE_CATEGORIES).forEach(([k, v]) => ALL_LABELS[k] = v.label);
Object.entries(MULTI_CATEGORIES).forEach(([k, v]) => ALL_LABELS[k] = v.label);

// ── API Routes ────────────────────────────────────────────────────

// GET /api/categories
app.get('/api/categories', (_req, res) => {
  const list = Object.entries(ALL_LABELS).map(([key, label]) => ({ key, label }));
  res.json(list);
});

// Helper: map raw GitHub repo to our format
function mapRepo(r) {
  return {
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    open_issues_count: r.open_issues_count,
    watchers_count: r.watchers_count,
    created_at: r.created_at,
    updated_at: r.updated_at,
    pushed_at: r.pushed_at,
    topics: r.topics || [],
    license: r.license ? r.license.spdx_id : null,
    owner: {
      login: r.owner.login,
      avatar_url: r.owner.avatar_url,
      html_url: r.owner.html_url,
    },
    homepage: r.homepage,
    size: r.size,
    default_branch: r.default_branch,
  };
}

// GET /api/repos?category=xxx&page=1&per_page=30&days=7&search=keyword
app.get('/api/repos', async (req, res) => {
  try {
    const {
      category = 'trending',
      page = 1,
      per_page = 30,
      days = 7,
      search = '',
    } = req.query;

    const sinceDate = new Date(Date.now() - Number(days) * 86400000).toISOString().split('T')[0];
    const searchSuffix = search ? ` ${search} in:name,description` : '';
    const cacheKey = `repos:${category}:${days}:${search}:${page}:${per_page}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    let payload;

    // ── Multi-query category (AI, CI/CD) ──
    const multi = MULTI_CATEGORIES[category];
    if (multi) {
      // Run sub-queries in parallel, each fetching a portion
      const subPerPage = Math.ceil(Number(per_page) / multi.subQueries.length);
      const results = await Promise.allSettled(
        multi.subQueries.map(sq => {
          const q = `${sq} pushed:>=${sinceDate}${searchSuffix}`;
          const apiPath = `/search/repositories?q=${encodeURIComponent(q)}&sort=${multi.sort}&order=${multi.order}&page=${page}&per_page=${subPerPage}`;
          return githubAPI(apiPath);
        })
      );

      // Merge & deduplicate by repo id
      const seen = new Set();
      let allItems = [];
      let totalCount = 0;
      let rateLimit = null;

      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        rateLimit = r.value.rateLimit;
        totalCount = Math.max(totalCount, r.value.data.total_count || 0);
        for (const item of (r.value.data.items || [])) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            allItems.push(item);
          }
        }
      }

      // Sort merged results by stars desc
      allItems.sort((a, b) => b.stargazers_count - a.stargazers_count);
      allItems = allItems.slice(0, Number(per_page));

      payload = {
        total_count: totalCount,
        items: allItems.map(mapRepo),
        rateLimit,
      };
    }
    // ── Simple category ──
    else {
      const cat = SIMPLE_CATEGORIES[category] || SIMPLE_CATEGORIES.trending;
      let q;
      if (category === 'fast-growing') {
        q = `created:>=${sinceDate} stars:>10${searchSuffix}`;
      } else {
        q = `${cat.q} pushed:>=${sinceDate}${searchSuffix}`;
      }
      const sort = cat.sort;
      const order = cat.order;
      const apiPath = `/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${per_page}`;
      const result = await githubAPI(apiPath);

      payload = {
        total_count: result.data.total_count,
        items: (result.data.items || []).map(mapRepo),
        rateLimit: result.rateLimit,
      };
    }

    setCache(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, rateLimit: err.rateLimit });
  }
});

// GET /api/repo/:owner/:repo  — single repo detail
app.get('/api/repo/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const cacheKey = `detail:${owner}/${repo}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [repoRes, readmeRes] = await Promise.allSettled([
      githubAPI(`/repos/${owner}/${repo}`),
      githubAPI(`/repos/${owner}/${repo}/readme`),
    ]);

    const repoData = repoRes.status === 'fulfilled' ? repoRes.value.data : null;
    let readmeContent = null;
    if (readmeRes.status === 'fulfilled') {
      const raw = readmeRes.value.data.content;
      readmeContent = Buffer.from(raw, 'base64').toString('utf-8');
    }

    const payload = { repo: repoData, readme: readmeContent, rateLimit: repoRes.status === 'fulfilled' ? repoRes.value.rateLimit : null };
    setCache(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/rate-limit
app.get('/api/rate-limit', async (_req, res) => {
  try {
    const result = await githubAPI('/rate_limit');
    res.json(result.data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  const hasToken = process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'ghp_your_token_here';
  console.log(`\n  🚀  GitHub Trending Explorer running at http://localhost:${PORT}`);
  console.log(`  📡  GitHub Token: ${hasToken ? '✅ Configured' : '❌ Not set (limited to 10 req/min)'}`);
  console.log(`  💡  Copy .env.example to .env and add your token for higher rate limits.\n`);
});
