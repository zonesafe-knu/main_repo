import React from 'react';
import './Monitoring.css';
import Header from '../components/common/Header';

const Monitoring = () => {
  return (
    <div className="layout-container">
      <Header />

      {/* ================= 메인 3단 레이아웃 ================= */}
      <div className="main-content">
        
        {/* 1. 좌측: 카메라 목록 사이드바 */}
        <aside className="left-sidebar">
          <div className="sidebar-header">
            <h4>카메라 목록</h4>
            <input type="text" placeholder="카메라 검색..." className="search-input" />
          </div>
          
          <div className="camera-list">
            <div className="location-group">대구공장 A동</div>
            <div className="camera-item active">1번 라인 입구 <span className="more-btn">···</span></div>
            <div className="camera-item">2번 적재구역 <span className="more-btn">···</span></div>
            <div className="camera-item">3번 출하장 <span className="more-btn">···</span></div>
            
            <div className="location-group" style={{ marginTop: '20px' }}>대구공장 B동</div>
            <div className="camera-item">B동 입구 <span className="more-btn">···</span></div>
            <div className="camera-item">B동 지게차 통로 <span className="more-btn">···</span></div>
          </div>

          <div className="sidebar-footer">
            <button className="add-camera-btn">+ 카메라 추가</button>
          </div>
        </aside>

        {/* 2. 중앙: 실시간 영상 영역 */}
        <section className="center-video-area">
          <div className="video-header">
            <h3>1번 라인 입구</h3>
            <button className="fullscreen-btn">전체화면</button>
          </div>
          
          <div className="video-player-placeholder">
            {/* 실제 영상이 들어갈 자리 */}
            <div className="mock-video-text">CCTV 영상 화면</div>
          </div>

          <div className="video-status-bar">
            <div className="status-item">
              <span className="label">현재시각</span>
              <span className="value">2026-4-27(GMT+9)<br/>23:00</span>
            </div>
            <div className="status-item">
              <span className="label">탐지객체</span>
              <span className="value">worker 1 /<br/>forklift 1</span>
            </div>
            <div className="status-item">
              <span className="label">추론속도</span>
              <span className="value">28.4FPS</span>
            </div>
            <div className="status-item">
              <span className="label">금일 알림</span>
              <span className="value">2건</span>
            </div>
          </div>
        </section>

        {/* 3. 우측: 위험구역(ROI) 설정 사이드바 */}
        <aside className="right-sidebar">
          <div className="roi-header">
            <h4>위험구역(ROI)</h4>
            <button className="add-roi-btn">+</button>
          </div>

          <div className="roi-list">
            {/* ROI 카드 1 */}
            <div className="roi-card">
              <div className="roi-card-header">
                <span>#1 지게차 진입 구역</span>
                <span className="badge danger">DANGER</span>
              </div>
              <div className="roi-card-body">
                <div className="coord-table">
                  <div>coordinate</div>
                  <div className="grid-2x2">
                    <span>(1, 0)</span><span>(1, 0)</span>
                    <span>(1, 0)</span><span>(1, 0)</span>
                  </div>
                </div>
                <div className="roi-actions">
                  <button>삭제</button>
                  <button>수정</button>
                </div>
              </div>
            </div>

            {/* ROI 카드 2 */}
            <div className="roi-card">
              <div className="roi-card-header">
                <span>#2 로봇 접근 구역</span>
                <span className="badge safe">SAFE</span>
              </div>
              <div className="roi-card-body">
                <div className="coord-table">
                  <div>coordinate</div>
                  <div className="grid-2x2">
                    <span>(1, 0)</span><span>(1, 0)</span>
                    <span>(1, 0)</span><span>(1, 0)</span>
                  </div>
                </div>
                <div className="roi-actions">
                  <button>삭제</button>
                  <button>수정</button>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Monitoring;