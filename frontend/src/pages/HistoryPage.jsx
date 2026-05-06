import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/ZONESAFE.png';
import './HistoryPage.css'; // 새로 만들 CSS 파일 연결

const HistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 테스트용 알람 데이터
  const mockAlarms = [
    { id: 1, time: '13:21:31', camera: 'cam1', severity: 'danger', content: '작업자-지게차 근접', isPlaying: true },
    { id: 2, time: '13:21:31', camera: 'cam1', severity: 'warning', content: '작업자-지게차 근접', isPlaying: false },
    { id: 3, time: '13:21:31', camera: 'cam1', severity: 'info', content: '작업자-지게차 근접', isPlaying: false },
    { id: 4, time: '13:21:31', camera: 'cam1', severity: 'danger', content: '작업자-지게차 근접', isPlaying: false },
    { id: 5, time: '13:21:31', camera: 'cam1', severity: 'danger', content: '작업자-지게차 근접', is : false },
    { id: 6, time: '13:21:31', camera: 'cam1', severity: 'danger', content: '작업자-지게차 근접', isPlaying: false },
  ];

  return (
    <div className="layout-container">
      {/* ================= 상단 네비게이션 바 (모니터링 페이지와 동일) ================= */}
      <header className="top-navbar">
        <div className="nav-logo" onClick={() => navigate('/monitoring')}>
          <img src={logoImg} alt="ZONESAFE" className="nav-logo-img" />
          <div className="nav-logo-text">
            <p>Intelligent safety management</p>
          </div>
        </div>

        <div className="nav-menu">
          <span 
            className={`nav-item ${location.pathname === '/monitoring' ? 'active' : ''}`}
            onClick={() => navigate('/monitoring')}
          >
            실시간 모니터링
          </span>
          <span 
            className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
            onClick={() => navigate('/history')}
          >
            히스토리
          </span>
        </div>

        <div className="nav-user">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>knu-fac-002</span>
        </div>
      </header>

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
              <select>
                <option>전체 심각도</option>
              </select>
            </div>
            <div className="select-wrapper">
              <select>
                <option>2026 - 04 - 28</option>
              </select>
            </div>
          </div>
        </div>

        {/* 하단: 좌우 분할 영역 */}
        <div className="history-content-split">
          
          {/* 좌측: 영상 재생기 */}
          <div className="playback-panel">
            <div className="playback-header">
              <span className="badge-outline danger">● Danger</span>
              <span className="playback-time">2026-04-28 13:21:31</span>
            </div>
            
            <div className="video-screen">
              <div className="mock-video-text">과거 위험 영상 재생 화면</div>
            </div>

            <div className="video-controls">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '30%' }}></div>
              </div>
              <div className="time-labels">
                <span>0.00</span>
                <span>10.0</span>
              </div>
              <div className="play-btn-wrapper">
                <button className="play-btn">▶ 재생</button>
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
                  {mockAlarms.map((alarm) => (
                    <tr key={alarm.id} className={alarm.isPlaying ? 'playing-row' : ''}>
                      <td className="play-icon">{alarm.isPlaying ? '▶' : ''}</td>
                      <td>{alarm.time}</td>
                      <td>{alarm.camera}</td>
                      <td>{alarm.severity}</td>
                      <td>{alarm.content}</td>
                    </tr>
                  ))}
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