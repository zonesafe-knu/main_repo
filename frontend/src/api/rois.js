// ROI(위험구역) API (명세 §4 기반 mock).
// 백엔드 연동 시 각 함수 본문의 mock 로직을 `apiRequest(...)` 호출로 교체하세요.
// 호출부는 반환 shape만 알면 되므로 컴포넌트 코드는 손대지 않아도 됩니다.

const MOCK_LATENCY_MS = 200;

// 최초 mock 데이터 (명세 §4.1 응답 예시 기반)
const initialMockRois = [
  {
    roiId: 1,
    cameraId: 1,
    name: '#1 지게차 진입 구역',
    polygon: [[200, 300], [800, 300], [800, 800], [200, 800]],
    alarmRule: 'WORKER_ALONE_OR_INTERACTION',
    muteForkliftOnly: true,
    dangerDistanceThreshold: 150,
    active: true,
    createdAt: '2026-04-01T09:10:00Z',
  },
  {
    roiId: 2,
    cameraId: 1,
    name: '#2 로봇 접근 구역',
    polygon: [[1100, 250], [1700, 250], [1700, 700], [1100, 700]],
    alarmRule: 'WORKER_ONLY',
    muteForkliftOnly: false,
    dangerDistanceThreshold: 100,
    active: true,
    createdAt: '2026-04-01T10:20:00Z',
  },
];

// mock store — 세션 내에서 CRUD 결과 유지 (백엔드 가동 시 DB가 이 역할).
let mockRois = [...initialMockRois];
let mockNextId = 3;

const delay = () => new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));

// ===== 4.1 ROI 목록 조회 =====
export async function fetchRois({ cameraId } = {}) {
  await delay();
  return mockRois.filter(
    (r) => cameraId === undefined || r.cameraId === cameraId
  );
  // 백엔드 연동:
  //   return apiRequest('/rois', { query: { cameraId } });
}

// ===== 4.3 ROI 상세 조회 =====
export async function fetchRoi(roiId) {
  await delay();
  const roi = mockRois.find((r) => r.roiId === roiId);
  if (!roi) throw new Error('ROI를 찾을 수 없습니다.');
  return roi;
  // 백엔드 연동:
  //   return apiRequest(`/rois/${roiId}`);
}

// ===== 4.2 ROI 생성 =====
export async function createRoi(payload) {
  await delay();
  const newRoi = {
    roiId: mockNextId++,
    cameraId: payload.cameraId,
    name: payload.name,
    polygon: payload.polygon,
    alarmRule: payload.alarmRule ?? 'WORKER_ALONE_OR_INTERACTION',
    muteForkliftOnly: payload.muteForkliftOnly ?? true,
    dangerDistanceThreshold: payload.dangerDistanceThreshold ?? 150,
    active: payload.active ?? true,
    createdAt: new Date().toISOString(),
  };
  mockRois = [...mockRois, newRoi];
  return newRoi;
  // 백엔드 연동:
  //   return apiRequest('/rois', { method: 'POST', body: payload });
}

// ===== 4.3 ROI 수정 =====
export async function updateRoi(roiId, payload) {
  await delay();
  const idx = mockRois.findIndex((r) => r.roiId === roiId);
  if (idx === -1) throw new Error('ROI를 찾을 수 없습니다.');
  const updated = { ...mockRois[idx], ...payload };
  mockRois = [
    ...mockRois.slice(0, idx),
    updated,
    ...mockRois.slice(idx + 1),
  ];
  return updated;
  // 백엔드 연동:
  //   return apiRequest(`/rois/${roiId}`, { method: 'PUT', body: payload });
}

// ===== 4.3 ROI 활성화 토글 =====
export async function setRoiActive(roiId, active) {
  await delay();
  const idx = mockRois.findIndex((r) => r.roiId === roiId);
  if (idx === -1) throw new Error('ROI를 찾을 수 없습니다.');
  const updated = { ...mockRois[idx], active };
  mockRois = [
    ...mockRois.slice(0, idx),
    updated,
    ...mockRois.slice(idx + 1),
  ];
  return updated;
  // 백엔드 연동:
  //   return apiRequest(`/rois/${roiId}/active`, { method: 'PATCH', body: { active } });
}

// ===== 4.3 ROI 삭제 =====
export async function deleteRoi(roiId) {
  await delay();
  const exists = mockRois.some((r) => r.roiId === roiId);
  if (!exists) throw new Error('ROI를 찾을 수 없습니다.');
  mockRois = mockRois.filter((r) => r.roiId !== roiId);
  // 백엔드 연동:
  //   return apiRequest(`/rois/${roiId}`, { method: 'DELETE' });
}
