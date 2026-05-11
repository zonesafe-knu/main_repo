import { useState } from 'react';
import './Monitoring.css';
import Header from '../components/common/Header';
import CameraSidebar from '../components/monitoring/CameraSidebar';
import LiveVideoPanel from '../components/monitoring/LiveVideoPanel';
import RoiSidebar from '../components/monitoring/RoiSidebar';
import AddCameraModal from '../components/monitoring/AddCameraModal';

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

const initialRois = [
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
  const [sites, setSites] = useState(initialSites);
  const [rois, setRois] = useState(initialRois);
  const [selectedCameraId, setSelectedCameraId] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const handleDeleteRoi = (roiId) => {
    setRois((prev) => prev.filter((r) => r.id !== roiId));
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
          rois={rois}
          onAddRoi={() => alert('ROI 추가는 추후 구현')}
          onEditRoi={(id) => alert(`ROI ${id} 수정`)}
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
    </div>
  );
}
