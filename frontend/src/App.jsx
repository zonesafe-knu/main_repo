import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
// 👇 바로 이 부분이 빠져있거나 이름이 달라서 났던 에러입니다!
import Monitoring from "./pages/Monitoring"; 
import HistoryPage from "./pages/HistoryPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;