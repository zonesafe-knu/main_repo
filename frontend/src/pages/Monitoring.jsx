import { useState, useEffect, useMemo } from 'react';
import './Monitoring.css';
import Header from '../components/common/Header';
import CameraSidebar from '../components/monitoring/CameraSidebar';
import LiveVideoPanel from '../components/monitoring/LiveVideoPanel';
import RoiSidebar from '../components/monitoring/RoiSidebar';
import AddCameraModal from '../components/monitoring/AddCameraModal';
import AddRoiModal from '../components/monitoring/AddRoiModal';
import { fetchCameras } from '../api/cameras';
import { fetchRois, createRoi, updateRoi, deleteRoi } from '../api/rois';
import { fetchLatestDetection } from '../api/detections';
import { fetchStatsSummary } from '../api/stats';

const DETECTION_POLL_MS = 1500;
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

// API 응답 → 컴포넌트가 쓰는 shape 변환
// 카메라: 명세서의 flat 배열을 siteName 기준으로 그룹핑
function camerasToSites(cameras) {
  const grouped = new Map();
  for (const c of cameras) {
    if (!grouped.has(c.siteName)) grouped.set(c.siteName, []);
    grouped.get(c.siteName).push({ id: c.cameraId, name: c.name });
  }
  return Array.from(grouped, ([name, cams]) => ({ name, cameras: cams }));
}

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
  const [sites, setSites] = useState([]);
  const [rois, setRois] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
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

  // 1초마다 시계 갱신
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 선택된 카메라의 최신 탐지 결과 polling (백엔드 연동 시 §11 WebSocket으로 교체)
  useEffect(() => {
    if (!selectedCameraId) {
      setDetection(null);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await fetchLatestDetection({ cameraId: selectedCameraId });
        if (!cancelled) setDetection(data);
      } catch {
        /* 일시 오류는 무시하고 다음 tick에 재시도 */
      }
    };
    poll();
    const id = setInterval(poll, DETECTION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
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

  // ===== 초기 로드 =====
  useEffect(() => {
    let cancelled = false;
    fetchCameras()
      .then((cams) => {
        if (cancelled) return;
        const newSites = camerasToSites(cams);
        setSites(newSites);
        // 첫 카메라 자동 선택
        const firstCam = newSites.flatMap((s) => s.cameras)[0];
        if (firstCam) setSelectedCameraId(firstCam.id);
      })
      .catch((err) => {
        if (!cancelled) console.error('카메라 로드 실패:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchRois()
      .then((list) => {
        if (cancelled) return;
        setRois(list.map(apiRoiToLocal));
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

  // ===== 카메라 CRUD =====
  // TODO: cameras.js에 createCamera/updateCamera/deleteCamera 추가 후 API 호출로 교체
  const handleRenameCamera = (cameraId, newName) => {
    setSites((prev) =>
      prev.map((site) => ({
        ...site,
        cameras: site.cameras.map((c) =>
          c.id === cameraId ? { ...c, name: newName } : c
        ),
      }))
    );
  };

  const handleDeleteCamera = (cameraId) => {
    const newSites = sites
      .map((site) => ({
        ...site,
        cameras: site.cameras.filter((c) => c.id !== cameraId),
      }))
      .filter((site) => site.cameras.length > 0); // 빈 공장 자동 제거
    setSites(newSites);

    if (selectedCameraId === cameraId) {
      const firstRemaining = newSites.flatMap((s) => s.cameras)[0];
      setSelectedCameraId(firstRemaining?.id ?? null);
    }
  };

  const handleCloseAddModal = () => {
    // 등록만 하고 카메라 안 추가한 빈 공장 정리
    setSites((prev) => prev.filter((s) => s.cameras.length > 0));
    setIsAddModalOpen(false);
  };

  const handleAddSite = (siteName) => {
    setSites((prev) => [...prev, { name: siteName, cameras: [] }]);
  };

  const handleAddCamera = (siteName, cameraName) => {
    const maxId = sites
      .flatMap((s) => s.cameras)
      .reduce((max, c) => Math.max(max, c.id), 0);
    const newCamera = { id: maxId + 1, name: cameraName };

    setSites((prev) =>
      prev.map((site) =>
        site.name === siteName
          ? { ...site, cameras: [...site.cameras, newCamera] }
          : site
      )
    );

    setSelectedCameraId(newCamera.id);
  };

  // ===== ROI CRUD (API 호출) =====
  const handleDeleteRoi = async (roiId) => {
    try {
      await deleteRoi(roiId);
      setRois((prev) => prev.filter((r) => r.id !== roiId));
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
  const handleSaveRoi = async ({ name }) => {
    if (!drawingVertices || drawingVertices.length !== 4) return;

    try {
      if (editingRoiId) {
        // 수정 모드
        const updated = await updateRoi(editingRoiId, {
          name,
          polygon: drawingVertices,
        });
        setRois((prev) =>
          prev.map((r) =>
            r.id === editingRoiId ? apiRoiToLocal(updated) : r
          )
        );
      } else {
        // 추가 모드
        const created = await createRoi({
          cameraId: selectedCameraId,
          name,
          polygon: drawingVertices,
        });
        setRois((prev) => [...prev, apiRoiToLocal(created)]);
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
