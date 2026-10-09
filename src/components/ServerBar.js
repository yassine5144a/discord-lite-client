import React, { useState } from 'react';
import api, { getAvatarUrl } from '../api';
import { useLang } from '../context/LangContext';
import './ServerBar.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function ServerBar({ servers, activeServerId, onSelectServer, onServerCreated, onOpenDMs, mobile }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
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
      {/* DM button */}
      <div className="server-icon-wrapper">
        <button
          className={`server-icon dm-icon ${!activeServerId ? 'active' : ''}`}
          onClick={() => { onSelectServer(null); onOpenDMs?.(); }}
          title={t('directMessages')}
          aria-label={t('directMessages')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        {!activeServerId && <div className="server-active-indicator" />}
      </div>

      <div className="server-divider" />

      {/* Server list */}
      {servers.map(server => (
        <div key={server._id} className="server-icon-wrapper">
          <button
            className={`server-icon ${activeServerId === server._id ? 'active' : ''}`}
            onClick={() => onSelectServer(server._id)}
            title={server.name}
            aria-label={server.name}
          >
            {server.icon
              ? <img src={`${SERVER_URL}${server.icon}`} alt={server.name} />
              : <span className="server-icon-letters">{server.name.slice(0, 2).toUpperCase()}</span>}
          </button>
          {activeServerId === server._id && <div className="server-active-indicator" />}
        </div>
      ))}

      <div className="server-divider" />

      {/* Create server */}
      <div className="server-icon-wrapper">
        <button
          className="server-icon add-icon"
          onClick={() => { setShowCreate(true); setShowJoin(false); }}
          title={t('createServer')}
          aria-label={t('createServer')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Join server */}
      <div className="server-icon-wrapper">
        <button
          className="server-icon join-icon"
          onClick={() => { setShowJoin(true); setShowCreate(false); }}
          title={t('joinServer')}
          aria-label={t('joinServer')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
      </div>

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
