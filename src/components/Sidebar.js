import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ server, activeChannelId, onSelectChannel, onServerUpdated, onOpenSettings, onOpenProfile }) {
  const { user, logout } = useAuth();
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');

  const isAdmin = server?.members?.some(
    m => m.user._id === user?._id && ['owner', 'admin'].includes(m.role)
  );

  const addChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const { data } = await axios.post(`/api/servers/${server._id}/channels`, {
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
        type: newChannelType
      });
      onServerUpdated(data);
      setNewChannelName('');
      setShowAddChannel(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const textChannels = server?.channels?.filter(c => c.type === 'text') || [];
  const voiceChannels = server?.channels?.filter(c => c.type === 'voice') || [];

  return (
    <div className="sidebar">
      {/* Server header */}
      <div className="sidebar-header">
        <span>{server?.name || 'Discord Lite'}</span>
        {server && isAdmin && (
          <button className="settings-btn" onClick={onOpenSettings} title="Server Settings" aria-label="Server Settings">⚙️</button>
        )}
      </div>

      {/* Invite code */}
      {server && (
        <div className="invite-code">
          <span>Invite: </span>
          <code
            title="Click to copy"
            onClick={() => navigator.clipboard.writeText(server.inviteCode)}
            style={{ cursor: 'pointer' }}
          >
            {server.inviteCode}
          </code>
        </div>
      )}

      <div className="channels-list">
        {/* Text channels */}
        <div className="channel-category">
          <span>TEXT CHANNELS</span>
          {isAdmin && (
            <button
              className="add-channel-btn"
              onClick={() => { setShowAddChannel(true); setNewChannelType('text'); }}
              aria-label="Add text channel"
            >
              +
            </button>
          )}
        </div>
        {textChannels.map(ch => (
          <button
            key={ch._id}
            className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`}
            onClick={() => onSelectChannel(ch)}
          >
            <span className="channel-hash">#</span>
            {ch.name}
          </button>
        ))}

        {/* Voice channels */}
        <div className="channel-category" style={{ marginTop: 16 }}>
          <span>VOICE CHANNELS</span>
          {isAdmin && (
            <button
              className="add-channel-btn"
              onClick={() => { setShowAddChannel(true); setNewChannelType('voice'); }}
              aria-label="Add voice channel"
            >
              +
            </button>
          )}
        </div>
        {voiceChannels.map(ch => (
          <button
            key={ch._id}
            className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`}
            onClick={() => onSelectChannel(ch)}
          >
            <span className="channel-hash">🔊</span>
            {ch.name}
          </button>
        ))}
      </div>

      {/* User panel */}
      <div className="user-panel">
        <div className="user-avatar">
          {user?.avatar
            ? <img src={user.avatar} alt={user.username} />
            : user?.username?.slice(0, 2).toUpperCase()
          }
          <span className={`status-dot status-${user?.status || 'offline'}`} />
        </div>
        <div className="user-info">
          <span className="user-name">{user?.username}</span>
          <span className="user-status">{user?.status || 'offline'}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Log out" aria-label="Log out">
          ⏻
        </button>
        <button className="settings-btn" onClick={onOpenProfile} title="Profile Settings" aria-label="Profile Settings" style={{marginLeft: 2}}>
          ⚙️
        </button>
      </div>

      {/* Add channel modal */}
      {showAddChannel && (
        <div className="modal-overlay" onClick={() => setShowAddChannel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Channel</h2>
            <form onSubmit={addChannel}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  className={newChannelType === 'text' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setNewChannelType('text')}
                >
                  # Text
                </button>
                <button
                  type="button"
                  className={newChannelType === 'voice' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setNewChannelType('voice')}
                >
                  🔊 Voice
                </button>
              </div>
              <input
                type="text"
                placeholder="channel-name"
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                autoFocus
                maxLength={32}
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddChannel(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
