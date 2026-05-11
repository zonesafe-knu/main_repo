import { useState, useEffect, useRef } from 'react';
import './AddRoiModal.css';

export default function AddRoiModal({
  cameraName,
  onAddRoi,
  onClose,
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // 모달 등장 시 인풋 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ESC로 닫기
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = (e) => {
    setName(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('구역 이름을 입력해주세요');
      return;
    }
    onAddRoi?.({ name: trimmed });
    onClose?.();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>위험구역 추가</h3>
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
          <p className="roi-target-camera">
            대상 카메라: <strong>{cameraName}</strong>
          </p>

          <div className="form-group">
            <label htmlFor="roi-name">구역 이름</label>
            <input
              ref={inputRef}
              id="roi-name"
              type="text"
              className={`form-input ${error ? 'has-error' : ''}`}
              placeholder="예: 지게차 진입 구역"
              value={name}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="form-group">
            <label>다각형 꼭짓점 좌표</label>
            <div className="roi-coord-placeholder">
              <span className="roi-coord-icon">▱</span>
              <div>
                <div>영상 화면에서 꼭짓점을 클릭해 지정 (추후 구현)</div>
                <div className="roi-coord-note">
                  현재는 임시 좌표가 자동 입력됩니다
                </div>
              </div>
            </div>
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
            disabled={!name.trim()}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
