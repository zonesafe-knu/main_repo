import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logoImg from '../assets/ZONESAFE.png';
import { verifyCompanyCode, AuthError } from '../api/auth';
import { saveSession } from '../auth/session';

const Login = () => {
  const [companyCode, setCompanyCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const company = await verifyCompanyCode(companyCode);
      saveSession(company);
      navigate('/monitoring');
    } catch (err) {
      const message = err instanceof AuthError
        ? err.message
        : '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setCompanyCode(e.target.value);
    if (errorMsg) setErrorMsg('');
  };

  return (
    <div className="login-container">
      {/* 왼쪽: 서비스 소개 영역 */}
      <div className="login-left">
        <div className="logo-section">
          <img src={logoImg} alt="ZONESAFE" className="logo-image" />
          <div className="logo-text">
            <p>Intelligent safety management</p>
          </div>
        </div>

        <div className="hero-section">
          <h1>
            실시간 영상 기반<br />
            <span className="highlight">작업자 안전 관리</span> 솔루션
          </h1>
        </div>

        <div className="features-section">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3>Smart<br/>Muting<br/>Control</h3>
            <p>지게차 단독 진입 시 알람을 억제하고 작업자 동반 시에만 경고 발생</p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M10 9l5 3-5 3v-6z"/>
              </svg>
            </div>
            <h3>Ring-<br/>Buffer<br/>Blackbox</h3>
            <p>위험 발생 전후 5초 영상을 자동 저장</p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
                <line x1="17" y1="16" x2="23" y2="16"/>
              </svg>
            </div>
            <h3>Unified<br/>Control<br/>Center</h3>
            <p>관리자가 ROI 설정, 실시간 알람 수신, 과거 로그 조회를 단하나의 화면에서 처리</p>
          </div>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 영역 */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h2>회사 코드 입력</h2>
          <p className="subtitle">회사 식별 코드를 입력하세요.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="companyCode">company code</label>
              <input
                type="text"
                id="companyCode"
                placeholder="ex) knu22"
                value={companyCode}
                onChange={handleChange}
                disabled={isSubmitting}
                autoFocus
                autoComplete="off"
                aria-invalid={errorMsg ? 'true' : 'false'}
                aria-describedby={errorMsg ? 'companyCode-error' : undefined}
              />
            </div>
            {errorMsg && (
              <p id="companyCode-error" className="form-error" role="alert">
                {errorMsg}
              </p>
            )}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || companyCode.trim() === ''}
            >
              {isSubmitting ? '확인 중...' : <>코드 확인 &rarr;</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;