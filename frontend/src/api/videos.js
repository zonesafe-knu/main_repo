// 영상 업로드·분석 API (명세 §15). 백엔드 /api/v1/videos 호출.

import { apiRequest, BASE_URL, ApiError } from './client';
import { getSession } from '../auth/session';

// ===== 15.1 영상 업로드 (multipart/form-data) =====
// apiRequest 는 JSON 전용이라 multipart 요청은 직접 fetch.
export async function uploadVideo(
  file,
  { name, siteId, cameraContext, description } = {}
) {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  if (siteId != null) formData.append('siteId', String(siteId));
  if (cameraContext != null) formData.append('cameraContext', String(cameraContext));
  if (description) formData.append('description', description);

  const session = getSession();
  const headers = {};
  if (session) headers.Authorization = `Bearer ${session.companyCode}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}/videos/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError('NETWORK', '네트워크 오류가 발생했습니다.', 0);
  }

  if (res.status === 204) return null;

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new ApiError('INTERNAL_ERROR', '응답을 처리할 수 없습니다.', res.status);
  }

  if (!res.ok || payload.success === false) {
    throw new ApiError(
      payload.code ?? 'INTERNAL_ERROR',
      payload.message ?? '영상 업로드에 실패했습니다.',
      res.status
    );
  }

  return payload.data;
}

// ===== 15.2 영상 목록 조회 =====
export async function fetchVideos({ cameraContext, status, siteId, page = 0, size = 20, sort = 'uploadedAt,desc' } = {}) {
  return apiRequest('/videos', {
    query: { cameraContext, status, siteId, page, size, sort },
  });
}

// ===== 15.3 영상 상세 조회 =====
export async function fetchVideo(videoId) {
  return apiRequest(`/videos/${videoId}`);
}

// ===== 15.4 영상 삭제 =====
export async function deleteVideo(videoId) {
  return apiRequest(`/videos/${videoId}`, { method: 'DELETE' });
}

// ===== 사전 분석된 detection 프레임 일괄 조회 =====
// 영상 재생 시작(onPlay) 시점에 호출 — 백엔드가 지금까지 분석한 모든 detection 프레임을 한 번에 받아 버퍼를 채운다.
// 분석은 백엔드에서 계속 진행되므로, 재생 직전에 호출할수록 더 많은 구간 커버됨.
// 응답: [{ videoTimeSec, objects: [{label, bbox, confidence, trackId}] }, ...]
export async function fetchDetectionFrames(videoId) {
  return apiRequest(`/videos/${videoId}/detection-frames`);
}

// ===== 15.8 스트리밍 / 다운로드 / 썸네일 — <video src>에 바로 꽂는 절대 URL =====
export function getVideoStreamUrl(videoId) {
  return `${BASE_URL}/videos/${videoId}/stream`;
}
export function getVideoDownloadUrl(videoId) {
  return `${BASE_URL}/videos/${videoId}/download`;
}
export function getVideoThumbnailUrl(videoId) {
  return `${BASE_URL}/videos/${videoId}/thumbnail`;
}