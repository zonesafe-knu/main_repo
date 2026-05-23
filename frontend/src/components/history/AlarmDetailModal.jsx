import React, { useEffect, useState } from 'react';
import { fetchAlarm, resolveAlarm } from '../../api/alarms';
import { publish } from '../../api/ws';
import './AlarmDetailModal.css';

const SEVERITY_LABEL = { INFO: 'Info', WARN: 'Warning', DANGER: 'Danger' };
const STATUS_LABEL = { NEW: '신규', ACK: '확인됨', RESOLVED: '해결됨' };
const TYPE_LABEL = {
  WORKER_INTRUSION: '작업자 진입',
  WORKER_FORKLIFT_PROXIMITY: '작업자-지게차 근접',
  UNKNOWN_OBJECT: '미확인 객체',
};

const DETAIL_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const formatDateTime = (iso) =>
  iso ? DETAIL_FORMATTER.format(new Date(iso)) : '-';

const AlarmDetailModal = ({ alarmId, onClose, onActionDone }) => {
  const [alarm, setAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (alarmId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAlarm(alarmId)
      .then((data) => { if (!cancelled) setAlarm(data); })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? '알람 정보를 불러오지 못했습니다.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [alarmId]);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // STOMP fire-and-forget — broadcast 가 부모 HistoryPage 의 alarms 도 동기화
  const handleAck = () => {
    publish('/app/ack', { alarmId });
    setAlarm((prev) => (prev ? { ...prev, status: 'ACK' } : prev));
    onActionDone?.();
  };

  const handleResolve = async () => {
    const comment = window.prompt('해결 코멘트 (선택)', '') ?? null;
    if (comment === null) return;
    setActionPending(true);
    try {
      const updated = await resolveAlarm(alarmId, comment);
      setAlarm(updated);
      onActionDone?.();
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="alarm-modal-backdrop" onClick={onClose}>
      <div className="alarm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alarm-modal-header">
          <h3>알람 상세 {alarm && <span className="alarm-modal-id">#{alarm.alarmId}</span>}</h3>
          <button className="alarm-modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div className="alarm-modal-body">
          {loading ? (
            <div className="alarm-modal-state">불러오는 중...</div>
          ) : error ? (
            <div className="alarm-modal-state error">{error}</div>
          ) : alarm ? (
            <>
              {alarm.snapshotUrl && (
                <div className="alarm-modal-snapshot">
                  <img src={alarm.snapshotUrl} alt="알람 스냅샷" />
                </div>
              )}

              <dl className="alarm-modal-meta">
                <dt>발생 시각</dt>
                <dd>{formatDateTime(alarm.occurredAt)}</dd>

                <dt>카메라</dt>
                <dd>{alarm.cameraName} <span className="muted">#{alarm.cameraId}</span></dd>

                <dt>ROI</dt>
                <dd>
                  {alarm.roiName
                    ? <>{alarm.roiName} <span className="muted">#{alarm.roiId}</span></>
                    : <span className="muted">없음</span>}
                </dd>

                <dt>심각도</dt>
                <dd>
                  <span className={`severity-pill severity-${alarm.severity?.toLowerCase()}`}>
                    {SEVERITY_LABEL[alarm.severity] ?? alarm.severity}
                  </span>
                </dd>

                <dt>상태</dt>
                <dd>{STATUS_LABEL[alarm.status] ?? alarm.status}</dd>

                <dt>유형</dt>
                <dd>{TYPE_LABEL[alarm.type] ?? alarm.type}</dd>

                <dt>메시지</dt>
                <dd>{alarm.message}</dd>

                {alarm.comment && (<>
                  <dt>코멘트</dt>
                  <dd>{alarm.comment}</dd>
                </>)}

                <dt>클립</dt>
                <dd>{alarm.clipId ? `#${alarm.clipId}` : <span className="muted">없음</span>}</dd>
              </dl>

              <div className="alarm-modal-detections">
                <h4>탐지 객체</h4>
                {alarm.detections?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Label</th><th>TrackID</th><th>BBox</th><th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alarm.detections.map((d, i) => (
                        <tr key={`${d.trackId}-${i}`}>
                          <td>{d.label}</td>
                          <td>{d.trackId}</td>
                          <td>[{d.bbox?.join(', ')}]</td>
                          <td>{d.confidence?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="muted">탐지 객체 정보가 없습니다.</div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {alarm && (
          <div className="alarm-modal-footer">
            <button
              type="button"
              className="modal-btn"
              onClick={handleAck}
              disabled={alarm.status !== 'NEW' || actionPending}
            >확인</button>
            <button
              type="button"
              className="modal-btn primary"
              onClick={handleResolve}
              disabled={alarm.status === 'RESOLVED' || actionPending}
            >해결</button>
            <button type="button" className="modal-btn ghost" onClick={onClose}>닫기</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmDetailModal;