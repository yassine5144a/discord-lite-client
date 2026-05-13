import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import './Auth.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://web-production-cafaa.up.railway.app';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [flipped, setFlipped] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { login, register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Google OAuth callback token
  useEffect(() => {
    const hash = window.location.hash;
    
    // Check for google_token in hash query params (fallback)
    if (hash.includes('google_token=')) {
      const tokenMatch = hash.match(/google_token=([^&]+)/);
      if (tokenMatch) {
        localStorage.setItem('dl_token', tokenMatch[1]);
        window.location.replace('/#/');
        return;
      }
    }

    // Check for token in /auth/callback
    if (hash.includes('/auth/callback')) {
      const queryString = hash.split('?')[1];
      if (queryString) {
        const params = new URLSearchParams(queryString);
        const token = params.get('token');
        if (token) {
          localStorage.setItem('dl_token', token);
          window.location.replace('/#/');
          return;
        }
      }
    }

    // Handle error
    if (hash.includes('error=')) {
      const queryString = hash.split('?')[1];
      if (queryString) {
        const params = new URLSearchParams(queryString);
        const error = params.get('error');
        if (error) setLoginError('Google login failed. Please try again.');
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${SERVER_URL}/api/auth/google`;
  };

  const flip = (toRegister) => {
    if (isMobile) { setMode(toRegister ? 'register' : 'login'); return; }
    if (toRegister && !flipped) { setAnimClass('active'); setFlipped(true); }
    else if (!toRegister && flipped) { setAnimClass('close'); setFlipped(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);
    try {
      await register(registerForm.username, registerForm.email, registerForm.password);
      navigate('/');
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed');
    } finally { setRegisterLoading(false); }
  };

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="auth-page">
        <div className="auth-mobile-card">
          <div className="auth-logo-wrap">
            <div className="auth-logo-icon">⚡</div>
            <span>Discord Lite</span>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>{t('login')}</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>{t('register')}</button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form-mobile">
              <input type="email" placeholder={t('email')} value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required autoComplete="email" />
              <input type="password" placeholder={t('password')} value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required minLength={6} autoComplete="current-password" />
              {loginError && <div className="auth-error">{loginError}</div>}
              <button type="submit" className="auth-btn-primary" disabled={loginLoading}>
                {loginLoading ? <span className="auth-spinner" /> : t('login')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form-mobile">
              <input type="text" placeholder={t('username')} value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} required minLength={3} maxLength={32} autoComplete="username" />
              <input type="email" placeholder={t('email')} value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} required autoComplete="email" />
              <input type="password" placeholder={t('password')} value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} required minLength={6} autoComplete="new-password" />
              {registerError && <div className="auth-error">{registerError}</div>}
              <button type="submit" className="auth-btn-primary" disabled={registerLoading}>
                {registerLoading ? <span className="auth-spinner" /> : t('register')}
              </button>
            </form>
          )}

          <div className="auth-divider"><span>OR</span></div>
          <button className="auth-btn-google" onClick={handleGoogleLogin}>
            <GoogleIcon /> Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop layout (3D flip) ───────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className={`auth-container ${animClass}`}>

        {/* Login Panel */}
        <div className="auth-login-panel">
          <div className="auth-content">
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon">⚡</div>
              <span>Discord Lite</span>
            </div>
            <h1>{t('login')}</h1>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder={t('email')} value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required autoComplete="email" />
              <input type="password" placeholder={t('password')} value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required minLength={6} autoComplete="current-password" />
              {loginError && <div className="auth-error">{loginError}</div>}
              <button type="submit" className="auth-btn-primary" disabled={loginLoading}>
                {loginLoading ? <span className="auth-spinner" /> : t('login')}
              </button>
            </form>
            <div className="auth-divider"><span>OR</span></div>
            <button className="auth-btn-google" onClick={handleGoogleLogin}>
              <GoogleIcon /> Continue with Google
            </button>
          </div>
        </div>

        {/* Flip Front */}
        <div className="auth-page-flip auth-page-front">
          <div className="auth-flip-content auth-content">
            <span className="auth-flip-icon">👋</span>
            <h1>Hello, Friend!</h1>
            <p>Enter your details and start your journey with us</p>
            <button className="auth-btn-outline" onClick={() => flip(true)}>{t('register')} →</button>
          </div>
        </div>

        {/* Flip Back */}
        <div className="auth-page-flip auth-page-back">
          <div className="auth-flip-content auth-content">
            <span className="auth-flip-icon">🎉</span>
            <h1>Welcome Back!</h1>
            <p>To stay connected, please login with your personal info</p>
            <button className="auth-btn-outline" onClick={() => flip(false)}>← {t('login')}</button>
          </div>
        </div>

        {/* Register Panel */}
        <div className="auth-register-panel">
          <div className="auth-content">
            <div className="auth-logo-wrap">
              <div className="auth-logo-icon">⚡</div>
              <span>Discord Lite</span>
            </div>
            <h1>{t('register')}</h1>
            <form onSubmit={handleRegister}>
              <input type="text" placeholder={t('username')} value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} required minLength={3} maxLength={32} autoComplete="username" />
              <input type="email" placeholder={t('email')} value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} required autoComplete="email" />
              <input type="password" placeholder={t('password')} value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} required minLength={6} autoComplete="new-password" />
              {registerError && <div className="auth-error">{registerError}</div>}
              <button type="submit" className="auth-btn-primary" disabled={registerLoading}>
                {registerLoading ? <span className="auth-spinner" /> : t('register')}
              </button>
            </form>
            <div className="auth-divider"><span>OR</span></div>
            <button className="auth-btn-google" onClick={handleGoogleLogin}>
              <GoogleIcon /> Continue with Google
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
