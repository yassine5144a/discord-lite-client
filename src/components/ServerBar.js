import React, { useState } from 'react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import './ServerBar.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function ServerBar({ servers, activeServerId, onSelectServer, onServerCreated, onOpenDMs, mobile }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();

  const createServer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/servers', { name });
      onServerCreated(data);
      setName(''); setShowCreate(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const joinServer = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/api/servers/join/${code.trim()}`);
      onServerCreated(data);
      setCode(''); setShowJoin(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid code');
    } finally { setLoading(false); }
  };

  return (
    <div className={`server-bar ${mobile ? 'server-bar-mobile' : ''}`}>
      <button className={`server-icon dm-icon ${!activeServerId ? 'active' : ''}`} onClick={() => { onSelectServer(null); onOpenDMs?.(); }} title={t('directMessages')} aria-label={t('directMessages')}>
        💬
      </button>

      <div className="server-divider" />

      {servers.map(server => (
        <div key={server._id} className="server-icon-wrapper">
          <button className={`server-icon ${activeServerId === server._id ? 'active' : ''}`} onClick={() => onSelectServer(server._id)} title={server.name} aria-label={server.name}>
            {server.icon ? <img src={`${SERVER_URL}${server.icon}`} alt={server.name} /> : server.name.slice(0, 2).toUpperCase()}
          </button>
          {activeServerId === server._id && <div className="server-active-indicator" />}
        </div>
      ))}

      <div className="server-divider" />

      <button className="server-icon add-icon" onClick={() => { setShowCreate(true); setShowJoin(false); }} title={t('createServer')} aria-label={t('createServer')}>+</button>
      <button className="server-icon join-icon" onClick={() => { setShowJoin(true); setShowCreate(false); }} title={t('joinServer')} aria-label={t('joinServer')}>🔗</button>

      <div className="server-divider" />
      <button className="server-icon theme-icon" onClick={toggleTheme} title={t('theme')} aria-label={t('theme')}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{t('createServer')}</h2>
            <form onSubmit={createServer}>
              <div className="form-group">
                <label>{t('serverName')}</label>
                <input type="text" placeholder={t('serverName')} value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={50} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? t('loading') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{t('joinServer')}</h2>
            <form onSubmit={joinServer}>
              <div className="form-group">
                <label>{t('inviteCode')}</label>
                <input type="text" placeholder={t('inviteCode')} value={code} onChange={e => setCode(e.target.value)} autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowJoin(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? t('loading') : t('join')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
