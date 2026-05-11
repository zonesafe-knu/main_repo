// 카메라 API (명세 §3 기반 mock).
// 백엔드 연동 시 fetchCameras 본문을 다음으로 교체:
//   return apiRequest('/cameras', { query: { siteId, status } });

const MOCK_CAMERAS = [
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
    siteId: 1, siteName: '대구공장 B동',
    resolution: '1920x1080', fps: 30, status: 'ONLINE',
    lastHeartbeat: '2026-04-28T14:29:30Z',
  },
];

const MOCK_LATENCY_MS = 250;

export async function fetchCameras({ siteId, status } = {}) {
  await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
  return MOCK_CAMERAS.filter(
    (c) =>
      (siteId === undefined || c.siteId === siteId) &&
      (status === undefined || c.status === status)
  );
}
