import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ server, activeChannelId, onSelectChannel, onServerUpdated, onOpenSettings, onOpenProfile, mobile }) {
  const { user, logout } = useAuth();
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');

  const isAdmin = server?.members?.some(
    m => (m.user._id || m.user) === user?._id && ['owner', 'admin'].includes(m.role)
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
        <span className="sidebar-title">{server?.name || 'Discord Lite'}</span>
        {server && isAdmin && (
          <button className="icon-btn" onClick={onOpenSettings} title="Server Settings" aria-label="Server Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Invite code */}
      {server && (
        <div className="invite-banner" onClick={() => { navigator.clipboard.writeText(server.inviteCode); }} title="Click to copy">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          <span>Invite: <code>{server.inviteCode}</code></span>
        </div>
      )}

      {/* Channels */}
      <div className="channels-list">
        {/* Text channels */}
        <div className="channel-category">
          <span>Text Channels</span>
          {isAdmin && (
            <button className="icon-btn-sm" onClick={() => { setShowAddChannel(true); setNewChannelType('text'); }} aria-label="Add text channel">+</button>
          )}
        </div>
        {textChannels.map(ch => (
          <button
            key={ch._id}
            className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`}
            onClick={() => onSelectChannel(ch)}
          >
            <svg className="channel-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span>{ch.name}</span>
          </button>
        ))}

        {/* Voice channels */}
        <div className="channel-category" style={{ marginTop: 12 }}>
          <span>Voice Channels</span>
          {isAdmin && (
            <button className="icon-btn-sm" onClick={() => { setShowAddChannel(true); setNewChannelType('voice'); }} aria-label="Add voice channel">+</button>
          )}
        </div>
        {voiceChannels.map(ch => (
          <button
            key={ch._id}
            className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`}
            onClick={() => onSelectChannel(ch)}
          >
            <svg className="channel-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <span>{ch.name}</span>
          </button>
        ))}
      </div>

      {/* User panel */}
      <div className="user-panel">
        <button className="user-panel-info" onClick={onOpenProfile} aria-label="Open profile">
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
            {user?.avatar ? <img src={user.avatar} alt={user.username} /> : user?.username?.slice(0, 2).toUpperCase()}
            <span className={`status-dot sm status-${user?.status || 'offline'}`} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-status">{user?.status || 'offline'}</span>
          </div>
        </button>
        <button className="icon-btn danger-hover" onClick={logout} title="Log out" aria-label="Log out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </div>

      {/* Add channel modal */}
      {showAddChannel && (
        <div className="modal-overlay" onClick={() => setShowAddChannel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Channel</h2>
            <form onSubmit={addChannel}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button type="button" className={newChannelType === 'text' ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewChannelType('text')} style={{ flex: 1 }}>
                  # Text
                </button>
                <button type="button" className={newChannelType === 'voice' ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewChannelType('voice')} style={{ flex: 1 }}>
                  🔊 Voice
                </button>
              </div>
              <div className="form-group">
                <label>Channel Name</label>
                <input type="text" placeholder="channel-name" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} autoFocus maxLength={32} />
              </div>
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
