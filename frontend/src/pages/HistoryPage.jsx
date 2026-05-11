import React, { useState, useRef, useEffect, useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './HistoryPage.css';
import Header from '../components/common/Header';
import { fetchAlarms, ackAlarm, resolveAlarm, bulkAckAlarms } from '../api/alarms';
import { fetchCameras } from '../api/cameras';

registerLocale('ko', ko);

const PAGE_SIZE = 20;
const SAMPLE_VIDEO = '/videos/sample.mp4';

const SEVERITY_BADGE_CLASS = { INFO: 'info', WARN: 'warning', DANGER: 'danger' };
const SEVERITY_LABEL = { INFO: 'Info', WARN: 'Warning', DANGER: 'Danger' };

const STATUS_BADGE_CLASS = { NEW: 'new', ACK: 'ack', RESOLVED: 'resolved' };
const STATUS_LABEL = { NEW: '신규', ACK: '확인됨', RESOLVED: '해결됨' };

const TYPE_LABEL = {
  WORKER_INTRUSION: '작업자 진입',
  WORKER_FORKLIFT_PROXIMITY: '작업자-지게차 근접',
  UNKNOWN_OBJECT: '미확인 객체',
};

const TIME_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const DATETIME_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

const formatTime = (iso) => TIME_FORMATTER.format(new Date(iso));
const formatDateTime = (iso) =>
  DATETIME_FORMATTER.format(new Date(iso)).replace(/\./g, '-').replace(/-\s/g, '-').replace('--', ' ');

const startOfDayIso = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const endOfDayIso = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

const formatClipTime = (seconds) => {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const HistoryPage = () => {
  // ===== 필터 상태 =====
  const [dateRange, setDateRange] = useState([
    new Date(2026, 3, 26),
    new Date(2026, 3, 28),
  ]);
  const [startDate, endDate] = dateRange;
  const [selectedCameraId, setSelectedCameraId] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(0);

  // ===== 데이터 상태 =====
  const [cameras, setCameras] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // ===== 재생기 / 선택 상태 =====
  const [selectedAlarmId, setSelectedAlarmId] = useState(null);
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [actionPendingId, setActionPendingId] = useState(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [clipTime, setClipTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const selectedAlarm = useMemo(
    () => alarms.find((a) => a.alarmId === selectedAlarmId) ?? null,
    [alarms, selectedAlarmId]
  );

  // ===== 카메라 목록 (마운트 시 1회) =====
  useEffect(() => {
    let cancelled = false;
    fetchCameras({ status: 'ONLINE' })
      .then((list) => { if (!cancelled) setCameras(list); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ===== 필터 변경 시 첫 페이지로 + 선택 초기화 =====
  useEffect(() => {
    setPage(0);
    setCheckedIds(new Set());
  }, [selectedCameraId, selectedSeverity, selectedStatus, selectedType, startDate, endDate]);

  // ===== 알람 fetch =====
  useEffect(() => {
    if (!startDate || !endDate) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAlarms({
      cameraId: selectedCameraId === 'all' ? undefined : Number(selectedCameraId),
      severity: selectedSeverity === 'all' ? undefined : selectedSeverity,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      type: selectedType === 'all' ? undefined : selectedType,
      from: startOfDayIso(startDate),
      to: endOfDayIso(endDate),
      page,
      size: PAGE_SIZE,
      sort: 'occurredAt,desc',
    })
      .then((res) => {
        if (cancelled) return;
        setAlarms(res.content);
        setPageInfo({
          page: res.page,
          size: res.size,
          totalElements: res.totalElements,
          totalPages: res.totalPages,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? '알람을 불러오지 못했습니다.');
        setAlarms([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [
    selectedCameraId, selectedSeverity, selectedStatus, selectedType,
    startDate, endDate, page, refreshTick,
  ]);

  // ===== 결과가 바뀌면 선택 알람 / 체크 동기화 =====
  useEffect(() => {
    if (alarms.length === 0) {
      setSelectedAlarmId(null);
      return;
    }
    if (!selectedAlarmId || !alarms.find((a) => a.alarmId === selectedAlarmId)) {
      setSelectedAlarmId(alarms[0].alarmId);
    }
  }, [alarms, selectedAlarmId]);

  useEffect(() => {
    // 현재 페이지에 없는 체크 항목은 제거
    setCheckedIds((prev) => {
      const validIds = new Set(alarms.map((a) => a.alarmId));
      const next = new Set();
      for (const id of prev) if (validIds.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [alarms]);

  // ===== 알람 변경 시 영상 자동 재생 =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedAlarm) return;
    setClipTime(0);
    setClipDuration(0);

    const playClip = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    if (video.readyState >= 2) {
      playClip();
    } else {
      video.addEventListener('canplay', playClip, { once: true });
      return () => video.removeEventListener('canplay', playClip);
    }
  }, [selectedAlarm?.alarmId]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setClipTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setClipDuration(Number.isFinite(video.duration) ? video.duration : 0);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || clipDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * clipDuration;
  };

  // ===== 액션 핸들러 =====
  const triggerRefresh = () => setRefreshTick((t) => t + 1);

  const handleAck = async (alarmId) => {
    setActionPendingId(alarmId);
    try {
      await ackAlarm(alarmId);
      triggerRefresh();
    } finally {
      setActionPendingId(null);
    }
  };

  const handleResolve = async (alarmId) => {
    const comment = window.prompt('해결 코멘트 (선택)', '') ?? null;
    if (comment === null) return; // 취소
    setActionPendingId(alarmId);
    try {
      await resolveAlarm(alarmId, comment);
      triggerRefresh();
    } finally {
      setActionPendingId(null);
    }
  };

  const handleBulkAck = async () => {
    if (checkedIds.size === 0) return;
    setBulkPending(true);
    try {
      await bulkAckAlarms(Array.from(checkedIds));
      setCheckedIds(new Set());
      triggerRefresh();
    } finally {
      setBulkPending(false);
    }
  };

  const toggleChecked = (alarmId) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(alarmId)) next.delete(alarmId);
      else next.add(alarmId);
      return next;
    });
  };

  const newAlarmsOnPage = useMemo(
    () => alarms.filter((a) => a.status === 'NEW'),
    [alarms]
  );
  const allNewChecked =
    newAlarmsOnPage.length > 0 &&
    newAlarmsOnPage.every((a) => checkedIds.has(a.alarmId));

  const toggleCheckAll = () => {
    setCheckedIds((prev) => {
      if (allNewChecked) {
        const next = new Set(prev);
        for (const a of newAlarmsOnPage) next.delete(a.alarmId);
        return next;
      }
      const next = new Set(prev);
      for (const a of newAlarmsOnPage) next.add(a.alarmId);
      return next;
    });
  };

  const videoSrc = selectedAlarm ? SAMPLE_VIDEO : '';
  const progressPercent = clipDuration > 0 ? (clipTime / clipDuration) * 100 : 0;
  const totalPages = pageInfo.totalPages;
  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [0];
    const windowSize = 5;
    const start = Math.max(0, Math.min(page - 2, totalPages - windowSize));
    const end = Math.min(totalPages, start + windowSize);
    const out = [];
    for (let i = start; i < end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  const goToPage = (next) => {
    if (next < 0 || next >= totalPages || next === page) return;
    setPage(next);
  };

  return (
    <div className="layout-container">
      <Header />

      <div className="history-main">

        {/* 상단: 필터 영역 */}
        <div className="filter-section">
          <h3 className="filter-title">alarm history</h3>
          <div className="filter-controls">
            <div className="select-wrapper">
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
              >
                <option value="all">전체 카메라</option>
                {cameras.map((c) => (
                  <option key={c.cameraId} value={c.cameraId}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="select-wrapper">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="all">전체 심각도</option>
                <option value="DANGER">Danger</option>
                <option value="WARN">Warning</option>
                <option value="INFO">Info</option>
              </select>
            </div>
            <div className="select-wrapper">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">전체 상태</option>
                <option value="NEW">신규</option>
                <option value="ACK">확인됨</option>
                <option value="RESOLVED">해결됨</option>
              </select>
            </div>
            <div className="select-wrapper">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">전체 유형</option>
                <option value="WORKER_INTRUSION">작업자 진입</option>
                <option value="WORKER_FORKLIFT_PROXIMITY">작업자-지게차 근접</option>
                <option value="UNKNOWN_OBJECT">미확인 객체</option>
              </select>
            </div>
            <div className="select-wrapper date-picker-wrapper">
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                dateFormat="yyyy-MM-dd"
                locale="ko"
                className="date-picker-input"
                popperPlacement="bottom-start"
                placeholderText="조회 기간 선택"
                isClearable={false}
              />
            </div>
          </div>
        </div>

        {/* 하단: 좌우 분할 영역 */}
        <div className="history-content-split">

          {/* 좌측: 영상 재생기 */}
          <div className="playback-panel">
            {selectedAlarm ? (
              <>
                <div className="playback-header">
                  <div className="playback-header-left">
                    <span className={`badge-outline ${SEVERITY_BADGE_CLASS[selectedAlarm.severity]}`}>
                      ● {SEVERITY_LABEL[selectedAlarm.severity]}
                    </span>
                    <span className={`status-badge ${STATUS_BADGE_CLASS[selectedAlarm.status]}`}>
                      {STATUS_LABEL[selectedAlarm.status]}
                    </span>
                    <span className="playback-time">
                      {formatDateTime(selectedAlarm.occurredAt)} · {selectedAlarm.cameraName}
                    </span>
                  </div>
                  <div className="playback-header-actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => handleAck(selectedAlarm.alarmId)}
                      disabled={
                        selectedAlarm.status !== 'NEW' ||
                        actionPendingId === selectedAlarm.alarmId
                      }
                    >확인</button>
                    <button
                      type="button"
                      className="action-btn primary"
                      onClick={() => handleResolve(selectedAlarm.alarmId)}
                      disabled={
                        selectedAlarm.status === 'RESOLVED' ||
                        actionPendingId === selectedAlarm.alarmId
                      }
                    >해결</button>
                  </div>
                </div>

                <div className="video-screen" onClick={togglePlay}>
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className="video-player"
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button
                    type="button"
                    className={`video-overlay-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    aria-label={isPlaying ? '일시정지' : '재생'}
                  >
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                </div>

                <div className="video-controls">
                  <div className="progress-bar" onClick={handleSeek}>
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <div className="time-labels">
                    <span>{formatClipTime(clipTime)}</span>
                    <span>{formatClipTime(clipDuration)}</span>
                  </div>
                  <div className="play-btn-wrapper">
                    <button className="play-btn" onClick={togglePlay}>
                      {isPlaying ? '❚❚ 일시정지' : '▶ 재생'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="playback-empty">선택된 알람이 없습니다.</div>
            )}
          </div>

          {/* 우측: 알람 목록 테이블 */}
          <div className="alarm-list-panel">
            <div className="alarm-list-header">
              <h4>알람 목록</h4>
              <div className="alarm-list-header-right">
                {checkedIds.size > 0 && (
                  <button
                    type="button"
                    className="bulk-ack-btn"
                    onClick={handleBulkAck}
                    disabled={bulkPending}
                  >
                    {bulkPending ? '처리 중...' : `선택 ${checkedIds.size}건 확인`}
                  </button>
                )}
                {!loading && !error && (
                  <span className="alarm-list-count">총 {pageInfo.totalElements}건</span>
                )}
              </div>
            </div>

            <div className="table-container">
              <table className="alarm-table">
                <thead>
                  <tr>
                    <th className="col-check">
                      <input
                        type="checkbox"
                        checked={allNewChecked}
                        onChange={toggleCheckAll}
                        disabled={newAlarmsOnPage.length === 0}
                        aria-label="전체 선택"
                      />
                    </th>
                    <th></th>
                    <th>시각</th>
                    <th>카메라</th>
                    <th>심각도</th>
                    <th>상태</th>
                    <th>내용</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="empty-row">불러오는 중...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" className="empty-row error">
                        {error}
                        <button className="retry-btn" onClick={triggerRefresh}>재시도</button>
                      </td>
                    </tr>
                  ) : alarms.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">조건에 맞는 알람이 없습니다.</td>
                    </tr>
                  ) : (
                    alarms.map((alarm) => {
                      const rowPlaying = alarm.alarmId === selectedAlarmId;
                      const pending = actionPendingId === alarm.alarmId;
                      const checkable = alarm.status === 'NEW';
                      return (
                        <tr
                          key={alarm.alarmId}
                          className={`alarm-row ${rowPlaying ? 'playing-row' : ''}`}
                          onClick={() => setSelectedAlarmId(alarm.alarmId)}
                        >
                          <td className="col-check" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checkedIds.has(alarm.alarmId)}
                              onChange={() => toggleChecked(alarm.alarmId)}
                              disabled={!checkable}
                              aria-label={`알람 ${alarm.alarmId} 선택`}
                            />
                          </td>
                          <td className="play-icon">{rowPlaying ? '▶' : ''}</td>
                          <td>{formatTime(alarm.occurredAt)}</td>
                          <td>{alarm.cameraName}</td>
                          <td>{SEVERITY_LABEL[alarm.severity]}</td>
                          <td>
                            <span className={`status-badge ${STATUS_BADGE_CLASS[alarm.status]}`}>
                              {STATUS_LABEL[alarm.status]}
                            </span>
                          </td>
                          <td title={TYPE_LABEL[alarm.type] ?? ''}>{alarm.message}</td>
                          <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="row-action-btn"
                              onClick={() => handleAck(alarm.alarmId)}
                              disabled={alarm.status !== 'NEW' || pending}
                            >확인</button>
                            <button
                              type="button"
                              className="row-action-btn primary"
                              onClick={() => handleResolve(alarm.alarmId)}
                              disabled={alarm.status === 'RESOLVED' || pending}
                            >해결</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <span
                  className={`page-arrow ${page === 0 ? 'disabled' : ''}`}
                  onClick={() => goToPage(page - 1)}
                >◀</span>
                {visiblePages.map((p) => (
                  <span
                    key={p}
                    className={`page-num ${p === page ? 'active' : ''}`}
                    onClick={() => goToPage(p)}
                  >{p + 1}</span>
                ))}
                <span
                  className={`page-arrow ${page >= totalPages - 1 ? 'disabled' : ''}`}
                  onClick={() => goToPage(page + 1)}
                >▶</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
