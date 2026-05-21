import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Monitoring from "./pages/Monitoring";
import HistoryPage from "./pages/HistoryPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import AlarmToaster from "./components/common/AlarmToaster";
import "./App.css";

function App() {
  return (
    <Router>
      <AlarmToaster />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <Monitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;