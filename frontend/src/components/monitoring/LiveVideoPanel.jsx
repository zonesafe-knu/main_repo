import { useEffect, useRef, useState } from 'react';
import './LiveVideoPanel.css';

// 영상 원본 해상도 — SVG 좌표계 (모든 ROI 좌표는 이 기준)
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const MAX_VERTICES = 4;
// 백엔드가 videoTimeSec 을 보내주는 "exact" 모드일 때만 적용되는 허용 오차(초).
// 이보다 멀면 너무 옛 detection 으로 판단해 그리지 않음 (오버레이가 영상과 어긋난 채 계속 남는 것 방지).
// fallback 모드(frameTs 기반)에서는 영상이 buffer 보다 일정하게 앞서기 때문에 tolerance 를 적용하지 않는다.
const EXACT_MATCH_TOLERANCE_SEC = 1.5;

export default function LiveVideoPanel({
  cameraName,
  status,
  rois = [],
  drawingVertices = null, // null = 그리기 모드 아님, 배열 = 그리기 모드
  onAddVertex,
  detections = [], // rAF 루프가 골라준 "현재 영상 시각용" 탐지 객체
  detectionBufferRef = null, // 영상 currentTime ↔ detection 매칭용 ref 버퍼
  onActiveDetectionChange = null, // 매칭된 detection 이 바뀔 때마다 부모에 알림
  videoSrc = null, // 카메라에 연결된 영상 URL (null 이면 영상 없음 placeholder)
}) {
  const isDrawing = Array.isArray(drawingVertices);
  const videoAreaRef = useRef(null);
  const videoRef = useRef(null);
  // 네이티브 Fullscreen API가 차단된 환경(iframe 등)에서 쓸 CSS 폴백 상태
  const [cssFullscreen, setCssFullscreen] = useState(false);

  // 영상 currentTime ↔ detection 동기화 루프.
  // 매 rAF tick 마다 영상의 현재 재생 위치에 맞는 detection 을 버퍼에서 골라
  // 부모(onActiveDetectionChange)에 알린다. 같은 entry 가 재선택되면 setState 생략.
  useEffect(() => {
    if (!detectionBufferRef || !onActiveDetectionChange) return undefined;
    let raf;
    let lastEntry = null;
    const tick = () => {
      const video = videoRef.current;
      const buf = detectionBufferRef.current;
      if (video && buf && buf.length > 0) {
        const t = video.currentTime;
        // videoTime <= t 인 항목 중 가장 최신 (buf 는 오름차순 정렬됨)
        let match = null;
        for (let i = buf.length - 1; i >= 0; i--) {
          if (buf[i].videoTime <= t) { match = buf[i]; break; }
        }
        // exact 모드(백엔드 videoTimeSec 제공)에서만 tolerance 가드 적용.
        // fallback 모드에서는 buffer 가 항상 video 보다 뒤처져 있어 가드를 적용하면 영원히 매칭 안 됨.
        if (match && match.exact && t - match.videoTime > EXACT_MATCH_TOLERANCE_SEC) {
          match = null;
        }
        if (match !== lastEntry) {
          lastEntry = match;
          onActiveDetectionChange(
            match ? { objects: match.objects, frameVideoTime: match.videoTime } : null
          );
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [detectionBufferRef, onActiveDetectionChange]);

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

  const hasContent = rois.length > 0 || isDrawing || detections.length > 0;

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
        {videoSrc ? (
          <video
            key={videoSrc}
            ref={videoRef}
            className="live-video"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="live-video-empty">이 카메라에 연결된 영상이 없습니다.</div>
        )}

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

            {/* 실시간 탐지 bbox 오버레이 — bbox: [x1, y1, x2, y2] (영상 좌표계) */}
            {detections.map((obj, i) => {
              const [x1, y1, x2, y2] = obj.bbox ?? [];
              if ([x1, y1, x2, y2].some((v) => typeof v !== 'number')) return null;
              const w = x2 - x1;
              const h = y2 - y1;
              return (
                <g key={`${obj.trackId ?? 'd'}-${i}`} className={`detection detection-${obj.label}`}>
                  <rect x={x1} y={y1} width={w} height={h} className="detection-bbox" />
                  <rect x={x1} y={y1 - 36} width={Math.max(180, obj.label?.length * 18 + 80)} height={32} className="detection-label-bg" />
                  <text x={x1 + 8} y={y1 - 12} className="detection-label">
                    {obj.label}{obj.trackId != null ? ` #${obj.trackId}` : ''}
                    {obj.confidence != null ? ` ${Math.round(obj.confidence * 100)}%` : ''}
                  </text>
                </g>
              );
            })}

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
