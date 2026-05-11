import { useState } from 'react';
import './CameraSidebar.css';

export default function CameraSidebar({
  sites,
  selectedCameraId,
  onSelectCamera,
  onAddCamera,
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
                <div
                  key={cam.id}
                  className={`camera-item ${
                    cam.id === selectedCameraId ? 'active' : ''
                  }`}
                  onClick={() => onSelectCamera?.(cam.id)}
                >
                  {cam.name} <span className="more-btn">···</span>
                </div>
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
