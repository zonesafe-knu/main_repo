// 카메라 API (명세 §3 기반 mock).
// 백엔드 연동 시 각 함수 본문의 mock 로직을 `apiRequest(...)` 호출로 교체하세요.

const MOCK_LATENCY_MS = 250;

// 최초 mock 데이터 (명세 §3.1 응답 예시 기반)
const initialMockCameras = [
  {
    cameraId: 1, name: '1번 라인 입구', rtspUrl: 'rtsp://192.168.0.10/stream1',
    siteId: 1, siteName: '대구공장 A동',
    resolution: '1920x1080', fps: 30, status: 'ONLINE',
    lastHeartbeat: '2026-04-28T14:29:55Z',
  },
  {
    cameraId: 2, name: '2번 적재구역', rtspUrl: 'rtsp://192.168.0.11/stream1',
    siteId: 1, siteName: '대구공장 A동',
    resolution: '1920x1080', fps: 30, status: 'ONLINE',
    lastHeartbeat: '2026-04-28T14:29:50Z',
  },
  {
    cameraId: 3, name: '3번 출하장', rtspUrl: 'rtsp://192.168.0.12/stream1',
    siteId: 1, siteName: '대구공장 A동',
    resolution: '1920x1080', fps: 30, status: 'ONLINE',
    lastHeartbeat: '2026-04-28T14:29:40Z',
  },
  {
    cameraId: 4, name: 'B동 입구', rtspUrl: 'rtsp://192.168.0.20/stream1',
    siteId: 2, siteName: '대구공장 B동',
    resolution: '1920x1080', fps: 30, status: 'ONLINE',
    lastHeartbeat: '2026-04-28T14:29:30Z',
  },
];

// mock store — 세션 내 CRUD 결과 유지 (백엔드 가동 시 DB가 이 역할)
let mockCameras = [...initialMockCameras];
let mockNextCameraId = 5;

const delay = () => new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));

// payload에서 siteId/siteName을 결정하는 helper.
// 명세서는 siteId만 받지만, 현재 프론트는 siteName으로 사이트를 식별하므로 둘 다 지원.
// 실제 백엔드 연결 시엔 이 helper 불필요 — siteId만 보내면 됨.
function resolveSite(payload) {
  if (payload.siteId !== undefined) {
    const existing = mockCameras.find((c) => c.siteId === payload.siteId);
    return {
      siteId: payload.siteId,
      siteName: payload.siteName ?? existing?.siteName ?? `Site ${payload.siteId}`,
    };
  }
  if (payload.siteName) {
    const existing = mockCameras.find((c) => c.siteName === payload.siteName);
    if (existing) {
      return { siteId: existing.siteId, siteName: payload.siteName };
    }
    // 신규 사이트 — siteId 자동 생성
    const maxSiteId = mockCameras.reduce((max, c) => Math.max(max, c.siteId), 0);
    return { siteId: maxSiteId + 1, siteName: payload.siteName };
  }
  throw new Error('siteId 또는 siteName이 필요합니다.');
}

// ===== 3.1 카메라 목록 조회 =====
export async function fetchCameras({ siteId, status } = {}) {
  await delay();
  return mockCameras.filter(
    (c) =>
      (siteId === undefined || c.siteId === siteId) &&
      (status === undefined || c.status === status)
  );
  // 백엔드 연동:
  //   return apiRequest('/cameras', { query: { siteId, status } });
}

// ===== 3.2 카메라 상세 조회 =====
export async function fetchCamera(cameraId) {
  await delay();
  const cam = mockCameras.find((c) => c.cameraId === cameraId);
  if (!cam) throw new Error('카메라를 찾을 수 없습니다.');
  return cam;
  // 백엔드 연동:
  //   return apiRequest(`/cameras/${cameraId}`);
}

// ===== 3.3 카메라 등록 =====
export async function createCamera(payload) {
  await delay();
  const { siteId, siteName } = resolveSite(payload);
  const newCamera = {
    cameraId: mockNextCameraId++,
    name: payload.name,
    rtspUrl: payload.rtspUrl ?? '',
    siteId,
    siteName,
    resolution: payload.resolution ?? '1920x1080',
    fps: payload.fps ?? 30,
    status: 'ONLINE',
    lastHeartbeat: new Date().toISOString(),
  };
  mockCameras = [...mockCameras, newCamera];
  return newCamera;
  // 백엔드 연동:
  //   return apiRequest('/cameras', { method: 'POST', body: payload });
}

// ===== 3.4 카메라 수정 =====
export async function updateCamera(cameraId, payload) {
  await delay();
  const idx = mockCameras.findIndex((c) => c.cameraId === cameraId);
  if (idx === -1) throw new Error('카메라를 찾을 수 없습니다.');
  const updated = { ...mockCameras[idx], ...payload };
  mockCameras = [
    ...mockCameras.slice(0, idx),
    updated,
    ...mockCameras.slice(idx + 1),
  ];
  return updated;
  // 백엔드 연동:
  //   return apiRequest(`/cameras/${cameraId}`, { method: 'PUT', body: payload });
}

// ===== 3.4 카메라 삭제 =====
export async function deleteCamera(cameraId) {
  await delay();
  const exists = mockCameras.some((c) => c.cameraId === cameraId);
  if (!exists) throw new Error('카메라를 찾을 수 없습니다.');
  mockCameras = mockCameras.filter((c) => c.cameraId !== cameraId);
  // 백엔드 연동:
  //   return apiRequest(`/cameras/${cameraId}`, { method: 'DELETE' });
}

// ===== 3.5 실시간 스트림 URL 발급 =====
export async function fetchCameraStream(cameraId) {
  await delay();
  const cam = mockCameras.find((c) => c.cameraId === cameraId);
  if (!cam) throw new Error('카메라를 찾을 수 없습니다.');
  // mock에서는 샘플 영상 반환. 실제 백엔드는 HLS .m3u8 URL 반환.
  return {
    streamUrl: '/videos/sample.mp4',
    type: 'HLS',
  };
  // 백엔드 연동:
  //   return apiRequest(`/cameras/${cameraId}/stream`);
}
