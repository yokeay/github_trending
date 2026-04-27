import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('@/lib/db', () => {
  const mockRun = vi.fn();
  const mockGet = vi.fn();

  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ get: mockGet })),
        })),
      })),
      delete: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ run: mockRun })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ run: mockRun }),
        }),
      })),
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({ run: mockRun }),
      })),
    },
    _mockRun: mockRun,
    _mockGet: mockGet,
  };
});

import { getCached, setCache, deleteCache, clearExpiredCache } from '@/lib/cache';
import { _mockRun, _mockGet } from '@/lib/db';

describe('cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementations
    (_mockRun as ReturnType<typeof vi.fn>).mockReset();
    (_mockGet as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('getCached()', () => {
    it('should return null when no entry exists', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockReturnValueOnce(undefined);

      const result = getCached('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return parsed data when entry exists and not expired', () => {
      const cachedData = { foo: 'bar' };
      (_mockGet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        key: 'test-key',
        data: JSON.stringify(cachedData),
        expiresAt: Date.now() + 100000,
      });

      const result = getCached('test-key');

      expect(result).toEqual(cachedData);
    });

    it('should return null for expired entries', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        key: 'expired-key',
        data: JSON.stringify({ foo: 'bar' }),
        expiresAt: Date.now() - 1000,
      });

      const result = getCached('expired-key');

      expect(result).toBeNull();
      // Note: auto-evict is called but we only verify null return
    });

    it('should return null when JSON parsing fails', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        key: 'bad-data',
        data: 'invalid json {{{',
        expiresAt: Date.now() + 100000,
      });

      const result = getCached('bad-data');

      expect(result).toBeNull();
    });

    it('should return null on DB error', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = getCached('error-key');

      expect(result).toBeNull();
    });
  });

  describe('setCache()', () => {
    it('should insert new entry when key does not exist', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockReturnValueOnce(undefined);

      setCache('new-key', { data: 'value' });

      // Insert path is used when no existing key
      expect(_mockRun as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });

    it('should update existing entry when key exists', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        key: 'existing-key',
        data: '{}',
        expiresAt: 0,
      });

      setCache('existing-key', { updated: true });

      // Update path is used when key exists
      expect(_mockRun as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });

    it('should use custom TTL when provided', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockReturnValueOnce(undefined);

      setCache('custom-ttl-key', { data: 'value' }, 60000);

      expect(_mockRun as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    });

    it('should handle errors non-fatally', () => {
      (_mockGet as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      expect(() => setCache('error-key', { data: 'value' })).not.toThrow();
    });
  });

  describe('deleteCache()', () => {
    it('should execute delete operation', () => {
      // Just verify no exception is thrown
      expect(() => deleteCache('test-key')).not.toThrow();
    });
  });

  describe('clearExpiredCache()', () => {
    it('should execute clear operation', () => {
      // Just verify no exception is thrown
      expect(() => clearExpiredCache()).not.toThrow();
    });
  });
});
