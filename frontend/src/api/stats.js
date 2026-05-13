// 대시보드 통계 API (명세 §8 기반 mock).
// 백엔드 연동 시 본문을 다음으로 교체:
//   return apiRequest('/stats/summary', { query: { from, to } });
//
// mock 동안에는 alarms mock 과 같은 데이터에서 집계해 화면 간 정합성 유지.

import { _getMockAlarms } from './alarms';

const MOCK_LATENCY_MS = 180;

export async function fetchStatsSummary({ from, to } = {}) {
  await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));

  const fromMs = from ? Date.parse(from) : -Infinity;
  const toMs = to ? Date.parse(to) : Infinity;

  const inRange = _getMockAlarms().filter((a) => {
    const t = Date.parse(a.occurredAt);
    return t >= fromMs && t <= toMs;
  });

  const byseverity = { INFO: 0, WARN: 0, DANGER: 0 };
  for (const a of inRange) {
    byseverity[a.severity] = (byseverity[a.severity] ?? 0) + 1;
  }

  return {
    totalAlarms: inRange.length,
    byseverity,
    totalClips: inRange.filter((a) => a.clipId != null).length,
    activeCameras: 4,
    totalCameras: 4,
    avgFps: 28.4,
  };
}
