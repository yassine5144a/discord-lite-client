import React, { useState } from 'react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';
import './ServerBar.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function ServerBar({ servers, activeServerId, onSelectServer, onServerCreated, onOpenDMs, mobile }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
      {/* DMs button */}
      <button
        className={`server-icon dm-icon ${!activeServerId ? 'active' : ''}`}
        onClick={() => { onSelectServer(null); onOpenDMs?.(); }}
        title="Direct Messages"
        aria-label="Direct Messages"
      >
        💬
      </button>

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
              : server.name.slice(0, 2).toUpperCase()
            }
          </button>
          {activeServerId === server._id && <div className="server-active-indicator" />}
        </div>
      ))}

      <div className="server-divider" />

      {/* Add / Join */}
      <button className="server-icon add-icon" onClick={() => { setShowCreate(true); setShowJoin(false); }} title="Create Server" aria-label="Create Server">+</button>
      <button className="server-icon join-icon" onClick={() => { setShowJoin(true); setShowCreate(false); }} title="Join Server" aria-label="Join Server">🔗</button>

      {/* Theme toggle */}
      <div className="server-divider" />
      <button className="server-icon theme-icon" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create a Server</h2>
            <form onSubmit={createServer}>
              <div className="form-group">
                <label>Server Name</label>
                <input type="text" placeholder="My Awesome Server" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={50} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Join a Server</h2>
            <form onSubmit={joinServer}>
              <div className="form-group">
                <label>Invite Code</label>
                <input type="text" placeholder="Enter invite code" value={code} onChange={e => setCode(e.target.value)} autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Joining...' : 'Join'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
