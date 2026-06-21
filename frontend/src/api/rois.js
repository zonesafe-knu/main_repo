// ROI(위험구역) API (명세 §4). 백엔드 /api/v1/rois 호출.

import { apiRequest } from './client';

// ===== 4.1 ROI 목록 조회 =====
export async function fetchRois({ cameraId } = {}) {
  return apiRequest('/rois', { query: { cameraId } });
}

// ===== 4.3 ROI 상세 조회 =====
export async function fetchRoi(roiId) {
  return apiRequest(`/rois/${roiId}`);
}

// ===== 4.2 ROI 생성 =====
export async function createRoi(payload) {
  return apiRequest('/rois', { method: 'POST', body: payload });
}

// ===== 4.3 ROI 수정 =====
export async function updateRoi(roiId, payload) {
  return apiRequest(`/rois/${roiId}`, { method: 'PUT', body: payload });
}

// ===== 4.3 ROI 활성화 토글 =====
// 백엔드 PATCH /rois/{id}/active 는 단순 토글이라 두 번째 인자(active)는 사용되지 않음.
export async function setRoiActive(roiId /* , active */) {
  return apiRequest(`/rois/${roiId}/active`, { method: 'PATCH' });
}

// ===== 4.3 ROI 삭제 =====
export async function deleteRoi(roiId) {
  return apiRequest(`/rois/${roiId}`, { method: 'DELETE' });
}