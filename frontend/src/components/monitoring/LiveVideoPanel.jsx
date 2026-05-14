import { useEffect, useRef, useState } from 'react';
import './LiveVideoPanel.css';

// 영상 원본 해상도 — SVG 좌표계 (모든 ROI 좌표는 이 기준)
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const MAX_VERTICES = 4;

export default function LiveVideoPanel({
  cameraName,
  status,
  rois = [],
  drawingVertices = null, // null = 그리기 모드 아님, 배열 = 그리기 모드
  onAddVertex,
}) {
  const isDrawing = Array.isArray(drawingVertices);
  const videoAreaRef = useRef(null);
  // 네이티브 Fullscreen API가 차단된 환경(iframe 등)에서 쓸 CSS 폴백 상태
  const [cssFullscreen, setCssFullscreen] = useState(false);

  const handleFullscreen = async () => {
    // 1) 네이티브 풀스크린 중이면 종료
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* noop */ }
      return;
    }
    // 2) CSS 폴백 풀스크린 중이면 종료
    if (cssFullscreen) {
      setCssFullscreen(false);
      return;
    }

    // 3) 진입 — 네이티브 우선, 실패 시 CSS 폴백
    const el = videoAreaRef.current;
    if (!el) return;
    const requestFs =
      el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen;

    if (requestFs) {
      try {
        await requestFs.call(el);
        return;
      } catch (err) {
        console.warn('네이티브 풀스크린 거부됨, CSS 폴백 사용:', err);
      }
    }
    setCssFullscreen(true);
  };

  // CSS 폴백 모드일 때 ESC 로 빠져나가게
  useEffect(() => {
    if (!cssFullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setCssFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cssFullscreen]);

  // 화면 픽셀 좌표 → 영상 좌표(viewBox 기준) 변환
  const handleSvgClick = (e) => {
    if (!isDrawing || drawingVertices.length >= MAX_VERTICES) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const cursorPt = pt.matrixTransform(ctm.inverse());
    onAddVertex?.([Math.round(cursorPt.x), Math.round(cursorPt.y)]);
  };

  const hasContent = rois.length > 0 || isDrawing;

  return (
    <section className="center-video-area">
      <div className="video-header">
        <h3>{cameraName}</h3>
        <button className="fullscreen-btn" onClick={handleFullscreen}>
          전체화면
        </button>
      </div>

      <div
        className={`video-player-placeholder${cssFullscreen ? ' css-fullscreen' : ''}`}
        ref={videoAreaRef}
      >
        {cssFullscreen && (
          <button
            type="button"
            className="exit-fullscreen-btn"
            onClick={() => setCssFullscreen(false)}
          >
            ✕ 닫기 (ESC)
          </button>
        )}
        {/* 백엔드 연동 시: cameras.{cameraId}.streamUrl(HLS) 로 교체 (명세 §3.5) */}
        <video
          className="live-video"
          src="/videos/sample.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {hasContent && (
          <svg
            className={`roi-overlay ${isDrawing ? 'interactive' : ''}`}
            viewBox={`0 0 ${VIDEO_WIDTH} ${VIDEO_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            onClick={handleSvgClick}
          >
            {/* 기존 ROI 표시 */}
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
                <text
                  x={roi.coordinates[0][0]}
                  y={roi.coordinates[0][1] - 16}
                  className="roi-label"
                >
                  {roi.name}
                </text>
              </g>
            ))}

            {/* 그리는 중인 다각형 미리보기 */}
            {isDrawing && drawingVertices.length > 0 && (
              <g className="roi-drawing">
                {drawingVertices.length === MAX_VERTICES ? (
                  <polygon
                    points={drawingVertices
                      .map(([x, y]) => `${x},${y}`)
                      .join(' ')}
                    className="roi-drawing-polygon"
                  />
                ) : (
                  drawingVertices.length >= 2 && (
                    <polyline
                      points={drawingVertices
                        .map(([x, y]) => `${x},${y}`)
                        .join(' ')}
                      className="roi-drawing-line"
                    />
                  )
                )}
                {drawingVertices.map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="14"
                    className="roi-drawing-vertex"
                  />
                ))}
              </g>
            )}
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
          <span className="value">
            {status.fps != null ? `${status.fps.toFixed(1)}FPS` : '—'}
          </span>
        </div>
        <div className="status-item">
          <span className="label">금일 알림</span>
          <span className="value">{status.todayAlarms}건</span>
        </div>
      </div>
    </section>
  );
}
