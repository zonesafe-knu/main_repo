// src/components/VideoPlayback.jsx
import React from 'react';

export default function VideoPlayback() {
  const events = [
    { id: 1, type: 'Worker & Vehicle', location: 'FACTORY FLOOR 3F', color: '#ef4444' },
    { id: 2, type: 'Worker Detected', location: 'FACTORY FLOOR 3F', color: '#eab308' },
    { id: 3, type: 'Vehicle Only', location: 'FACTORY FLOOR 3F', color: '#22c55e' },
  ];

  return (
    <div style={{ width: '100%', color: 'white' }}>
      <div style={{ marginBottom: '15px', fontSize: '14px', color: '#9ca3af' }}> 2026-03-19</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {events.map((event) => (
          <div key={event.id} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 2 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: event.color }}></div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{event.type}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', flex: 1 }}>{event.location}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>-5s</span>
              <button style={{ backgroundColor: '#1f2937', color: 'white', border: '1px solid #374151', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                ▶ event
              </button>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>+5s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}