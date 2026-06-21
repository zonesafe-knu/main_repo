// 카메라 API (명세 §3). 백엔드 /api/v1/cameras 호출.

import { apiRequest } from './client';

export async function fetchCameras({ siteId, status } = {}) {
  return apiRequest('/cameras', { query: { siteId, status } });
}

// 명세 §3.3 — name, rtspUrl, siteId, siteName 은 백엔드 NOT NULL. 호출부에서 채워서 넘긴다.
export async function createCamera(payload) {
  return apiRequest('/cameras', { method: 'POST', body: payload });
}

// 명세 §3.4 — PUT 은 전체 필드 덮어쓰기. 호출부에서 기존 값과 변경분을 합쳐 통째로 전달해야 함.
export async function updateCamera(cameraId, payload) {
  return apiRequest(`/cameras/${cameraId}`, { method: 'PUT', body: payload });
}

export async function deleteCamera(cameraId) {
  return apiRequest(`/cameras/${cameraId}`, { method: 'DELETE' });
}

// 데모용 — 백엔드 internal API 직접 호출 (운영에서는 헬스체커가 자동 갱신)
export async function setCameraStatus(cameraId, status) {
  return apiRequest(`/internal/cameras/${cameraId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}