import { useState, useEffect, useRef } from 'react';
import './AddCameraModal.css';

export default function AddCameraModal({
  sites,
  onAddCamera,
  onAddSite,
  onClose,
}) {
  const [selectedSite, setSelectedSite] = useState(sites[0]?.name ?? '');
  const [isAddingSite, setIsAddingSite] = useState(sites.length === 0);
  const [newSiteName, setNewSiteName] = useState('');
  const [cameraName, setCameraName] = useState('');
  const newSiteInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // 새 공장 등록 모드 진입 시 자동 포커스
  useEffect(() => {
    if (isAddingSite && newSiteInputRef.current) {
      newSiteInputRef.current.focus();
    }
  }, [isAddingSite]);

  const handleRegisterSite = () => {
    const trimmed = newSiteName.trim();
    if (!trimmed) return;
    if (sites.some((s) => s.name === trimmed)) {
      alert('이미 등록된 공장 이름입니다');
      return;
    }
    onAddSite?.(trimmed);
    setSelectedSite(trimmed);
    setIsAddingSite(false);
    setNewSiteName('');
    // 등록 후 카메라 이름 입력창으로 포커스
    setTimeout(() => cameraInputRef.current?.focus(), 0);
  };

  const handleCancelAddSite = () => {
    setIsAddingSite(false);
    setNewSiteName('');
  };

  const handleSubmit = () => {
    const trimmed = cameraName.trim();
    if (!trimmed) {
      alert('카메라 이름을 입력해주세요');
      return;
    }
    if (!selectedSite) {
      alert('공장을 먼저 선택해주세요');
      return;
    }
    // 모든 공장 합쳐서 카메라 이름 중복 검사
    const allCameraNames = sites.flatMap((s) => s.cameras.map((c) => c.name));
    if (allCameraNames.includes(trimmed)) {
      alert('이미 존재하는 카메라 이름입니다');
      return;
    }
    onAddCamera?.(selectedSite, trimmed);
    onClose?.();
  };

  const canSubmit = selectedSite && !isAddingSite && cameraName.trim();

  // 드롭다운에 표시할 공장: 카메라가 있는 공장 + 현재 선택된 공장(방금 등록한 빈 공장 포함)
  const visibleSites = sites.filter(
    (s) => s.cameras.length > 0 || s.name === selectedSite
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>카메라 추가</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* 1단계: 공장 선택 또는 등록 */}
          <div className="form-group">
            <label>공장 선택</label>
            {!isAddingSite ? (
              <div className="form-row">
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="form-select"
                  disabled={visibleSites.length === 0}
                >
                  {visibleSites.length === 0 ? (
                    <option value="">등록된 공장이 없습니다</option>
                  ) : (
                    visibleSites.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  className="form-secondary-btn"
                  onClick={() => setIsAddingSite(true)}
                >
                  + 새 공장 등록
                </button>
              </div>
            ) : (
              <div className="form-row">
                <input
                  ref={newSiteInputRef}
                  type="text"
                  className="form-input"
                  placeholder="새 공장 이름 (예: 광주공장 A동)"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRegisterSite();
                  }}
                />
                <button
                  type="button"
                  className="form-primary-btn"
                  onClick={handleRegisterSite}
                  disabled={!newSiteName.trim()}
                >
                  등록
                </button>
                {sites.length > 0 && (
                  <button
                    type="button"
                    className="form-text-btn"
                    onClick={handleCancelAddSite}
                  >
                    취소
                  </button>
                )}
              </div>
            )}
            {sites.length === 0 && isAddingSite && (
              <p className="form-helper">
                등록된 공장이 없습니다. 먼저 공장을 등록해주세요.
              </p>
            )}
          </div>

          {/* 2단계: 카메라 이름 입력 */}
          <div className="form-group">
            <label>카메라 이름</label>
            <input
              ref={cameraInputRef}
              type="text"
              className="form-input"
              placeholder="예: 4번 라인 입구"
              value={cameraName}
              onChange={(e) => setCameraName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) handleSubmit();
              }}
              disabled={!selectedSite || isAddingSite}
            />
            {(!selectedSite || isAddingSite) && (
              <p className="form-helper">
                공장을 먼저 선택하거나 등록해야 합니다.
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="form-secondary-btn"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="form-primary-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
