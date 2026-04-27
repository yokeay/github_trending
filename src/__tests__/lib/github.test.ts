import { describe, it, expect } from 'vitest';
import { SIMPLE_CATEGORIES, MULTI_CATEGORIES, ALL_LABELS, mapRepo } from '@/lib/github';

describe('github', () => {
  describe('SIMPLE_CATEGORIES', () => {
    it('should have required categories', () => {
      expect(SIMPLE_CATEGORIES.trending).toBeDefined();
      expect(SIMPLE_CATEGORIES.rust).toBeDefined();
      expect(SIMPLE_CATEGORIES.python).toBeDefined();
      expect(SIMPLE_CATEGORIES.java).toBeDefined();
      expect(SIMPLE_CATEGORIES.vue).toBeDefined();
      expect(SIMPLE_CATEGORIES.react).toBeDefined();
      expect(SIMPLE_CATEGORIES.nestjs).toBeDefined();
      expect(SIMPLE_CATEGORIES.cpp).toBeDefined();
      expect(SIMPLE_CATEGORIES['fast-growing']).toBeDefined();
    });

    it('should have label for each category', () => {
      Object.entries(SIMPLE_CATEGORIES).forEach(([, config]) => {
        expect(config.label).toBeDefined();
      });
    });
  });

  describe('MULTI_CATEGORIES', () => {
    it('should have ai and cicd categories', () => {
      expect(MULTI_CATEGORIES.ai).toBeDefined();
      expect(MULTI_CATEGORIES.cicd).toBeDefined();
    });

    it('should have subQueries for multi categories', () => {
      expect(MULTI_CATEGORIES.ai.subQueries).toBeDefined();
      expect(Array.isArray(MULTI_CATEGORIES.ai.subQueries)).toBe(true);
      expect(MULTI_CATEGORIES.ai.subQueries.length).toBeGreaterThan(0);
    });
  });

  describe('ALL_LABELS', () => {
    it('should include all simple category labels', () => {
      Object.entries(SIMPLE_CATEGORIES).forEach(([key, config]) => {
        expect(ALL_LABELS[key]).toBe(config.label);
      });
    });

    it('should include all multi category labels', () => {
      Object.entries(MULTI_CATEGORIES).forEach(([key, config]) => {
        expect(ALL_LABELS[key]).toBe(config.label);
      });
    });
  });

  describe('mapRepo()', () => {
    it('should map a repo correctly', () => {
      const input = {
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
        topics: ['typescript', 'react'],
        license: { spdx_id: 'MIT' },
        owner: {
          login: 'user',
          avatar_url: 'https://avatars.githubusercontent.com/u/1',
          html_url: 'https://github.com/user',
        },
        homepage: 'https://example.com',
        size: 1024,
        default_branch: 'main',
      };

      const result = mapRepo(input);

      expect(result.id).toBe(123);
      expect(result.name).toBe('test-repo');
      expect(result.full_name).toBe('user/test-repo');
      expect(result.language).toBe('TypeScript');
      expect(result.stargazers_count).toBe(100);
      expect(result.topics).toEqual(['typescript', 'react']);
      expect(result.license).toBe('MIT');
      expect(result.owner.login).toBe('user');
    });

    it('should handle null description', () => {
      const input = {
        id: 1,
        name: 'test',
        full_name: 'user/test',
        html_url: 'https://github.com/user/test',
        description: null,
        language: null,
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        watchers_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-01T00:00:00Z',
        topics: [],
        license: null,
        owner: {
          login: 'user',
          avatar_url: 'https://avatars.githubusercontent.com/u/1',
          html_url: 'https://github.com/user',
        },
        homepage: null,
        size: 0,
        default_branch: 'main',
      };

      const result = mapRepo(input);

      expect(result.description).toBeNull();
      expect(result.language).toBeNull();
      expect(result.license).toBeNull();
      expect(result.homepage).toBeNull();
    });
  });
});
