import { useState } from 'react';
import './Monitoring.css';
import Header from '../components/common/Header';
import CameraSidebar from '../components/monitoring/CameraSidebar';
import LiveVideoPanel from '../components/monitoring/LiveVideoPanel';
import RoiSidebar from '../components/monitoring/RoiSidebar';

// TODO: 백엔드 연결 시 src/api/cameras.js, src/api/rois.js로 이동
const mockSites = [
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
  const [selectedCameraId, setSelectedCameraId] = useState(1);

  const selectedCamera = mockSites
    .flatMap((s) => s.cameras)
    .find((c) => c.id === selectedCameraId);

  return (
    <div className="layout-container">
      <Header />

      <div className="main-content">
        <CameraSidebar
          sites={mockSites}
          selectedCameraId={selectedCameraId}
          onSelectCamera={setSelectedCameraId}
          onAddCamera={() => alert('카메라 추가는 추후 구현')}
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
    </div>
  );
}
