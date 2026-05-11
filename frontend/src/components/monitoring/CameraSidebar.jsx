import './CameraSidebar.css';

export default function CameraSidebar({
  sites,
  selectedCameraId,
  onSelectCamera,
  onAddCamera,
}) {
  return (
    <aside className="left-sidebar">
      <div className="sidebar-header">
        <h4>카메라 목록</h4>
        <input
          type="text"
          placeholder="카메라 검색..."
          className="search-input"
        />
      </div>

      <div className="camera-list">
        {sites.map((site, idx) => (
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
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="add-camera-btn" onClick={onAddCamera}>
          + 카메라 추가
        </button>
      </div>
    </aside>
  );
}
