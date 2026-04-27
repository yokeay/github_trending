// ── GitHub API 封装 ────────────────────────────────────────────
// 对应原 server.js 中的 GitHub API 逻辑

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  license: { spdx_id: string } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  homepage: string | null;
  size: number;
  default_branch: string;
}

export interface RateLimit {
  remaining: string;
  limit: string;
  reset: string;
}

export interface GitHubAPIResult<T> {
  data: T;
  rateLimit: RateLimit;
}

export interface SearchResult {
  total_count: number;
  items: Repo[];
}

export class GitHubError extends Error {
  status: number;
  rateLimit?: RateLimit;
  constructor(status: number, message: string, rateLimit?: RateLimit) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
    this.rateLimit = rateLimit;
  }
}

// ── 预定义分类查询 ──────────────────────────────────────────────
// 与原 server.js 完全一致
export const SIMPLE_CATEGORIES = {
  trending: { q: 'stars:>100', sort: 'stars', order: 'desc', label: '🔥 Trending' },
  rust: { q: 'language:rust stars:>20', sort: 'updated', order: 'desc', label: '🦀 Rust' },
  python: { q: 'language:python stars:>50', sort: 'updated', order: 'desc', label: '🐍 Python' },
  java: { q: 'language:java stars:>50', sort: 'updated', order: 'desc', label: '☕ Java' },
  vue: { q: 'topic:vue stars:>20', sort: 'updated', order: 'desc', label: '💚 Vue' },
  react: { q: 'topic:react stars:>50', sort: 'updated', order: 'desc', label: '⚛️ React' },
  nestjs: { q: 'topic:nestjs stars:>5', sort: 'updated', order: 'desc', label: '🐱 NestJS' },
  cpp: { q: 'language:c++ stars:>20', sort: 'updated', order: 'desc', label: '⚡ C++' },
  'fast-growing': { q: 'stars:>10', sort: 'stars', order: 'desc', label: '📈 Fast Growing' },
} as const;

// 多子查询分类（AI / CI/CD）
export const MULTI_CATEGORIES = {
  ai: {
    label: '🤖 AI / ML',
    sort: 'updated',
    order: 'desc',
    subQueries: [
      'topic:machine-learning stars:>50',
      'topic:deep-learning stars:>50',
      'topic:llm stars:>30',
    ],
  },
  cicd: {
    label: '🚀 CI/CD',
    sort: 'updated',
    order: 'desc',
    subQueries: [
      'topic:cicd stars:>20',
      'topic:devops stars:>20',
      'topic:github-actions stars:>20',
    ],
  },
} as const;

// 所有分类标签
export const ALL_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(SIMPLE_CATEGORIES).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(MULTI_CATEGORIES).map(([k, v]) => [k, v.label])),
};

// ── API 调用 (导出以便测试) ─────────────────────────────────────
export async function githubFetch<T>(apiPath: string): Promise<GitHubAPIResult<T>> {
  const headers: Record<string, string> = {
    'User-Agent': 'GitHub-Trending-Explorer/1.0',
    Accept: 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'ghp_your_token_here') {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com${apiPath}`, { headers });

  let body = '';
  // Use readable stream
  const reader = res.body?.getReader();
  if (reader) {
    const decoder = new TextDecoder();
    let result;
    while (!(result = await reader.read()).done) {
      body += decoder.decode(result.value, { stream: true });
    }
  }

  const rateLimit: RateLimit = {
    remaining: res.headers.get('x-ratelimit-remaining') || '0',
    limit: res.headers.get('x-ratelimit-limit') || '0',
    reset: res.headers.get('x-ratelimit-reset') || '0',
  };

  if (!res.ok) {
    try {
      const data = JSON.parse(body);
      throw new GitHubError(res.status, data.message || 'GitHub API error', rateLimit);
    } catch (e) {
      if (e instanceof GitHubError) throw e;
      throw new GitHubError(res.status, `GitHub API error: ${res.status}`, rateLimit);
    }
  }

  return { data: JSON.parse(body) as T, rateLimit };
}

// ── 搜索仓库 ────────────────────────────────────────────────────
export async function searchRepos(params: {
  category: string;
  page: number;
  per_page: number;
  days: number;
  search?: string;
}): Promise<GitHubAPIResult<SearchResult>> {
  const { category, page, per_page, days, search } = params;
  const sinceDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const searchSuffix = search ? ` ${search} in:name,description` : '';

  // ── 多子查询分类 ──
  const multi = MULTI_CATEGORIES[category as keyof typeof MULTI_CATEGORIES];
  if (multi) {
    const subPerPage = Math.ceil(per_page / multi.subQueries.length);
    const results = await Promise.allSettled(
      multi.subQueries.map(sq => {
        const q = `${sq} pushed:>=${sinceDate}${searchSuffix}`;
        return githubFetch<SearchResult>(
          `/search/repositories?q=${encodeURIComponent(q)}&sort=${multi.sort}&order=${multi.order}&page=${page}&per_page=${subPerPage}`
        );
      })
    );

    const seen = new Set<number>();
    let allItems: Repo[] = [];
    let totalCount = 0;
    let rateLimit: RateLimit | null = null;

    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      rateLimit = r.value.rateLimit;
      totalCount = Math.max(totalCount, r.value.data.total_count || 0);
      for (const item of r.value.data.items || []) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          allItems.push(item);
        }
      }
    }

    allItems.sort((a, b) => b.stargazers_count - a.stargazers_count);
    allItems = allItems.slice(0, per_page);

    return {
      data: { total_count: totalCount, items: allItems },
      rateLimit: rateLimit || { remaining: '0', limit: '0', reset: '0' },
    };
  }

  // ── 单查询分类 ──
  const cat =
    SIMPLE_CATEGORIES[category as keyof typeof SIMPLE_CATEGORIES] || SIMPLE_CATEGORIES.trending;
  let q: string;
  if (category === 'fast-growing') {
    q = `created:>=${sinceDate} stars:>10${searchSuffix}`;
  } else {
    q = `${cat.q} pushed:>=${sinceDate}${searchSuffix}`;
  }

  return githubFetch<SearchResult>(
    `/search/repositories?q=${encodeURIComponent(q)}&sort=${cat.sort}&order=${cat.order}&page=${page}&per_page=${per_page}`
  );
}

// ── 单仓库详情 ─────────────────────────────────────────────────
export async function getRepoDetail(owner: string, repo: string) {
  return githubFetch<Repo>(`/repos/${owner}/${repo}`);
}

// ── README ─────────────────────────────────────────────────────
export async function getRepoReadme(owner: string, repo: string) {
  try {
    const result = await githubFetch<{ content: string }>(`/repos/${owner}/${repo}/readme`);
    // GitHub returns base64-encoded content with newlines
    const raw = result.data.content.replace(/\n/g, '');
    return {
      content: Buffer.from(raw, 'base64').toString('utf-8'),
      rateLimit: result.rateLimit,
    };
  } catch {
    return { content: null, rateLimit: { remaining: '0', limit: '0', reset: '0' } };
  }
}

// ── 限流状态 ───────────────────────────────────────────────────
export async function getRateLimitStatus() {
  return githubFetch<{
    rate: { limit: number; remaining: number; reset: number };
  }>('/rate_limit');
}

// ── 工具函数 ────────────────────────────────────────────────────
export function mapRepo(r: Repo) {
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
