// 실시간 탐지 결과 API (명세 §7 기반 mock).
// 백엔드 연동 시 본문을 다음으로 교체:
//   return apiRequest('/detections/latest', { query: { cameraId } });
//
// 실제로는 WebSocket(§11 `/topic/detections/{cameraId}`)을 구독해 frame 단위로 push 받지만,
// 백엔드 없이 화면 검증을 위해 polling 가능한 REST 엔드포인트만 우선 mock 한다.

const MOCK_LATENCY_MS = 80;
const MODEL_VERSION = 'yolov8m_zonesafe_v3';

// 카메라별 기본 객체 구성 — 매 호출마다 ±1 흔들어서 살아있는 느낌만 줌.
const BASE_BY_CAMERA = {
  1: { workers: 1, forklifts: 1 },
  2: { workers: 2, forklifts: 0 },
  3: { workers: 1, forklifts: 1 },
  4: { workers: 0, forklifts: 1 },
};

const buildObjects = ({ workers, forklifts }) => {
  const objects = [];
  for (let i = 0; i < workers; i++) {
    objects.push({
      trackId: 17 + i,
      label: 'worker',
      bbox: [340 + i * 90, 210, 420 + i * 90, 470],
      confidence: 0.88 + Math.random() * 0.08,
      inRoi: [10],
    });
  }
  for (let i = 0; i < forklifts; i++) {
    objects.push({
      trackId: 33 + i,
      label: 'forklift',
      bbox: [430 + i * 90, 250, 610 + i * 90, 500],
      confidence: 0.9 + Math.random() * 0.06,
      inRoi: [10],
    });
  }
  return objects;
};

export async function fetchLatestDetection({ cameraId } = {}) {
  await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
  const base = BASE_BY_CAMERA[cameraId] ?? { workers: 1, forklifts: 1 };

  return {
    cameraId: cameraId ?? null,
    frameTimestamp: new Date().toISOString(),
    objects: buildObjects(base),
    fps: Math.round((27.5 + Math.random() * 2) * 10) / 10, // 27.5 ~ 29.5
    modelVersion: MODEL_VERSION,
  };
}
