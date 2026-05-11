import './LiveVideoPanel.css';

export default function LiveVideoPanel({ cameraName, status }) {
  return (
    <section className="center-video-area">
      <div className="video-header">
        <h3>{cameraName}</h3>
        <button className="fullscreen-btn">전체화면</button>
      </div>

      <div className="video-player-placeholder">
        <div className="mock-video-text">CCTV 영상 화면</div>
      </div>

      <div className="video-status-bar">
        <div className="status-item">
          <span className="label">현재시각</span>
          <span className="value">
            {status.date}
            <br />
            {status.time}
          </span>
        </div>
        <div className="status-item">
          <span className="label">탐지객체</span>
          <span className="value">
            worker {status.workerCount} /
            <br />
            forklift {status.forkliftCount}
          </span>
        </div>
        <div className="status-item">
          <span className="label">추론속도</span>
          <span className="value">{status.fps}FPS</span>
        </div>
        <div className="status-item">
          <span className="label">금일 알림</span>
          <span className="value">{status.todayAlarms}건</span>
        </div>
      </div>
    </section>
  );
}
