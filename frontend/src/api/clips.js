// 클립 API (명세 §6). 백엔드 /api/v1/clips 호출.

import { apiRequest, BASE_URL } from './client';

// ===== 6.1 클립 목록 조회 =====
export async function fetchClips({ cameraId, from, to, page = 0, size = 20 } = {}) {
  return apiRequest('/clips', { query: { cameraId, from, to, page, size } });
}

// ===== 6.3 스트리밍 URL — <video src>에 바로 꽂는 절대 URL =====
// Range Request 지원이라 <video>가 직접 호출. apiRequest는 사용하지 않음.
export function getClipStreamUrl(clipId) {
  return `${BASE_URL}/clips/${clipId}/stream`;
}

// ===== 6.2 다운로드 URL =====
export function getClipDownloadUrl(clipId) {
  return `${BASE_URL}/clips/${clipId}/download`;
}

// ===== 6.4 썸네일 URL =====
export function getClipThumbnailUrl(clipId) {
  return `${BASE_URL}/clips/${clipId}/thumbnail`;
}

// ===== 6.5 클립 삭제 =====
export async function deleteClip(clipId) {
  return apiRequest(`/clips/${clipId}`, { method: 'DELETE' });
}