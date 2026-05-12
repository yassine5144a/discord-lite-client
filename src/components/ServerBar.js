import React, { useState } from 'react';
import axios from 'axios';
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
      const { data } = await axios.post('/api/servers', { name });
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
      const { data } = await axios.post(`/api/servers/join/${code.trim()}`);
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
      <button className="server-icon add-icon" onClick={() => { setShowCreate(true); setShowJoin(false); }} title="Create Server" aria-label="Create Server">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
      </button>
      <button className="server-icon join-icon" onClick={() => { setShowJoin(true); setShowCreate(false); }} title="Join Server" aria-label="Join Server">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
        </svg>
      </button>

      {/* Theme toggle */}
      <div className="server-divider" />
      <button className="server-icon theme-icon" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Modals */}
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
