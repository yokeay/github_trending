import { describe, it, expect } from 'vitest';
import { ok } from '@/lib/api-client';
import { ALL_LABELS, SIMPLE_CATEGORIES, MULTI_CATEGORIES } from '@/lib/github';

// Mock next-intl/server
const setRequestLocaleMock = vi.fn();
vi.mock('next-intl/server', () => ({
  setRequestLocale: setRequestLocaleMock,
}));

describe('categories API logic', () => {
  it('should map all labels to category objects', () => {
    const categories = Object.entries(ALL_LABELS).map(([, label]) => ({
      key: label, // Using label as key for this test
      label,
    }));

    expect(categories.length).toBeGreaterThan(0);
    categories.forEach(cat => {
      expect(cat.label).toBeDefined();
    });
  });

  it('should include all simple categories', () => {
    const simpleKeys = Object.keys(SIMPLE_CATEGORIES);
    const allKeys = Object.keys(ALL_LABELS);
    simpleKeys.forEach(key => {
      expect(allKeys).toContain(key);
    });
  });

  it('should include all multi categories', () => {
    const multiKeys = Object.keys(MULTI_CATEGORIES);
    const allKeys = Object.keys(ALL_LABELS);
    multiKeys.forEach(key => {
      expect(allKeys).toContain(key);
    });
  });

  it('should produce ok-formatted response', () => {
    const categories = Object.entries(ALL_LABELS).map(([, label]) => ({
      key: label,
      label,
    }));

    const response = ok(categories);
    expect(response.code).toBe(0);
    expect(response.message).toBe('ok');
    expect(response.data).toEqual(categories);
  });

  it('should have valid labels for each category', () => {
    Object.entries(ALL_LABELS).forEach(([, label]) => {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});
