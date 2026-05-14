import { useEffect, useState } from 'react';
import './Monitoring.css';
import Header from '../components/common/Header';
import CameraSidebar from '../components/monitoring/CameraSidebar';
import LiveVideoPanel from '../components/monitoring/LiveVideoPanel';
import RoiSidebar from '../components/monitoring/RoiSidebar';
import AddCameraModal from '../components/monitoring/AddCameraModal';

// 백엔드 없는 동안 카메라 추가/수정/삭제 결과가 새로고침에도 유지되도록
// localStorage 에 임시 저장. 백엔드 연동 시 이 블록 전체와 useEffect 두 개를 제거하고
// fetchCameras 호출로 교체.
const SITES_STORAGE_KEY = '__monitoring_sites_v1';
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

// TODO: 백엔드 연결 시 src/api/cameras.js, src/api/rois.js로 이동
const initialSites = [
  {
    name: '대구공장 A동',
    cameras: [
      { id: 1, name: '1번 라인 입구' },
      { id: 2, name: '2번 적재구역' },
      { id: 3, name: '3번 출하장' },
    ],
  },
  {
    name: '대구공장 B동',
    cameras: [
      { id: 4, name: 'B동 입구' },
      { id: 5, name: 'B동 지게차 통로' },
    ],
  },
];

const mockRois = [
  {
    id: 1,
    name: '#1 지게차 진입 구역',
    status: 'danger',
    coordinates: [[1, 0], [1, 0], [1, 0], [1, 0]],
  },
  {
    id: 2,
    name: '#2 로봇 접근 구역',
    status: 'safe',
    coordinates: [[1, 0], [1, 0], [1, 0], [1, 0]],
  },
];

const mockStatus = {
  date: '2026-4-27(GMT+9)',
  time: '23:00',
  workerCount: 1,
  forkliftCount: 1,
  fps: 28.4,
  todayAlarms: 2,
};

export default function Monitoring() {
  const [sites, setSites] = useState(() => {
    const loaded = loadFromStorage(SITES_STORAGE_KEY, null);
    return Array.isArray(loaded) ? loaded : initialSites;
  });
  const [selectedCameraId, setSelectedCameraId] = useState(() => {
    const loaded = loadFromStorage(SELECTED_CAM_STORAGE_KEY, null);
    const sitesNow = loadFromStorage(SITES_STORAGE_KEY, null) ?? initialSites;
    const camIds = sitesNow.flatMap((s) => s.cameras.map((c) => c.id));
    return camIds.includes(loaded) ? loaded : (camIds[0] ?? null);
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // sites / selectedCameraId 변경될 때마다 localStorage 동기화
  useEffect(() => {
    saveToStorage(SITES_STORAGE_KEY, sites);
  }, [sites]);

  useEffect(() => {
    saveToStorage(SELECTED_CAM_STORAGE_KEY, selectedCameraId);
  }, [selectedCameraId]);

  const selectedCamera = sites
    .flatMap((s) => s.cameras)
    .find((c) => c.id === selectedCameraId);

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

    // 추가한 카메라를 자동으로 선택
    setSelectedCameraId(newCamera.id);
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
          status={mockStatus}
        />
        <RoiSidebar
          rois={mockRois}
          onAddRoi={() => alert('ROI 추가는 추후 구현')}
          onEditRoi={(id) => alert(`ROI ${id} 수정`)}
          onDeleteRoi={(id) => alert(`ROI ${id} 삭제`)}
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
    </div>
  );
}
