import { useState, useEffect, useMemo, useRef } from 'react';
import './Monitoring.css';
import Header from '../components/common/Header';
import CameraSidebar from '../components/monitoring/CameraSidebar';
import LiveVideoPanel from '../components/monitoring/LiveVideoPanel';
import RoiSidebar from '../components/monitoring/RoiSidebar';
import AddCameraModal from '../components/monitoring/AddCameraModal';
import AddRoiModal from '../components/monitoring/AddRoiModal';
import {
  fetchCameras,
  createCamera,
  updateCamera,
  deleteCamera as apiDeleteCamera,
  setCameraStatus,
} from '../api/cameras';
import { fetchRois, createRoi, updateRoi, deleteRoi } from '../api/rois';
import { fetchLatestDetection } from '../api/detections';
import { fetchStatsSummary } from '../api/stats';
import { subscribe } from '../api/ws';
import { uploadVideo, fetchVideos, getVideoStreamUrl, fetchDetectionFrames } from '../api/videos';

// 카메라 목록은 백엔드에서 받아온다 (mount 시 1회). 선택한 카메라 ID 는 UX 유지 목적으로 localStorage 보관.
const SELECTED_CAM_STORAGE_KEY = '__monitoring_selected_cam_v1';

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
  } catch { /* localStorage 차단 환경 */ }
  return fallback;
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
};

// 백엔드 카메라 응답을 사이드바가 쓰는 사이트별 그룹 구조로 변환. siteId 는 신규 등록 시 사용.
function groupCamerasBySite(apiCameras) {
  const map = new Map();
  for (const c of apiCameras) {
    const siteName = c.siteName ?? '미지정 사이트';
    if (!map.has(siteName)) map.set(siteName, { siteId: c.siteId, cameras: [] });
    map.get(siteName).cameras.push({ id: c.cameraId, name: c.name, status: c.status });
  }
  return Array.from(map, ([name, { siteId, cameras }]) => ({ name, siteId, cameras }));
}

const STATS_POLL_MS = 60_000;

// detection 버퍼 최대 길이 (30fps × 약 20초). 메모리 보호용.
const DETECTION_BUFFER_MAX = 600;

// DetectionFrame → { videoTime: 영상 내 시각(초), exact: true|false }
//  1순위(exact=true): 백엔드가 명시적으로 넣어주는 videoTimeSec (영상 내 0-based 초)
//  2순위(fallback, exact=false): 첫 프레임의 frameTs 를 t=0 으로 두고 상대 시간을 계산.
//    한계 — 백엔드 분석 지연이 그대로 offset 으로 남아 sync 가 어긋남.
//    백엔드가 videoTimeSec 을 보내주기 시작하면 자동으로 1순위로 전환된다.
function computeVideoTime(frame, originRef) {
  if (typeof frame?.videoTimeSec === 'number') {
    return { videoTime: frame.videoTimeSec, exact: true };
  }
  const tsStr = frame?.frameTs ?? frame?.frameTimestamp;
  if (!tsStr) return null;
  const ms = new Date(tsStr).getTime();
  if (!Number.isFinite(ms)) return null;
  if (originRef.current == null) originRef.current = ms;
  return { videoTime: (ms - originRef.current) / 1000, exact: false };
}

const formatStatusDate = (d) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}(GMT+9)`;
const formatStatusTime = (d) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const startOfTodayIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const endOfTodayIso = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

// ROI: API 필드명을 컴포넌트가 쓰는 이름으로 변환
function apiRoiToLocal(r) {
  return {
    id: r.roiId,
    cameraId: r.cameraId,
    name: r.name,
    coordinates: r.polygon,
  };
}

export default function Monitoring() {
  // 백엔드에서 받아온 카메라 raw 목록. rename/delete 시 기존 필드 보존을 위해 통째로 유지.
  const [apiCameras, setApiCameras] = useState([]);
  // 모달에서 등록한 site (아직 카메라 없음). 카메라가 추가되어 백엔드에 반영되면 자연스럽게 합쳐짐.
  const [pendingSiteNames, setPendingSiteNames] = useState([]);
  const sites = useMemo(() => {
    const grouped = groupCamerasBySite(apiCameras);
    const existing = new Set(grouped.map((g) => g.name));
    const extras = pendingSiteNames
      .filter((n) => !existing.has(n))
      .map((name) => ({ name, cameras: [] }));
    return [...grouped, ...extras];
  }, [apiCameras, pendingSiteNames]);
  const [selectedCameraId, setSelectedCameraId] = useState(() =>
    loadFromStorage(SELECTED_CAM_STORAGE_KEY, null)
  );

  // ROI raw 목록 (백엔드 응답 그대로). 화면용 변환은 useMemo 로 파생.
  const [apiRois, setApiRois] = useState([]);
  const rois = useMemo(() => apiRois.map(apiRoiToLocal), [apiRois]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddRoiModalOpen, setIsAddRoiModalOpen] = useState(false);
  // ROI 그리는 중인 꼭짓점들. null = 그리기 모드 아님.
  const [drawingVertices, setDrawingVertices] = useState(null);
  // 수정 중인 ROI ID. null = 추가 모드, 값 있으면 수정 모드.
  const [editingRoiId, setEditingRoiId] = useState(null);

  // ===== 실시간 상태 (시각/탐지/통계) =====
  const [now, setNow] = useState(() => new Date());
  // 탐지 결과 — 영상 currentTime 기반 sync 를 위해 ref 버퍼로 관리.
  // WS/REST 가 도착하면 setState 가 아니라 버퍼에 push 만 하고,
  // LiveVideoPanel 내부 rAF 루프가 영상 currentTime 에 맞는 항목을 골라낸다.
  const detectionBufferRef = useRef([]);
  const videoTimeOriginRef = useRef(null);
  // rAF 루프가 골라낸 "현재 영상 시각 기준" 탐지 결과 — status bar 표시용
  const [activeDetection, setActiveDetection] = useState(null);
  // fps / modelVersion — 초기 REST 응답 1회로 채움 (WS DetectionFrame 에는 없음)
  const [detectionMeta, setDetectionMeta] = useState({ fps: null, modelVersion: null });
  const [todayStats, setTodayStats] = useState(null);
  // 선택된 카메라에 연결된 최신 영상 URL / videoId (onPlay 시 detection-frames 프리로드용)
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);

  // 백엔드에서 카메라 목록 로드 (mount 시 1회 + add/rename/delete 후 재호출)
  const reloadCameras = async () => {
    const list = await fetchCameras();
    setApiCameras(list);
    return list;
  };

  useEffect(() => {
    let cancelled = false;
    reloadCameras()
      .then((list) => {
        if (cancelled) return;
        const camIds = list.map((c) => c.cameraId);
        setSelectedCameraId((prev) =>
          camIds.includes(prev) ? prev : (camIds[0] ?? null)
        );
      })
      .catch((err) => {
        if (!cancelled) console.error('카메라 로드 실패:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveToStorage(SELECTED_CAM_STORAGE_KEY, selectedCameraId);
  }, [selectedCameraId]);

  // 1초마다 시계 갱신
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 선택된 카메라의 최신 업로드 영상 URL fetch (cameraContext 기준)
  useEffect(() => {
    if (!selectedCameraId) {
      setCurrentVideoUrl(null);
      setCurrentVideoId(null);
      return;
    }
    let cancelled = false;
    fetchVideos({ cameraContext: selectedCameraId, size: 1, sort: 'uploadedAt,desc' })
      .then((page) => {
        if (cancelled) return;
        const latest = page?.content?.[0];
        setCurrentVideoUrl(latest ? getVideoStreamUrl(latest.videoId) : null);
        setCurrentVideoId(latest?.videoId ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setCurrentVideoUrl(null);
        setCurrentVideoId(null);
      });
    return () => { cancelled = true; };
  }, [selectedCameraId]);

  // detection-frames 폴링 타이머 — videoId 잡힐 때 자동 시작 + onPlay 도 트리거 (둘 다 안전).
  // 카메라/영상 전환 또는 언마운트 시 cleanup.
  const pollTimerRef = useRef(null);
  const DETECTION_POLL_MS = 500;

  // 폴링 시작 헬퍼 — useEffect(videoId 잡힐 때) 와 onPlay 양쪽에서 호출.
  // pollTimerRef 가 이미 있으면 no-op (중복 타이머 방지).
  const startDetectionPolling = (videoId) => {
    if (!videoId || pollTimerRef.current) return;
    const fetchAndMergeFrames = async () => {
      try {
        const frames = await fetchDetectionFrames(videoId);
        if (!Array.isArray(frames)) return;
        const buf = detectionBufferRef.current;
        const existing = new Set(buf.map((f) => f.videoTime));
        let added = false;
        for (const f of frames) {
          if (typeof f?.videoTimeSec !== 'number') continue;
          if (existing.has(f.videoTimeSec)) continue;
          buf.push({
            videoTime: f.videoTimeSec,
            exact: true,
            objects: f.objects ?? [],
          });
          existing.add(f.videoTimeSec);
          added = true;
        }
        if (added) buf.sort((a, b) => a.videoTime - b.videoTime);
      } catch {
        /* 분석 데이터 없을 수 있음 — 다음 폴링 또는 WS 신규 프레임에 의존 */
      }
    };
    fetchAndMergeFrames();
    pollTimerRef.current = setInterval(fetchAndMergeFrames, DETECTION_POLL_MS);
  };

  // videoId 잡히는 즉시 폴링 시작 — 영상이 로딩되는 동안 buffer 미리 채워 초반 깜빡임 감소.
  // <video> 가 autoPlay 로 시작될 때 onPlay 가 같은 함수를 다시 호출해도 위 guard 가 막아줌.
  useEffect(() => {
    if (currentVideoId) startDetectionPolling(currentVideoId);
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoId]);

  // <video onPlay> 핸들러 — 위 effect 가 이미 폴링을 시작했지만, 안전 차원에서 트리거.
  // pause→play 반복 시에도 guard 가 중복 타이머를 막음.
  const handleVideoPlay = () => startDetectionPolling(currentVideoId);

  // 카메라별 status 실시간 구독 — apiCameras id 목록 변경 시(추가/삭제)에만 재구독
  const cameraIdsKey = useMemo(
    () => apiCameras.map((c) => c.cameraId).sort((a, b) => a - b).join(','),
    [apiCameras]
  );
  useEffect(() => {
    if (!cameraIdsKey) return;
    const ids = cameraIdsKey.split(',').map(Number);
    let cancelled = false;
    const unsubs = [];

    ids.forEach((id) => {
      subscribe(`/topic/cameras/${id}/status`, (event) => {
        if (cancelled) return;
        setApiCameras((prev) =>
          prev.map((c) =>
            c.cameraId === event.cameraId
              ? { ...c, status: event.status, lastHeartbeat: event.lastHeartbeat ?? c.lastHeartbeat }
              : c
          )
        );
      })
        .then((u) => { if (cancelled) u(); else unsubs.push(u); })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [cameraIdsKey]);

  // 선택된 카메라의 탐지 결과 — 초기 1회 REST + STOMP 실시간 구독을 모두 ref 버퍼에 적재.
  // 버퍼에서 골라낸 "현재 영상 시각용" detection 은 LiveVideoPanel 의 rAF 루프가 setActiveDetection 으로 알려줌.
  useEffect(() => {
    // 카메라 전환 시 버퍼/origin 초기화
    detectionBufferRef.current = [];
    videoTimeOriginRef.current = null;
    setActiveDetection(null);
    setDetectionMeta({ fps: null, modelVersion: null });

    if (!selectedCameraId) return;
    let cancelled = false;
    let unsub = null;

    // 초기 스냅샷 — 메타데이터 채우고, 가능하면 첫 프레임도 버퍼에 적재
    fetchLatestDetection({ cameraId: selectedCameraId })
      .then((data) => {
        if (cancelled || !data) return;
        setDetectionMeta({ fps: data.fps ?? null, modelVersion: data.modelVersion ?? null });
        const res = computeVideoTime(data, videoTimeOriginRef);
        if (res != null) {
          detectionBufferRef.current.push({ videoTime: res.videoTime, exact: res.exact, objects: data.objects ?? [] });
        }
      })
      .catch(() => { /* Redis 비어있을 수 있음 */ });

    // 실시간 프레임 — 버퍼에 push 만 (즉시 렌더 X)
    subscribe(`/topic/detections/${selectedCameraId}`, (frame) => {
      if (cancelled) return;
      const res = computeVideoTime(frame, videoTimeOriginRef);
      if (res == null) return; // 시각 정보 없으면 매칭 불가능 → 버림
      const buf = detectionBufferRef.current;
      buf.push({ videoTime: res.videoTime, exact: res.exact, objects: frame.objects ?? [] });
      // 정상적으로는 오름차순으로 도착. 도착 순서가 어긋난 경우에만 정렬.
      if (buf.length >= 2 && buf[buf.length - 2].videoTime > res.videoTime) {
        buf.sort((a, b) => a.videoTime - b.videoTime);
      }
      if (buf.length > DETECTION_BUFFER_MAX) {
        buf.splice(0, buf.length - DETECTION_BUFFER_MAX);
      }
    })
      .then((u) => { if (cancelled) u(); else unsub = u; })
      .catch(() => { /* 구독 실패는 폴백 정책 없음 — 추후 재시도 */ });

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [selectedCameraId]);

  // 금일 알림 통계 (자정 기준)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchStatsSummary({
          from: startOfTodayIso(),
          to: endOfTodayIso(),
        });
        if (!cancelled) setTodayStats(data);
      } catch {
        /* 일시 오류 무시 */
      }
    };
    load();
    const id = setInterval(load, STATS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const liveStatus = useMemo(() => {
    const objects = activeDetection?.objects ?? [];
    return {
      date: formatStatusDate(now),
      time: formatStatusTime(now),
      // YOLO 모델별 label 표기 차이 흡수 (model.pt: "Person"/"Forklift(v)"/(d)/(h), best.pt: "person"/"forklift")
      workerCount: objects.filter((o) => {
        const l = (o.label ?? '').toLowerCase();
        return l === 'person' || l === 'worker';
      }).length,
      forkliftCount: objects.filter((o) => {
        const l = (o.label ?? '').toLowerCase();
        return l.startsWith('forklift');
      }).length,
      fps: detectionMeta.fps,
      todayAlarms: todayStats?.totalAlarms ?? 0,
    };
  }, [now, activeDetection, detectionMeta, todayStats]);

  // ROI 는 API 호출 (백엔드 연동되면 그대로 동작)
  useEffect(() => {
    let cancelled = false;
    fetchRois()
      .then((list) => {
        if (cancelled) return;
        setApiRois(list);
      })
      .catch((err) => {
        if (!cancelled) console.error('ROI 로드 실패:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== 파생값 =====
  const visibleRois = rois.filter((r) => r.cameraId === selectedCameraId);

  // 영상에 표시할 ROI: 편집 중인 건 제외 (노란 그리기 상태로만 보이게)
  const displayRois = editingRoiId
    ? visibleRois.filter((r) => r.id !== editingRoiId)
    : visibleRois;

  const editingRoi = editingRoiId
    ? rois.find((r) => r.id === editingRoiId)
    : null;

  const selectedCamera = sites
    .flatMap((s) => s.cameras)
    .find((c) => c.id === selectedCameraId);

  // ===== 카메라 CRUD (백엔드 연동) =====
  const handleRenameCamera = async (cameraId, newName) => {
    const target = apiCameras.find((c) => c.cameraId === cameraId);
    if (!target) return;
    try {
      // PUT 은 전체 필드 덮어쓰기 — 기존 값을 모두 포함시키고 name 만 교체.
      await updateCamera(cameraId, {
        name: newName,
        rtspUrl: target.rtspUrl,
        siteId: target.siteId,
        siteName: target.siteName,
        resolution: target.resolution,
        fps: target.fps,
        status: target.status,
      });
      await reloadCameras();
    } catch (err) {
      alert(err.message ?? '카메라 이름 변경에 실패했습니다.');
    }
  };

  // 데모용 — 카메라 상태 수동 토글. WebSocket broadcast로 사이드바 자동 갱신되지만, 즉시 반응 위해 로컬에도 반영.
  const handleToggleCameraStatus = async (cameraId) => {
    const current = apiCameras.find((c) => c.cameraId === cameraId);
    if (!current) return;
    const next = current.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await setCameraStatus(cameraId, next);
      setApiCameras((prev) =>
        prev.map((c) => (c.cameraId === cameraId ? { ...c, status: next } : c))
      );
    } catch (err) {
      alert(err.message ?? '카메라 상태 전환에 실패했습니다.');
    }
  };

  const handleDeleteCamera = async (cameraId) => {
    try {
      await apiDeleteCamera(cameraId);
      const list = await reloadCameras();
      if (selectedCameraId === cameraId) {
        setSelectedCameraId(list[0]?.cameraId ?? null);
      }
    } catch (err) {
      alert(err.message ?? '카메라 삭제에 실패했습니다.');
    }
  };

  const handleCloseAddModal = () => {
    // 모달 닫을 때 잠정 site 정리 (카메라 미등록 상태로 닫힌 경우)
    setPendingSiteNames([]);
    setIsAddModalOpen(false);
  };

  // 새 공장은 백엔드에 별도 엔티티가 없으므로, 첫 카메라가 추가될 때 자동으로 반영됨.
  // 여기서는 모달 드롭다운에 잠시 표시할 수 있도록 잠정 목록에 넣어둔다.
  const handleAddSite = (siteName) => {
    setPendingSiteNames((prev) =>
      prev.includes(siteName) ? prev : [...prev, siteName]
    );
  };

  const handleAddCamera = async (siteName, cameraName, videoFile) => {
    // 기존 site 면 그 siteId 재사용, 새 site 면 다음 ID 자동 할당.
    const existing = sites.find((s) => s.name === siteName);
    const siteId =
      existing?.siteId ??
      Math.max(0, ...sites.map((s) => s.siteId ?? 0)) + 1;

    try {
      const created = await createCamera({
        name: cameraName,
        rtspUrl: 'rtsp://placeholder',
        siteId,
        siteName,
        resolution: '1920x1080',
        fps: 30,
      });

      // 영상 파일이 있으면 이 카메라에 연결해 업로드 (cameraContext)
      if (videoFile) {
        try {
          await uploadVideo(videoFile, {
            name: `${cameraName} 영상`,
            siteId,
            cameraContext: created.cameraId,
          });
        } catch (err) {
          alert(`카메라는 등록됐지만 영상 업로드에 실패했습니다: ${err.message ?? ''}`);
        }
      }

      await reloadCameras();
      setPendingSiteNames([]);
      setSelectedCameraId(created.cameraId);
    } catch (err) {
      alert(err.message ?? '카메라 추가에 실패했습니다.');
    }
  };

  // ===== ROI CRUD (API 호출) =====
  const handleDeleteRoi = async (roiId) => {
    try {
      await deleteRoi(roiId);
      setApiRois((prev) => prev.filter((r) => r.roiId !== roiId));
    } catch (err) {
      alert(err.message ?? 'ROI 삭제에 실패했습니다.');
    }
  };

  const handleOpenAddRoiModal = () => {
    if (!selectedCameraId) {
      alert('카메라를 먼저 선택해주세요');
      return;
    }
    setEditingRoiId(null);
    setDrawingVertices([]);
    setIsAddRoiModalOpen(true);
  };

  const handleOpenEditRoi = (roiId) => {
    const roi = rois.find((r) => r.id === roiId);
    if (!roi) return;
    setEditingRoiId(roiId);
    setDrawingVertices([...roi.coordinates]);
    setIsAddRoiModalOpen(true);
  };

  const handleCloseAddRoiModal = () => {
    setIsAddRoiModalOpen(false);
    setDrawingVertices(null);
    setEditingRoiId(null);
  };

  const handleAddVertex = (vertex) => {
    setDrawingVertices((prev) => {
      if (!prev || prev.length >= 4) return prev;
      return [...prev, vertex];
    });
  };

  const handleResetVertices = () => {
    setDrawingVertices([]);
  };

  // 추가/수정 통합 저장
  // 백엔드 Roi 엔티티의 NOT NULL 필드(alarmRule, muteForkliftOnly, active) 가 누락되지 않도록
  // create 는 명세 §4.2 기본값을, update 는 기존 raw record 의 값을 채워 넘긴다.
  const handleSaveRoi = async ({ name }) => {
    if (!drawingVertices || drawingVertices.length !== 4) return;

    try {
      if (editingRoiId) {
        const existing = apiRois.find((r) => r.roiId === editingRoiId);
        const updated = await updateRoi(editingRoiId, {
          cameraId: existing?.cameraId ?? selectedCameraId,
          name,
          polygon: drawingVertices,
          alarmRule: existing?.alarmRule ?? 'WORKER_ALONE_OR_INTERACTION',
          muteForkliftOnly: existing?.muteForkliftOnly ?? true,
          dangerDistanceThreshold: existing?.dangerDistanceThreshold ?? 150,
          active: existing?.active ?? true,
        });
        setApiRois((prev) =>
          prev.map((r) => (r.roiId === editingRoiId ? updated : r))
        );
      } else {
        const created = await createRoi({
          cameraId: selectedCameraId,
          name,
          polygon: drawingVertices,
          alarmRule: 'WORKER_ALONE_OR_INTERACTION',
          muteForkliftOnly: true,
          dangerDistanceThreshold: 150,
          active: true,
        });
        setApiRois((prev) => [...prev, created]);
      }
      setDrawingVertices(null);
      setEditingRoiId(null);
    } catch (err) {
      alert(err.message ?? 'ROI 저장에 실패했습니다.');
    }
  };

  return (
    <div className="layout-container">
      <Header />

      <div className="main-content">
        <CameraSidebar
          sites={sites}
          selectedCameraId={selectedCameraId}
          onSelectCamera={setSelectedCameraId}
          onAddCamera={() => setIsAddModalOpen(true)}
          onRenameCamera={handleRenameCamera}
          onDeleteCamera={handleDeleteCamera}
          onToggleCameraStatus={handleToggleCameraStatus}
        />
        <LiveVideoPanel
          cameraName={selectedCamera?.name ?? ''}
          status={liveStatus}
          rois={displayRois}
          drawingVertices={drawingVertices}
          onAddVertex={handleAddVertex}
          detections={activeDetection?.objects ?? []}
          detectionBufferRef={detectionBufferRef}
          onActiveDetectionChange={setActiveDetection}
          videoSrc={currentVideoUrl}
          videoId={currentVideoId}
          onVideoPlay={handleVideoPlay}
        />
        <RoiSidebar
          rois={visibleRois}
          onAddRoi={handleOpenAddRoiModal}
          onEditRoi={handleOpenEditRoi}
          onDeleteRoi={handleDeleteRoi}
        />
      </div>

      {isAddModalOpen && (
        <AddCameraModal
          sites={sites}
          onAddCamera={handleAddCamera}
          onAddSite={handleAddSite}
          onClose={handleCloseAddModal}
        />
      )}

      {isAddRoiModalOpen && (
        <AddRoiModal
          cameraName={selectedCamera?.name ?? ''}
          editingRoi={editingRoi}
          vertices={drawingVertices ?? []}
          onResetVertices={handleResetVertices}
          onSubmit={handleSaveRoi}
          onClose={handleCloseAddRoiModal}
        />
      )}
    </div>
  );
}
