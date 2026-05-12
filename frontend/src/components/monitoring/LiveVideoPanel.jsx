import './LiveVideoPanel.css';

// 영상 원본 해상도 — SVG 좌표계 (모든 ROI 좌표는 이 기준)
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;

export default function LiveVideoPanel({ cameraName, status, rois = [] }) {
  return (
    <section className="center-video-area">
      <div className="video-header">
        <h3>{cameraName}</h3>
        <button className="fullscreen-btn">전체화면</button>
      </div>

      <div className="video-player-placeholder">
        <div className="mock-video-text">CCTV 영상 화면</div>

        {rois.length > 0 && (
          <svg
            className="roi-overlay"
            viewBox={`0 0 ${VIDEO_WIDTH} ${VIDEO_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {rois.map((roi) => (
              <g key={roi.id} className="roi-shape">
                <polygon
                  points={roi.coordinates
                    .map(([x, y]) => `${x},${y}`)
                    .join(' ')}
                  className="roi-polygon"
                />
                {roi.coordinates.map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="10"
                    className="roi-vertex"
                  />
                ))}
                {/* ROI 이름 라벨 (다각형의 첫 꼭짓점 위쪽) */}
                <text
                  x={roi.coordinates[0][0]}
                  y={roi.coordinates[0][1] - 16}
                  className="roi-label"
                >
                  {roi.name}
                </text>
              </g>
            ))}
          </svg>
        )}
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
