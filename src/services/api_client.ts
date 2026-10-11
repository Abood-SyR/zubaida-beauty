const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://resonta-yalla-match-notifications.hf.space';

type QueryParameterValue = string | number | boolean | null | undefined;

function buildUrl(endpoint: string, queryParameters?: Record<string, QueryParameterValue>) {
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`);

  if (queryParameters) {
    Object.entries(queryParameters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

async function requestJson(endpoint: string, options: RequestInit = {}, queryParameters?: Record<string, QueryParameterValue>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(endpoint, queryParameters), {
    ...options,
    headers,
  });

  const responseText = await response.text();
  const result = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const errorMessage = result?.detail || result?.message || 'حدث خطأ في الاتصال بالسيرفر';
    throw new Error(errorMessage);
  }

  return result;
}

async function requestResponse(endpoint: string, options: RequestInit = {}, queryParameters?: Record<string, QueryParameterValue>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body !== undefined && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(endpoint, queryParameters), {
    ...options,
    headers,
  });

  const responseText = await response.text();
  const data = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const errorMessage = data?.detail || data?.message || 'حدث خطأ في الاتصال بالسيرفر';
    throw new Error(errorMessage);
  }

  return { status: response.status, data };
}

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  return requestJson(endpoint, options);
}

export class ApiService {
  client = {
    get: async (endpoint: string, config: { queryParameters?: Record<string, QueryParameterValue>; headers?: HeadersInit } = {}) => {
      const { queryParameters, headers } = config;
      return requestResponse(endpoint, { method: 'GET', headers }, queryParameters);
    },
    post: async (endpoint: string, data?: unknown, config: { queryParameters?: Record<string, QueryParameterValue>; headers?: HeadersInit } = {}) => {
      const body = data !== undefined ? JSON.stringify(data) : undefined;
      const { queryParameters, headers } = config;
      return requestResponse(endpoint, { method: 'POST', headers, body }, queryParameters);
    },
    postForm: async (endpoint: string, data: FormData, config: { queryParameters?: Record<string, QueryParameterValue>; headers?: HeadersInit } = {}) => {
      const { queryParameters, headers } = config;
      return requestResponse(endpoint, { method: 'POST', headers, body: data }, queryParameters);
    },
    put: async (endpoint: string, data?: unknown, config: { queryParameters?: Record<string, QueryParameterValue>; headers?: HeadersInit } = {}) => {
      const body = data !== undefined ? JSON.stringify(data) : undefined;
      const { queryParameters, headers } = config;
      return requestResponse(endpoint, { method: 'PUT', headers, body }, queryParameters);
    },
    // تمت إضافة دالة الـ patch هنا بنجاح
    patch: async (endpoint: string, data?: unknown, config: { queryParameters?: Record<string, QueryParameterValue>; headers?: HeadersInit } = {}) => {
      const body = data !== undefined ? JSON.stringify(data) : undefined;
      const { queryParameters, headers } = config;
      return requestResponse(endpoint, { method: 'PATCH', headers, body }, queryParameters);
    },
    delete: async (endpoint: string, config: { queryParameters?: Record<string, QueryParameterValue>; headers?: HeadersInit } = {}) => {
      const { queryParameters, headers } = config;
      return requestResponse(endpoint, { method: 'DELETE', headers }, queryParameters);
    },
  };
}