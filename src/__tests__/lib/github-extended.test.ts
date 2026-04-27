import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper to create mock fetch response
function createMockResponse(data: unknown, remaining = '100') {
  const jsonStr = JSON.stringify(data);
  const chunks: Uint8Array[] = [];
  // Split into chunks of 10 characters for realistic streaming
  for (let i = 0; i < jsonStr.length; i += 10) {
    const chunk = jsonStr.slice(i, i + 10);
    const encoder = new TextEncoder();
    chunks.push(encoder.encode(chunk));
  }

  let chunkIndex = 0;
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => {
        if (name === 'x-ratelimit-remaining') return remaining;
        if (name === 'x-ratelimit-limit') return '100';
        if (name === 'x-ratelimit-reset') return '100';
        return null;
      },
    },
    body: {
      getReader: () => ({
        read: async () => {
          if (chunkIndex < chunks.length) {
            const value = chunks[chunkIndex++];
            return { done: false, value };
          }
          return { done: true };
        },
      }),
    },
  };
}

function createMockErrorResponse(status: number, message: string) {
  const jsonStr = JSON.stringify({ message });
  const encoder = new TextEncoder();
  const encoded = encoder.encode(jsonStr);

  return {
    ok: false,
    status,
    headers: {
      get: () => '0',
    },
    body: {
      getReader: () => ({
        read: async () => ({ done: true, value: encoded }),
      }),
    },
  };
}

import { searchRepos, getRepoDetail, getRepoReadme, getRateLimitStatus } from '@/lib/github';

describe('github - API functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchRepos()', () => {
    it('should construct query for rust category', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ total_count: 1, items: [] }));
      global.fetch = mockFetch;

      await searchRepos({ category: 'rust', page: 1, per_page: 30, days: 7 });

      expect(mockFetch).toHaveBeenCalled();
      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toContain('api.github.com');
      expect(url).toContain('/search/repositories');
    });

    it('should include search term in query', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ total_count: 0, items: [] }));
      global.fetch = mockFetch;

      await searchRepos({ category: 'rust', page: 1, per_page: 30, days: 7, search: 'tokio' });

      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toContain('tokio');
    });

    it('should return rate limit from response headers', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ total_count: 5, items: [] }, '50'));
      global.fetch = mockFetch;

      const result = await searchRepos({ category: 'rust', page: 1, per_page: 30, days: 7 });

      expect(result.rateLimit.remaining).toBe('50');
      expect(result.rateLimit.limit).toBe('100');
    });

    it('should handle multi-category with multiple subQueries', async () => {
      // Mock needs to handle 3 calls for AI category's subQueries
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          createMockResponse({
            total_count: 10,
            items: [
              {
                id: 1,
                name: 'test-repo',
                full_name: 'u/test-repo',
                html_url: 'https://github.com/u/test-repo',
                description: 'Test',
                language: 'TypeScript',
                stargazers_count: 100,
                forks_count: 10,
                open_issues_count: 1,
                watchers_count: 100,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                pushed_at: '2024-01-01T00:00:00Z',
                topics: ['ai'],
                owner: {
                  login: 'u',
                  avatar_url: 'https://avatars.githubusercontent.com/u/1',
                  html_url: 'https://github.com/u',
                },
                homepage: null,
                size: 100,
                default_branch: 'main',
              },
            ],
          })
        )
      );
      global.fetch = mockFetch;

      const result = await searchRepos({ category: 'ai', page: 1, per_page: 30, days: 7 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.data.items.length).toBe(1);
    });

    it('should sort multi-category results by stars descending', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        const stars = callCount === 1 ? 50 : 100;
        return Promise.resolve(
          createMockResponse({
            total_count: 2,
            items: [
              {
                id: callCount,
                name: `repo-${callCount}`,
                full_name: `u/repo-${callCount}`,
                html_url: '',
                description: null,
                language: null,
                stargazers_count: stars,
                forks_count: 0,
                open_issues_count: 0,
                watchers_count: 0,
                created_at: '',
                updated_at: '',
                pushed_at: '',
                topics: [],
                owner: { login: 'u', avatar_url: '', html_url: '' },
                homepage: null,
                size: 0,
                default_branch: 'main',
              },
            ],
          })
        );
      });
      global.fetch = mockFetch;

      const result = await searchRepos({ category: 'ai', page: 1, per_page: 30, days: 7 });

      expect(result.data.items[0].stargazers_count).toBe(100);
    });

    it('should slice results to per_page limit', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          total_count: 100,
          items: Array.from({ length: 50 }, (_, i) => ({
            id: i,
            name: `repo-${i}`,
            full_name: `u/repo-${i}`,
            html_url: '',
            description: null,
            language: null,
            stargazers_count: 10 + i,
            forks_count: 0,
            open_issues_count: 0,
            watchers_count: 0,
            created_at: '',
            updated_at: '',
            pushed_at: '',
            topics: [],
            owner: { login: 'u', avatar_url: '', html_url: '' },
            homepage: null,
            size: 0,
            default_branch: 'main',
          })),
        })
      );
      global.fetch = mockFetch;

      const result = await searchRepos({ category: 'ai', page: 1, per_page: 10, days: 7 });

      expect(result.data.items.length).toBeLessThanOrEqual(10);
    });

    it('should handle rejected sub-query gracefully', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(createMockResponse({ total_count: 5, items: [] }));
        }
        return Promise.reject(new Error('Network error'));
      });
      global.fetch = mockFetch;

      const result = await searchRepos({ category: 'ai', page: 1, per_page: 30, days: 7 });

      expect(result.data).toBeDefined();
    });
  });

  describe('getRepoDetail()', () => {
    it('should fetch repo by owner and repo name', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          id: 123,
          name: 'test-repo',
          full_name: 'user/test-repo',
          html_url: 'https://github.com/user/test-repo',
          description: 'A test repo',
          language: 'TypeScript',
          stargazers_count: 100,
          forks_count: 50,
          open_issues_count: 10,
          watchers_count: 100,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          pushed_at: '2024-01-03T00:00:00Z',
          topics: ['typescript'],
          license: { spdx_id: 'MIT' },
          owner: {
            login: 'user',
            avatar_url: 'https://avatars.githubusercontent.com/u/1',
            html_url: 'https://github.com/user',
          },
          homepage: 'https://example.com',
          size: 1024,
          default_branch: 'main',
        })
      );
      global.fetch = mockFetch;

      const result = await getRepoDetail('user', 'test-repo');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/user/test-repo',
        expect.any(Object)
      );
      expect(result.data.name).toBe('test-repo');
    });
  });

  describe('getRepoReadme()', () => {
    it('should decode base64 readme content', async () => {
      const base64Content = Buffer.from('Hello World').toString('base64');
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse({ content: base64Content }));
      global.fetch = mockFetch;

      const result = await getRepoReadme('user', 'test-repo');

      expect(result.content).toBe('Hello World');
    });

    it('should return null content on error', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockErrorResponse(404, 'Not Found'));
      global.fetch = mockFetch;

      const result = await getRepoReadme('user', 'nonexistent-repo');

      expect(result.content).toBeNull();
      expect(result.rateLimit).toEqual({ remaining: '0', limit: '0', reset: '0' });
    });
  });

  describe('getRateLimitStatus()', () => {
    it('should fetch rate limit status', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        createMockResponse({
          rate: { limit: 5000, remaining: 4999, reset: 1234567890 },
        })
      );
      global.fetch = mockFetch;

      const result = await getRateLimitStatus();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/rate_limit',
        expect.any(Object)
      );
      expect(result.data.rate.remaining).toBe(4999);
    });
  });
});
