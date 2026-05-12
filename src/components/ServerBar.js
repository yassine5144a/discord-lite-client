import React, { useState } from 'react';
import api from '../api';
import './ServerBar.css';

export default function ServerBar({ servers, activeServerId, onSelectServer, onServerCreated, mobile }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const createServer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/servers', { name });
      onServerCreated(data);
      setName('');
      setShowCreate(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const joinServer = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/api/servers/join/${code.trim()}`);
      onServerCreated(data);
      setCode('');
      setShowJoin(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => name.slice(0, 2).toUpperCase();

  return (
    <div className={`server-bar ${mobile ? 'server-bar-mobile' : ''}`}>
      {/* Home button */}
      <button
        className={`server-icon home-icon ${!activeServerId ? 'active' : ''}`}
        onClick={() => onSelectServer(null)}
        title="Home"
        aria-label="Home"
      >
        ⚡
      </button>

      <div className="server-divider" />

      {/* Server list */}
      {servers.map(server => (
        <button
          key={server._id}
          className={`server-icon ${activeServerId === server._id ? 'active' : ''}`}
          onClick={() => onSelectServer(server._id)}
          title={server.name}
          aria-label={server.name}
        >
          {server.icon
            ? <img src={server.icon} alt={server.name} />
            : getInitials(server.name)
          }
        </button>
      ))}

      <div className="server-divider" />

      {/* Add server */}
      <button
        className="server-icon add-icon"
        onClick={() => { setShowCreate(true); setShowJoin(false); }}
        title="Create Server"
        aria-label="Create Server"
      >
        +
      </button>
      <button
        className="server-icon join-icon"
        onClick={() => { setShowJoin(true); setShowCreate(false); }}
        title="Join Server"
        aria-label="Join Server"
      >
        🔗
      </button>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create a Server</h2>
            <form onSubmit={createServer}>
              <input
                type="text"
                placeholder="Server name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                maxLength={50}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Create</button>
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
              <input
                type="text"
                placeholder="Invite code"
                value={code}
                onChange={e => setCode(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
