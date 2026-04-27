import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, err, ErrorCodes, httpStatus, ApiError, apiFetch } from '@/lib/api-client';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api-client', () => {
  describe('ok()', () => {
    it('should return correct format for string', () => {
      const result = ok('test');
      expect(result).toEqual({ code: 0, message: 'ok', data: 'test' });
    });

    it('should return correct format for object', () => {
      const result = ok({ key: 'value' });
      expect(result).toEqual({ code: 0, message: 'ok', data: { key: 'value' } });
    });

    it('should return correct format for array', () => {
      const result = ok([1, 2, 3]);
      expect(result).toEqual({ code: 0, message: 'ok', data: [1, 2, 3] });
    });

    it('should return correct format for null', () => {
      const result = ok(null);
      expect(result).toEqual({ code: 0, message: 'ok', data: null });
    });
  });

  describe('err()', () => {
    it('should return error format', () => {
      const result = err(4001, 'Invalid params');
      expect(result).toEqual({ code: 4001, message: 'Invalid params', data: null });
    });

    it('should handle different error codes', () => {
      expect(err(4002, 'Not found')).toEqual({ code: 4002, message: 'Not found', data: null });
      expect(err(5001, 'API error')).toEqual({ code: 5001, message: 'API error', data: null });
    });
  });

  describe('ErrorCodes', () => {
    it('should have all required codes', () => {
      expect(ErrorCodes.INVALID_PARAMS).toBe(4001);
      expect(ErrorCodes.CATEGORY_NOT_FOUND).toBe(4002);
      expect(ErrorCodes.RESOURCE_NOT_FOUND).toBe(4003);
      expect(ErrorCodes.GITHUB_API_ERROR).toBe(5001);
      expect(ErrorCodes.CACHE_ERROR).toBe(5002);
      expect(ErrorCodes.RATE_LIMITED).toBe(5003);
      expect(ErrorCodes.DB_ERROR).toBe(5004);
      expect(ErrorCodes.INTERNAL_ERROR).toBe(5000);
    });
  });

  describe('httpStatus()', () => {
    it('should map 4xxx to 400', () => {
      expect(httpStatus(4001)).toBe(400);
      expect(httpStatus(4002)).toBe(400);
      expect(httpStatus(4999)).toBe(400);
    });

    it('should map 5xxx to 500', () => {
      expect(httpStatus(5001)).toBe(500);
      expect(httpStatus(5002)).toBe(500);
      expect(httpStatus(5999)).toBe(500);
    });

    it('should default to 500 for unknown codes', () => {
      expect(httpStatus(0)).toBe(500);
      expect(httpStatus(200)).toBe(500);
    });
  });

  describe('ApiError', () => {
    it('should be an instance of Error', () => {
      const error = new ApiError(4001, 'Test error');
      expect(error).toBeInstanceOf(Error);
    });

    it('should have code and message', () => {
      const error = new ApiError(5001, 'API failed');
      expect(error.code).toBe(5001);
      expect(error.message).toBe('API failed');
      expect(error.name).toBe('ApiError');
    });

    it('should store original data', () => {
      const originalData = { some: 'data' };
      const error = new ApiError(4001, 'Error', originalData);
      expect(error.originalData).toEqual(originalData);
    });
  });

  describe('apiFetch()', () => {
    beforeEach(() => {
      mockFetch.mockReset();
    });

    it('should return data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ code: 0, message: 'ok', data: { test: true } }),
      });

      const result = await apiFetch<{ test: boolean }>('/api/test');
      expect(result).toEqual({ test: true });
    });

    it('should throw ApiError on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ code: 4001, message: 'Invalid params', data: null }),
      });

      await expect(apiFetch('/api/test')).rejects.toThrow(ApiError);
    });

    it('should append query params', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ code: 0, message: 'ok', data: null }),
      });

      await apiFetch('/api/test', { params: { page: 1, category: 'trending' } });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test?page=1&category=trending',
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('should skip undefined/null params', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ code: 0, message: 'ok', data: null }),
      });

      await apiFetch('/api/test', { params: { page: 1, search: undefined, category: null } });

      expect(mockFetch).toHaveBeenCalledWith('/api/test?page=1', expect.anything());
    });

    it('should handle non-200 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Should try to parse JSON and throw
      await expect(apiFetch('/api/test')).rejects.toBeDefined();
    });
  });
});
