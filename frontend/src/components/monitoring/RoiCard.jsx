import './RoiCard.css';

export default function RoiCard({ roi, onEdit, onDelete }) {
  return (
    <div className="roi-card">
      <div className="roi-card-header">
        <span>{roi.name}</span>
        <span className={`badge ${roi.status}`}>
          {roi.status.toUpperCase()}
        </span>
      </div>
      <div className="roi-card-body">
        <div className="coord-table">
          <div>coordinate</div>
          <div className="grid-2x2">
            {roi.coordinates.map((coord, i) => (
              <span key={i}>({coord[0]}, {coord[1]})</span>
            ))}
          </div>
        </div>
        <div className="roi-actions">
          <button onClick={onDelete}>삭제</button>
          <button onClick={onEdit}>수정</button>
        </div>
      </div>
    </div>
  );
}
