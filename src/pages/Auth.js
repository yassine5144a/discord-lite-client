import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import './Auth.css';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [flipped, setFlipped] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { login, register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const isMobile = window.innerWidth <= 700;

  const flip = (toRegister) => {
    if (isMobile) {
      setMode(toRegister ? 'register' : 'login');
      return;
    }
    if (toRegister && !flipped) {
      setAnimClass('active');
      setFlipped(true);
    } else if (!toRegister && flipped) {
      setAnimClass('close');
      setFlipped(false);
    }
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

  // Mobile: simple tab switch
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
        </div>
      </div>
    );
  }

  // Desktop: 3D flip
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
          </div>
        </div>

      </div>
    </div>
  );
}
