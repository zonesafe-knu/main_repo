// 알람 API (명세 §5 기반 mock).
// 백엔드 연동 시 각 함수 본문을 apiRequest 호출로 교체:
//   fetchAlarms     → apiRequest('/alarms', { query: { ... } })
//   ackAlarm        → apiRequest(`/alarms/${alarmId}/ack`, { method: 'PATCH' })
//   resolveAlarm    → apiRequest(`/alarms/${alarmId}/resolve`, { method: 'PATCH', body: { comment } })
//   bulkAckAlarms   → apiRequest('/alarms/bulk-ack', { method: 'POST', body: { alarmIds } })

// occurredAt 은 KST 현지시각을 UTC ISO-8601 로 변환해 저장 (명세 예시와 동일).
const kstToUtcIso = (localStr) => new Date(`${localStr}+09:00`).toISOString();

const buildAlarm = ({
  alarmId, cameraId, cameraName, severity, type, message,
  occurredAtKst, clipId, status = 'NEW',
  roiId = 10, roiName = '지게차 진입구역',
}) => ({
  alarmId,
  cameraId,
  cameraName,
  roiId,
  roiName,
  severity,
  type,
  status,
  message,
  detections: [],
  clipId,
  snapshotUrl: null,
  occurredAt: kstToUtcIso(occurredAtKst),
});

const MOCK_ALARMS = [
  // 2026-04-28
  buildAlarm({ alarmId: 1024, cameraId: 1, cameraName: '1번 라인 입구', severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 92px)',  occurredAtKst: '2026-04-28T13:21:33', clipId: 5012 }),
  buildAlarm({ alarmId: 1025, cameraId: 1, cameraName: '1번 라인 입구', severity: 'WARN',   type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 145px)', occurredAtKst: '2026-04-28T13:25:14', clipId: 5013 }),
  buildAlarm({ alarmId: 1026, cameraId: 1, cameraName: '1번 라인 입구', severity: 'INFO',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-28T13:31:02', clipId: 5014 }),
  buildAlarm({ alarmId: 1027, cameraId: 2, cameraName: '2번 적재구역', severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 78px)',  occurredAtKst: '2026-04-28T13:42:55', clipId: 5015 }),
  buildAlarm({ alarmId: 1028, cameraId: 2, cameraName: '2번 적재구역', severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 88px)',  occurredAtKst: '2026-04-28T13:48:09', clipId: 5016 }),
  buildAlarm({ alarmId: 1029, cameraId: 3, cameraName: '3번 출하장',   severity: 'WARN',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-28T13:52:36', clipId: 5017 }),
  buildAlarm({ alarmId: 1030, cameraId: 1, cameraName: '1번 라인 입구', severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 65px)',  occurredAtKst: '2026-04-28T14:05:11', clipId: 5018 }),
  buildAlarm({ alarmId: 1031, cameraId: 4, cameraName: 'B동 입구',     severity: 'INFO',   type: 'UNKNOWN_OBJECT',            message: '미확인 객체 감지',                occurredAtKst: '2026-04-28T14:18:20', clipId: 5019 }),
  buildAlarm({ alarmId: 1032, cameraId: 1, cameraName: '1번 라인 입구', severity: 'WARN',   type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 130px)', occurredAtKst: '2026-04-28T14:33:44', clipId: 5020 }),
  buildAlarm({ alarmId: 1033, cameraId: 2, cameraName: '2번 적재구역', severity: 'INFO',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-28T14:51:08', clipId: 5021 }),
  buildAlarm({ alarmId: 1034, cameraId: 3, cameraName: '3번 출하장',   severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 52px)',  occurredAtKst: '2026-04-28T15:02:17', clipId: 5022 }),
  buildAlarm({ alarmId: 1035, cameraId: 1, cameraName: '1번 라인 입구', severity: 'WARN',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-28T15:18:25', clipId: 5023 }),

  // 2026-04-27
  buildAlarm({ alarmId: 1010, cameraId: 1, cameraName: '1번 라인 입구', severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 75px)',  occurredAtKst: '2026-04-27T10:12:05', clipId: 5000 }),
  buildAlarm({ alarmId: 1011, cameraId: 2, cameraName: '2번 적재구역', severity: 'WARN',   type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 138px)', occurredAtKst: '2026-04-27T10:45:33', clipId: 5001 }),
  buildAlarm({ alarmId: 1012, cameraId: 3, cameraName: '3번 출하장',   severity: 'INFO',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-27T11:08:17', clipId: 5002 }),
  buildAlarm({ alarmId: 1013, cameraId: 1, cameraName: '1번 라인 입구', severity: 'WARN',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-27T11:33:42', clipId: 5003 }),
  buildAlarm({ alarmId: 1014, cameraId: 4, cameraName: 'B동 입구',     severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 88px)',  occurredAtKst: '2026-04-27T13:21:55', clipId: 5004 }),
  buildAlarm({ alarmId: 1015, cameraId: 2, cameraName: '2번 적재구역', severity: 'INFO',   type: 'UNKNOWN_OBJECT',            message: '미확인 객체 감지',                occurredAtKst: '2026-04-27T14:02:11', clipId: 5005 }),
  buildAlarm({ alarmId: 1016, cameraId: 1, cameraName: '1번 라인 입구', severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 60px)',  occurredAtKst: '2026-04-27T14:35:28', clipId: 5006 }),
  buildAlarm({ alarmId: 1017, cameraId: 3, cameraName: '3번 출하장',   severity: 'WARN',   type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 142px)', occurredAtKst: '2026-04-27T15:11:09', clipId: 5007 }),
  buildAlarm({ alarmId: 1018, cameraId: 1, cameraName: '1번 라인 입구', severity: 'INFO',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-27T16:23:51', clipId: 5008 }),
  buildAlarm({ alarmId: 1019, cameraId: 4, cameraName: 'B동 입구',     severity: 'WARN',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-27T17:08:33', clipId: 5009 }),

  // 2026-04-26
  buildAlarm({ alarmId: 998,  cameraId: 1, cameraName: '1번 라인 입구', severity: 'INFO',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-26T09:15:22', clipId: 4980 }),
  buildAlarm({ alarmId: 999,  cameraId: 2, cameraName: '2번 적재구역', severity: 'WARN',   type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 135px)', occurredAtKst: '2026-04-26T10:42:18', clipId: 4981 }),
  buildAlarm({ alarmId: 1000, cameraId: 1, cameraName: '1번 라인 입구', severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 71px)',  occurredAtKst: '2026-04-26T11:18:44', clipId: 4982 }),
  buildAlarm({ alarmId: 1001, cameraId: 3, cameraName: '3번 출하장',   severity: 'WARN',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-26T12:34:52', clipId: 4983 }),
  buildAlarm({ alarmId: 1002, cameraId: 4, cameraName: 'B동 입구',     severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 95px)',  occurredAtKst: '2026-04-26T13:55:07', clipId: 4984 }),
  buildAlarm({ alarmId: 1003, cameraId: 2, cameraName: '2번 적재구역', severity: 'INFO',   type: 'WORKER_INTRUSION',          message: '작업자 진입 감지',                occurredAtKst: '2026-04-26T14:22:38', clipId: 4985 }),
  buildAlarm({ alarmId: 1004, cameraId: 1, cameraName: '1번 라인 입구', severity: 'WARN',   type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 158px)', occurredAtKst: '2026-04-26T15:07:14', clipId: 4986 }),
  buildAlarm({ alarmId: 1005, cameraId: 3, cameraName: '3번 출하장',   severity: 'DANGER', type: 'WORKER_FORKLIFT_PROXIMITY', message: '작업자-지게차 근접 (거리 80px)',  occurredAtKst: '2026-04-26T16:18:25', clipId: 4987 }),
];

const MOCK_LATENCY_MS = 350;

const compareBy = (field, dir) => (a, b) => {
  const av = a[field], bv = b[field];
  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return dir === 'asc' ? cmp : -cmp;
};

export async function fetchAlarms({
  cameraId,
  roiId,
  severity,
  type,
  status,
  from,
  to,
  page = 0,
  size = 20,
  sort = 'occurredAt,desc',
} = {}) {
  await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));

  const fromMs = from ? Date.parse(from) : -Infinity;
  const toMs = to ? Date.parse(to) : Infinity;

  const filtered = MOCK_ALARMS.filter((a) => {
    if (cameraId !== undefined && cameraId !== null && a.cameraId !== cameraId) return false;
    if (roiId !== undefined && roiId !== null && a.roiId !== roiId) return false;
    if (severity && a.severity !== severity) return false;
    if (type && a.type !== type) return false;
    if (status && a.status !== status) return false;
    const t = Date.parse(a.occurredAt);
    if (t < fromMs || t > toMs) return false;
    return true;
  });

  const [sortField, sortDir = 'desc'] = sort.split(',');
  filtered.sort(compareBy(sortField, sortDir));

  const totalElements = filtered.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return { content, page, size, totalElements, totalPages };
}

// ===== 알람 상태 변경 (명세 §5.3 / §5.4) =====

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ackAlarm(alarmId) {
  await sleep(MOCK_LATENCY_MS / 2);
  const target = MOCK_ALARMS.find((a) => a.alarmId === alarmId);
  if (!target) return null;
  if (target.status === 'NEW') target.status = 'ACK';
  return { ...target };
}

export async function resolveAlarm(alarmId, comment = '') {
  await sleep(MOCK_LATENCY_MS / 2);
  const target = MOCK_ALARMS.find((a) => a.alarmId === alarmId);
  if (!target) return null;
  target.status = 'RESOLVED';
  target.resolveComment = comment;
  return { ...target };
}

export async function bulkAckAlarms(alarmIds) {
  await sleep(MOCK_LATENCY_MS);
  let acked = 0;
  for (const id of alarmIds) {
    const target = MOCK_ALARMS.find((a) => a.alarmId === id);
    if (target && target.status === 'NEW') {
      target.status = 'ACK';
      acked += 1;
    }
  }
  return { acked };
}
