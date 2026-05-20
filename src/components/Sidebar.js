import React, { useState } from 'react';
import api, { getAvatarUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import AIChat from './AIChat';
import ThemePicker from './ThemePicker';
import './Sidebar.css';

export default function Sidebar({ server, activeChannelId, onSelectChannel, onServerUpdated, onOpenSettings, onOpenProfile }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [showAI, setShowAI] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const isAdmin = server?.members?.some(
    m => m.user._id === user?._id && ['owner', 'admin'].includes(m.role)
  );

  const addChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const { data } = await api.post(`/api/servers/${server._id}/channels`, {
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
      <div className="sidebar-header">
        <span>{server?.name || 'Discord Lite'}</span>
        {server && isAdmin && (
          <button className="settings-btn" onClick={onOpenSettings} title={t('settings')} aria-label={t('settings')}>⚙️</button>
        )}
      </div>

      {server && (
        <div className="invite-code">
          <span>{t('invite')}: </span>
          <code title={t('copy')} onClick={() => navigator.clipboard.writeText(server.inviteCode)} style={{ cursor: 'pointer' }}>
            {server.inviteCode}
          </code>
        </div>
      )}

      <div className="channels-list">
        <div className="channel-category">
          <span>{t('textChannels')}</span>
          {isAdmin && (
            <button className="add-channel-btn" onClick={() => { setShowAddChannel(true); setNewChannelType('text'); }} aria-label={t('addChannel')}>+</button>
          )}
        </div>
        {textChannels.map(ch => (
          <button key={ch._id} className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`} onClick={() => onSelectChannel(ch)}>
            <span className="channel-hash">#</span>{ch.name}
          </button>
        ))}

        <div className="channel-category" style={{ marginTop: 16 }}>
          <span>{t('voiceChannels')}</span>
          {isAdmin && (
            <button className="add-channel-btn" onClick={() => { setShowAddChannel(true); setNewChannelType('voice'); }} aria-label={t('addChannel')}>+</button>
          )}
        </div>
        {voiceChannels.map(ch => (
          <button key={ch._id} className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`} onClick={() => onSelectChannel(ch)}>
            <span className="channel-hash">🔊</span>{ch.name}
          </button>
        ))}
      </div>

      <div className="user-panel">
        <div className="user-avatar">
          {user?.avatar ? <img src={user.avatar} alt={user.username} /> : user?.username?.slice(0, 2).toUpperCase()}
          <span className={`status-dot status-${user?.status || 'offline'}`} />
        </div>
        <div className="user-info">
          <span className="user-name">{user?.username}</span>
          <span className="user-status">{t(user?.status || 'offline')}</span>
        </div>
        {/* AI Assistant */}
        <button className="user-panel-btn ai-btn" onClick={() => setShowAI(true)} title="AI Assistant" aria-label="AI Assistant">🤖</button>
        {/* Theme */}
        <button className="user-panel-btn theme-btn" onClick={() => setShowTheme(true)} title={t('theme')} aria-label={t('theme')}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="settings-btn" onClick={onOpenProfile} title={t('profile')} aria-label={t('profile')}>⚙️</button>
        <button className="logout-btn" onClick={logout} title={t('logout')} aria-label={t('logout')}>⏻</button>
      </div>

      {showAI && <AIChat onClose={() => setShowAI(false)} />}
      {showTheme && (
        <div className="modal-overlay" onClick={() => setShowTheme(false)}>
          <div onClick={e => e.stopPropagation()}>
            <ThemePicker onClose={() => setShowTheme(false)} />
          </div>
        </div>
      )}

      {showAddChannel && (
        <div className="modal-overlay" onClick={() => setShowAddChannel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{t('addChannel')}</h2>
            <form onSubmit={addChannel}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button type="button" className={newChannelType === 'text' ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewChannelType('text')}># Text</button>
                <button type="button" className={newChannelType === 'voice' ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewChannelType('voice')}>🔊 Voice</button>
              </div>
              <input type="text" placeholder={t('channelName')} value={newChannelName} onChange={e => setNewChannelName(e.target.value)} autoFocus maxLength={32} />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddChannel(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary">{t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
