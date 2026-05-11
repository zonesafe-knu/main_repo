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
        {rois.map((roi) => (
          <RoiCard
            key={roi.id}
            roi={roi}
            onEdit={() => onEditRoi?.(roi.id)}
            onDelete={() => onDeleteRoi?.(roi.id)}
          />
        ))}
      </div>
    </aside>
  );
}
