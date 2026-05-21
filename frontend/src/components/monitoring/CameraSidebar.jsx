import { useState } from 'react';
import CameraItem from './CameraItem';
import './CameraSidebar.css';

export default function CameraSidebar({
  sites,
  selectedCameraId,
  onSelectCamera,
  onAddCamera,
  onRenameCamera,
  onDeleteCamera,
  onToggleCameraStatus,
}) {
  const [searchText, setSearchText] = useState('');

  const normalized = searchText.trim().toLowerCase();

  const filteredSites = sites
    .map((site) => ({
      ...site,
      cameras: site.cameras.filter((c) =>
        c.name.toLowerCase().includes(normalized)
      ),
    }))
    .filter((site) => site.cameras.length > 0);

  const hasResults = filteredSites.length > 0;

  // 모든 카메라 이름 (중복 검증용) — 필터링 무관하게 전체 기준
  const allCameraNames = sites.flatMap((s) => s.cameras.map((c) => c.name));

  return (
    <aside className="left-sidebar">
      <div className="sidebar-header">
        <h4>카메라 목록</h4>
        <input
          type="text"
          placeholder="카메라 검색..."
          className="search-input"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="camera-list">
        {hasResults ? (
          filteredSites.map((site, idx) => (
            <div key={site.name}>
              <div
                className="location-group"
                style={idx > 0 ? { marginTop: '20px' } : undefined}
              >
                {site.name}
              </div>
              {site.cameras.map((cam) => (
                <CameraItem
                  key={cam.id}
                  camera={cam}
                  isSelected={cam.id === selectedCameraId}
                  onSelect={onSelectCamera}
                  onRename={onRenameCamera}
                  onDelete={onDeleteCamera}
                  onToggleStatus={onToggleCameraStatus}
                  allCameraNames={allCameraNames}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="camera-list-empty">검색 결과가 없습니다</div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="add-camera-btn" onClick={onAddCamera}>
          + 카메라 추가
        </button>
      </div>
    </aside>
  );
}
