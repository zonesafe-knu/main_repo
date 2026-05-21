import { useState, useEffect, useMemo } from 'react';
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
} from '../api/cameras';
import { fetchRois, createRoi, updateRoi, deleteRoi } from '../api/rois';
import { fetchLatestDetection } from '../api/detections';
import { fetchStatsSummary } from '../api/stats';
import { subscribe } from '../api/ws';

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
    map.get(siteName).cameras.push({ id: c.cameraId, name: c.name });
  }
  return Array.from(map, ([name, { siteId, cameras }]) => ({ name, siteId, cameras }));
}

const STATS_POLL_MS = 60_000;

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
  const [detection, setDetection] = useState(null);
  const [todayStats, setTodayStats] = useState(null);

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

  // 선택된 카메라의 탐지 결과 — 초기 1회 REST(latest, fps/modelVersion 포함) + STOMP 실시간 구독
  useEffect(() => {
    if (!selectedCameraId) {
      setDetection(null);
      return;
    }
    let cancelled = false;
    let unsub = null;

    // 초기 스냅샷 (구독 전 화면 비지 않도록)
    fetchLatestDetection({ cameraId: selectedCameraId })
      .then((data) => { if (!cancelled) setDetection(data); })
      .catch(() => { /* Redis 비어있을 수 있음 */ });

    // 실시간 프레임 구독 — DetectionFrame 페이로드는 fps 미포함이라 fps 는 이전 값 유지
    subscribe(`/topic/detections/${selectedCameraId}`, (frame) => {
      if (cancelled) return;
      setDetection((prev) => ({
        cameraId: frame.cameraId,
        frameTimestamp: frame.frameTs,
        objects: frame.objects ?? [],
        fps: prev?.fps ?? null,
        modelVersion: prev?.modelVersion ?? null,
      }));
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
    const objects = detection?.objects ?? [];
    return {
      date: formatStatusDate(now),
      time: formatStatusTime(now),
      workerCount: objects.filter((o) => o.label === 'worker').length,
      forkliftCount: objects.filter((o) => o.label === 'forklift').length,
      fps: detection?.fps ?? null,
      todayAlarms: todayStats?.totalAlarms ?? 0,
    };
  }, [now, detection, todayStats]);

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

  const handleAddCamera = async (siteName, cameraName) => {
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
        />
        <LiveVideoPanel
          cameraName={selectedCamera?.name ?? ''}
          status={liveStatus}
          rois={displayRois}
          drawingVertices={drawingVertices}
          onAddVertex={handleAddVertex}
          detections={detection?.objects ?? []}
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
