import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../assets/ZONESAFE.png';
import './Header.css';

export default function Header({ companyCode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const displayCode = companyCode ?? localStorage.getItem('companyCode') ?? '';
  const displayName = localStorage.getItem('companyName') ?? displayCode;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('companyCode');
    localStorage.removeItem('companyName');
    setIsMenuOpen(false);
    navigate('/');
  };

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

      <div className="nav-user" ref={userMenuRef}>
        <button
          type="button"
          className="nav-user-trigger"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>{displayCode}</span>
        </button>

        {isMenuOpen && (
          <div className="user-menu" role="menu">
            <div className="user-menu-info">
              <div className="user-menu-row">
                <span className="user-menu-label">회사 코드</span>
                <span className="user-menu-value">{displayCode || '—'}</span>
              </div>
              <div className="user-menu-row">
                <span className="user-menu-label">회사 이름</span>
                <span className="user-menu-value">{displayName || '—'}</span>
              </div>
            </div>
            <button
              type="button"
              className="user-menu-logout"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
