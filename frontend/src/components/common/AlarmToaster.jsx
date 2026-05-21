import { useEffect, useState, useCallback } from 'react';
import { subscribe } from '../../api/ws';
import './AlarmToaster.css';

const MAX_VISIBLE = 5;

const SEVERITY_LABEL = { INFO: 'Info', WARN: 'Warning', DANGER: 'Danger' };

const TIME_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const formatTime = (iso) => (iso ? TIME_FMT.format(new Date(iso)) : '');

export default function AlarmToaster() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    subscribe('/topic/alarms', (event) => {
      if (cancelled || !event?.alarmId) return;
      const id = `${event.alarmId}-${Date.now()}`;
      // x 로 닫기 전까지 유지. MAX_VISIBLE 초과 시에만 오래된 것이 자동 밀려남.
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...event, id }]);
    })
      .then((u) => { if (cancelled) u(); else unsub = u; })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

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