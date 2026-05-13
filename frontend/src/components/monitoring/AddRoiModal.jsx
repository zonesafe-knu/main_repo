import { useState, useEffect, useRef } from 'react';
import './AddRoiModal.css';

const MAX_VERTICES = 4;

/**
 * 위험구역 추가/수정 모달.
 * - editingRoi가 null이면 추가 모드, 객체면 수정 모드.
 */
export default function AddRoiModal({
  cameraName,
  editingRoi = null,
  vertices = [],
  onResetVertices,
  onSubmit,
  onClose,
}) {
  const isEditMode = editingRoi !== null;
  const [name, setName] = useState(editingRoi?.name ?? '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (isEditMode) inputRef.current?.select();
  }, [isEditMode]);

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
    if (vertices.length < MAX_VERTICES) {
      setError(`꼭짓점 ${MAX_VERTICES}개를 모두 선택해주세요`);
      return;
    }
    onSubmit?.({ name: trimmed });
    onClose?.();
  };

  const isVertexComplete = vertices.length === MAX_VERTICES;
  const canSubmit = name.trim() && isVertexComplete;

  return (
    <div className="modal-backdrop modal-backdrop-floating">
      <div className="modal-card modal-card-floating">
        <div className="modal-header">
          <h3>{isEditMode ? '위험구역 수정' : '위험구역 추가'}</h3>
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
            <label>다각형 꼭짓점</label>
            <div className="roi-vertex-status">
              <span
                className={`roi-vertex-counter ${
                  isVertexComplete ? 'complete' : ''
                }`}
              >
                {vertices.length} / {MAX_VERTICES} 선택됨
              </span>
              {vertices.length > 0 && (
                <button
                  type="button"
                  className="roi-vertex-reset"
                  onClick={onResetVertices}
                >
                  다시 선택
                </button>
              )}
            </div>
            <p className="roi-vertex-hint">
              {isEditMode
                ? '좌표를 바꾸려면 "다시 선택" 후 영상에서 다시 클릭하세요. 이름만 변경하려면 그대로 저장.'
                : `영상에서 꼭짓점이 될 위치를 ${MAX_VERTICES}번 클릭하세요.`}
            </p>
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
            {isEditMode ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}
