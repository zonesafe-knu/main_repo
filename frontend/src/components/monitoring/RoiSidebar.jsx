import './RoiSidebar.css';
import RoiCard from './RoiCard';

export default function RoiSidebar({ rois, onAddRoi, onEditRoi, onDeleteRoi }) {
  return (
    <aside className="right-sidebar">
      <div className="roi-header">
        <h4>위험구역(ROI)</h4>
        <button className="add-roi-btn" onClick={onAddRoi}>+</button>
      </div>

      <div className="roi-list">
        {rois.length === 0 ? (
          <div className="roi-list-empty">
            등록된 위험구역이 없습니다.
            <br />
            상단 + 버튼으로 추가하세요.
          </div>
        ) : (
          rois.map((roi) => (
            <RoiCard
              key={roi.id}
              roi={roi}
              onEdit={() => onEditRoi?.(roi.id)}
              onDelete={() => onDeleteRoi?.(roi.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
