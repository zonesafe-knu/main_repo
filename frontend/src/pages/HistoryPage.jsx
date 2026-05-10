import React, { useState, useRef, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './HistoryPage.css';
import Header from '../components/common/Header';

registerLocale('ko', ko);

const SAMPLE_VIDEO = '/videos/sample.mp4';
const buildSrc = (start, end) => `${SAMPLE_VIDEO}#t=${start},${end}`;

const mockAlarms = [
  { id: 1, time: '13:21:31', camera: 'cam1', severity: 'danger',  content: '작업자-지게차 근접', videoStart: 0,  videoEnd: 5  },
  { id: 2, time: '13:25:14', camera: 'cam1', severity: 'warning', content: '작업자-지게차 근접', videoStart: 5,  videoEnd: 10 },
  { id: 3, time: '13:31:02', camera: 'cam1', severity: 'info',    content: '작업자-지게차 근접', videoStart: 10, videoEnd: 15 },
  { id: 4, time: '13:42:55', camera: 'cam1', severity: 'danger',  content: '작업자-지게차 근접', videoStart: 15, videoEnd: 20 },
  { id: 5, time: '13:48:09', camera: 'cam1', severity: 'danger',  content: '작업자-지게차 근접', videoStart: 5,  videoEnd: 10 },
  { id: 6, time: '13:52:36', camera: 'cam1', severity: 'danger',  content: '작업자-지게차 근접', videoStart: 10, videoEnd: 15 },
];

const formatTime = (seconds) => {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const HistoryPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 28));
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedAlarmId, setSelectedAlarmId] = useState(mockAlarms[0].id);
  const [clipTime, setClipTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const filteredAlarms =
    selectedSeverity === 'all'
      ? mockAlarms
      : mockAlarms.filter((a) => a.severity === selectedSeverity);

  const selectedAlarm =
    mockAlarms.find((a) => a.id === selectedAlarmId) ?? mockAlarms[0];

  const clipDuration = selectedAlarm.videoEnd - selectedAlarm.videoStart;
  const videoSrc = buildSrc(selectedAlarm.videoStart, selectedAlarm.videoEnd);

  // 알람이 바뀌면 새 클립이 자동 재생되도록 (src가 바뀌므로 video 요소가 자동 reload됨)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setClipTime(0);

    const playClip = () => {
      video.play().catch(() => {});
    };

    if (video.readyState >= 2) {
      playClip();
    } else {
      video.addEventListener('canplay', playClip, { once: true });
      return () => video.removeEventListener('canplay', playClip);
    }
  }, [selectedAlarmId]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime - selectedAlarm.videoStart;
    setClipTime(Math.max(0, Math.min(t, clipDuration)));
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      if (video.ended || video.currentTime >= selectedAlarm.videoEnd) {
        video.currentTime = selectedAlarm.videoStart;
      }
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = selectedAlarm.videoStart + ratio * clipDuration;
  };

  const formattedDate = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const progressPercent = clipDuration > 0 ? (clipTime / clipDuration) * 100 : 0;

  return (
    <div className="layout-container">
      <Header />

      {/* ================= 메인 콘텐츠 영역 ================= */}
      <div className="history-main">

        {/* 상단: 필터 영역 */}
        <div className="filter-section">
          <h3 className="filter-title">alarm history</h3>
          <div className="filter-controls">
            <div className="select-wrapper">
              <select>
                <option>전체 카메라</option>
              </select>
            </div>
            <div className="select-wrapper">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="all">전체 심각도</option>
                <option value="danger">danger</option>
                <option value="warning">warning</option>
                <option value="info">info</option>
              </select>
            </div>
            <div className="select-wrapper date-picker-wrapper">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy - MM - dd"
                locale="ko"
                className="date-picker-input"
                popperPlacement="bottom-start"
              />
            </div>
          </div>
        </div>

        {/* 하단: 좌우 분할 영역 */}
        <div className="history-content-split">

          {/* 좌측: 영상 재생기 */}
          <div className="playback-panel">
            <div className="playback-header">
              <span className={`badge-outline ${selectedAlarm.severity}`}>
                ● {selectedAlarm.severity.charAt(0).toUpperCase() + selectedAlarm.severity.slice(1)}
              </span>
              <span className="playback-time">
                {formattedDate} {selectedAlarm.time}
              </span>
            </div>

            <div className="video-screen" onClick={togglePlay}>
              <video
                ref={videoRef}
                src={videoSrc}
                className="video-player"
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
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
                <span>{formatTime(clipTime)}</span>
                <span>{formatTime(clipDuration)}</span>
              </div>
              <div className="play-btn-wrapper">
                <button className="play-btn" onClick={togglePlay}>
                  {isPlaying ? '❚❚ 일시정지' : '▶ 재생'}
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 알람 목록 테이블 */}
          <div className="alarm-list-panel">
            <div className="alarm-list-header">
              <h4>알람 목록</h4>
            </div>

            <div className="table-container">
              <table className="alarm-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>시각</th>
                    <th>카메라</th>
                    <th>심각도</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlarms.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        해당 심각도의 알람이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredAlarms.map((alarm) => {
                      const rowPlaying = alarm.id === selectedAlarmId;
                      return (
                        <tr
                          key={alarm.id}
                          className={`alarm-row ${rowPlaying ? 'playing-row' : ''}`}
                          onClick={() => setSelectedAlarmId(alarm.id)}
                        >
                          <td className="play-icon">{rowPlaying ? '▶' : ''}</td>
                          <td>{alarm.time}</td>
                          <td>{alarm.camera}</td>
                          <td>{alarm.severity}</td>
                          <td>{alarm.content}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span className="page-arrow">◀</span>
              <span className="page-num active">1</span>
              <span className="page-num">2</span>
              <span className="page-num">3</span>
              <span className="page-arrow">▶</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
