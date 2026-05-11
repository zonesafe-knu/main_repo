import { useState, useRef, useEffect } from 'react';
import './CameraItem.css';

export default function CameraItem({
  camera,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  allCameraNames = [],
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedName, setEditedName] = useState(camera.name);
  const [renameError, setRenameError] = useState('');
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // 이름 변경 모드 진입 시 input에 자동 포커스 + 전체 선택
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const startRename = () => {
    setEditedName(camera.name);
    setRenameError('');
    setIsRenaming(true);
    setMenuOpen(false);
  };

  const confirmRename = () => {
    const trimmed = editedName.trim();

    // 빈 이름이거나 변경 없으면 조용히 종료
    if (!trimmed || trimmed === camera.name) {
      setRenameError('');
      setIsRenaming(false);
      return;
    }

    // 중복 검증 (자기 자신은 제외)
    const isDuplicate = allCameraNames.some(
      (name) => name === trimmed && name !== camera.name
    );
    if (isDuplicate) {
      setRenameError('이미 존재하는 카메라 이름입니다');
      return; // rename 모드 유지, 사용자가 수정할 수 있게
    }

    setRenameError('');
    onRename?.(camera.id, trimmed);
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setEditedName(camera.name);
    setRenameError('');
    setIsRenaming(false);
  };

  const handleEditChange = (e) => {
    setEditedName(e.target.value);
    if (renameError) setRenameError(''); // 사용자가 수정 시작하면 에러 해제
  };

  const handleEditBlur = () => {
    // 에러 상태에선 blur로 인한 재검증 금지 (alert 반복 방지의 핵심)
    if (renameError) return;
    confirmRename();
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm(`"${camera.name}" 카메라를 삭제할까요?`)) {
      onDelete?.(camera.id);
    }
  };

  if (isRenaming) {
    return (
      <div className="camera-item renaming">
        <input
          ref={inputRef}
          className={`camera-rename-input ${renameError ? 'has-error' : ''}`}
          value={editedName}
          onChange={handleEditChange}
          onBlur={handleEditBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmRename();
            if (e.key === 'Escape') cancelRename();
          }}
        />
        {renameError && (
          <div className="camera-rename-error">{renameError}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`camera-item ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect?.(camera.id)}
    >
      <span className="camera-item-name">{camera.name}</span>

      <div className="camera-item-menu" ref={menuRef}>
        <button
          type="button"
          className="more-btn"
          aria-label="카메라 메뉴"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          ···
        </button>

        {menuOpen && (
          <div className="camera-menu-dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                startRename();
              }}
            >
              이름 변경
            </button>
            <button
              type="button"
              role="menuitem"
              className="danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
