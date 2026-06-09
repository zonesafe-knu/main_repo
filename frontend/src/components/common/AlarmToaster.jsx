import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribe } from '../../api/ws';
import { getActiveVideoId, getActiveVideoTime } from '../../utils/playbackState';
import './AlarmToaster.css';

const MAX_VISIBLE = 5;
// 영상 기반 알람 dispatch 체크 주기 (ms) — currentTime 이 알람 시점에 도달했는지 확인
const DISPATCH_CHECK_MS = 200;

const SEVERITY_LABEL = { INFO: 'Info', WARN: 'Warning', DANGER: 'Danger' };

const TIME_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const formatTime = (iso) => (iso ? TIME_FMT.format(new Date(iso)) : '');

export default function AlarmToaster() {
  const [toasts, setToasts] = useState([]);
  // videoTimeSec 이 있는 알람은 재생 위치가 도달할 때까지 큐에 보관.
  // 실시간 카메라 알람(videoTimeSec == null)은 큐 거치지 않고 즉시 표시.
  const pendingRef = useRef([]);

  const showToast = useCallback((event) => {
    const id = `${event.alarmId}-${Date.now()}`;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...event, id }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    subscribe('/topic/alarms', (event) => {
      if (cancelled || !event?.alarmId) return;
      // 실시간 카메라 알람 → 즉시 표시 (기존 동작 유지)
      if (event.videoTimeSec == null) {
        showToast(event);
        return;
      }
      // 영상 기반 알람 → 큐에 적재
      pendingRef.current.push(event);
    })
      .then((u) => { if (cancelled) u(); else unsub = u; })
      .catch(() => {});

    // dispatch loop — 200ms 마다 큐 검사
    // videoId 일치 && video.currentTime >= alarm.videoTimeSec 인 알람을 표시하고 큐에서 제거.
    const dispatchTimer = setInterval(() => {
      if (pendingRef.current.length === 0) return;
      const activeId = getActiveVideoId();
      if (activeId == null) return;
      const t = getActiveVideoTime();
      if (t == null) return;
      const stillPending = [];
      for (const event of pendingRef.current) {
        if (event.videoId === activeId && t >= event.videoTimeSec) {
          showToast(event);
        } else {
          stillPending.push(event);
        }
      }
      pendingRef.current = stillPending;
    }, DISPATCH_CHECK_MS);

    return () => {
      cancelled = true;
      if (unsub) unsub();
      clearInterval(dispatchTimer);
    };
  }, [showToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="alarm-toaster">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`alarm-toast severity-${t.severity?.toLowerCase()}`}
        >
          <div className="alarm-toast-badge">{SEVERITY_LABEL[t.severity] ?? t.severity}</div>
          <div className="alarm-toast-body">
            <div className="alarm-toast-message">{t.message}</div>
            <div className="alarm-toast-meta">
              #{t.alarmId} · {formatTime(t.occurredAt)}
            </div>
          </div>
          <button
            type="button"
            className="alarm-toast-close"
            onClick={() => dismiss(t.id)}
            aria-label="닫기"
          >×</button>
        </div>
      ))}
    </div>
  );
}
