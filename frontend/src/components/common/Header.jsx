import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../assets/ZONESAFE.png';
import './Header.css';

export default function Header({ companyCode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const displayCode = companyCode ?? localStorage.getItem('companyCode') ?? '';

  return (
    <header className="top-navbar">
      <div className="nav-logo" onClick={() => navigate('/monitoring')}>
        <img src={logoImg} alt="ZONESAFE" className="nav-logo-img" />
        <p className="nav-subtitle">Intelligent safety management</p>
      </div>

      <div className="nav-menu">
        <span
          className={`nav-item ${location.pathname === '/monitoring' ? 'active' : ''}`}
          onClick={() => navigate('/monitoring')}
        >
          실시간 모니터링
        </span>
        <span
          className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
          onClick={() => navigate('/history')}
        >
          히스토리
        </span>
      </div>

      <div className="nav-user">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>{displayCode}</span>
      </div>
    </header>
  );
}
