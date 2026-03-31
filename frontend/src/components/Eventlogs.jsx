// src/components/EventLogs.jsx
import React, { useState } from 'react';

export default function EventLogs() {
  // ⭐ 여기가 핵심! 나중에 백엔드에서 날아올 데이터의 '가짜 버전'입니다.
  // 이 logs 상자 안에 데이터가 추가되면, 리액트가 알아서 화면을 업데이트합니다.
  const [logs, setLogs] = useState([
    { id: 1, time: '10:22:15', text: 'Worker & Vehicle', color: '#ef4444' }, // 빨강
    { id: 2, time: '10:18:31', text: 'Worker Detected', color: '#eab308' },  // 노랑
    { id: 3, time: '10:10:42', text: 'Vehicle Only', color: '#22c55e' }       // 초록
  ]);

  return (
    <div style={{ width: '100%', color: 'white' }}>
      <h3 style={{ color: '#9ca3af', marginBottom: '15px', fontSize: '16px' }}>EVENT LOGS</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* ⭐ logs 배열을 빙글빙글 돌면서(map) 화면에 하나씩 그려줍니다! */}
        {logs.map((log) => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: log.color }}></div>
            <div>
              <div style={{ fontSize: '14px' }}>{log.time}</div>
              <div style={{ fontSize: '14px', color: '#d1d5db' }}>{log.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}