// 백엔드 공용 fetch 래퍼 (명세 §1 기반).
// 현재 도메인 stub들은 mock 응답을 직접 반환하므로 호출되지 않지만,
// 백엔드 연동 시 각 stub 본문을 `apiRequest(...)` 호출로 교체하면 됩니다.

import { getSession } from '../auth/session';

const BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function buildAuthHeader() {
  const session = getSession();
  if (!session) return undefined;
  // TODO: 실제 JWT 도입 시 session.accessToken 으로 교체.
  return `Bearer ${session.companyCode}`;
}

export async function apiRequest(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers = { 'Content-Type': 'application/json' };
  const auth = buildAuthHeader();
  if (auth) headers.Authorization = auth;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK', '네트워크 오류가 발생했습니다.', 0);
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new ApiError('INTERNAL_ERROR', '응답을 처리할 수 없습니다.', res.status);
  }

  if (!res.ok || payload.success === false) {
    throw new ApiError(
      payload.code ?? 'INTERNAL_ERROR',
      payload.message ?? '서버 오류가 발생했습니다.',
      res.status
    );
  }

  return payload.data;
}
