// src/components/VideoPlayer.jsx
import React from 'react';

export default function VideoPlayer() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* 1. 가짜 CCTV 배경 이미지 (나중에 진짜 스트리밍 주소로 바뀔 곳) */}
      <img 
        src="https://via.placeholder.com/800x450/333333/ffffff?text=CCTV+Live+Stream+Waiting..." 
        alt="CCTV 화면" 
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
      />

      {/* 2. 가짜 AI 바운딩 박스 (나중에 백엔드가 주는 x, y 좌표값으로 위치가 바뀔 곳) */}
      <div style={{
        position: 'absolute', 
        top: '30%', left: '40%', /* 👈 이 위치값이 나중에 실시간으로 변하게 됩니다! */
        width: '150px', height: '200px',
        border: '3px solid #ef4444',
      }}>
        <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 4px', fontSize: '12px', fontWeight: 'bold' }}>
          person 0.95
        </span>
      </div>

    </div>
  );
}