// src/pages/Dashboard.jsx
import React from 'react';
import './Dashboard.css';
import logo from '../assets/ZONESAFE.png';
import EventLogs from '../components/Eventlogs';
import VideoPlayer from '../components/VideoPlayer';
import History from '../components/History'; // 👈 추가
import VideoPlayback from '../components/VideoPlayback'; // 👈 추가

export default function Dashboard() {
  return (
    <div className="dashboard-bg">
      <div className="header-logo-container">
        <img src={logo} alt="ZONESAFE 로고" className="header-logo-img" /> 
      </div>

      <div className="row top-row">
        <div className="box video-box" style={{ padding: 0, border: 'none' }}>
          <VideoPlayer />
        </div>
        <div className="box logs-box">
          <EventLogs />
        </div>
      </div>

      <div className="row bottom-row">
        {/* 👈 하단 왼쪽: History 블록 */}
        <div className="box history-box">
          <History />
        </div>
        
        {/* 👈 하단 오른쪽: VideoPlayback 블록 */}
        <div className="box playback-box">
          <VideoPlayback />
        </div>
      </div>
    </div>
  );
}