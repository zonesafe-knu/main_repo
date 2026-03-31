// src/components/History.jsx
import React from 'react';

export default function History() {
  // 나중에 백엔드 DB에서 가져올 가짜 날짜 데이터
  const historyData = [
    { id: 1, date: '2026-03-19', thumbnail: 'https://via.placeholder.com/60/333/fff?text=03-19' },
    { id: 2, date: '2026-03-18', thumbnail: 'https://via.placeholder.com/60/333/fff?text=03-18' },
    { id: 3, date: '2026-03-17', thumbnail: 'https://via.placeholder.com/60/333/fff?text=03-17' },
    { id: 4, date: '2026-03-16', thumbnail: 'https://via.placeholder.com/60/333/fff?text=03-16' },
  ];

  return (
    <div style={{ width: '100%', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#9ca3af' }}>HISTORY</span>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>MAR ∨ 2026 ∨</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {historyData.map((item) => (
          <div key={item.id} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px', borderRadius: '8px', backgroundColor: item.id === 1 ? '#1f2937' : 'transparent',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="radio" checked={item.id === 1} readOnly />
              <span style={{ fontSize: '13px' }}>{item.date}</span>
            </div>
            <img src={item.thumbnail} alt="thumb" style={{ borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}