// 실시간 탐지 결과 API (명세 §7). 백엔드 GET /api/v1/detections/latest 호출.
// 화면 단위는 polling 기반 — 실시간 frame 단위 push 는 WebSocket(/topic/detections/{cameraId}) 사용.

import { apiRequest } from './client';

export async function fetchLatestDetection({ cameraId } = {}) {
  return apiRequest('/detections/latest', { query: { cameraId } });
}