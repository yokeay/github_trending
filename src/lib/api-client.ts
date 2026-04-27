// ── 统一 API 响应格式 & 错误码 ──────────────────────────────────
// 遵循需求规范：错误码 4 位数字

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// ── 错误码定义 ─────────────────────────────────────────────────
export const ErrorCodes = {
  // 4xxx — 客户端错误
  INVALID_PARAMS: 4001, // 参数错误
  CATEGORY_NOT_FOUND: 4002, // 分类不存在
  RESOURCE_NOT_FOUND: 4003, // 资源不存在
  // 5xxx — 服务端错误
  GITHUB_API_ERROR: 5001, // GitHub API 调用失败
  CACHE_ERROR: 5002, // 缓存层错误
  RATE_LIMITED: 5003, // 限流触发
  DB_ERROR: 5004, // 数据库错误
  INTERNAL_ERROR: 5000, // 通用内部错误
} as const;

// ── 工厂函数 ───────────────────────────────────────────────────
export function ok<T>(data: T): ApiResponse<T> {
  return { code: 0, message: 'ok', data };
}

export function err(code: number, message: string): ApiResponse<null> {
  return { code, message, data: null };
}

// ── HTTP 状态码映射 ─────────────────────────────────────────────
export function httpStatus(code: number): number {
  if (code >= 4001 && code <= 4999) return 400;
  if (code >= 5001 && code <= 5999) return 500;
  return 500;
}

// ── 前端 API 请求封装 ───────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public originalData?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        searchParams.set(k, String(v));
      }
    });
    const qs = searchParams.toString();
    fullUrl = qs ? `${url}?${qs}` : url;
  }

  const res = await fetch(fullUrl, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  const json = await res.json();

  if (json.code && json.code !== 0) {
    throw new ApiError(json.code, json.message, json.data);
  }

  return json.data as T;
}
