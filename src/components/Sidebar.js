import React, { useState } from 'react';
import api, { getAvatarUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import AIChat from './AIChat';
import ThemePicker from './ThemePicker';
import './Sidebar.css';

/* ── SVG icons — clean, professional ── */
const IconHash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
    <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
  </svg>
);
const IconVolume = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconAI = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
    <circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>
  </svg>
);
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

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
        <span className="sidebar-title">{server?.name || 'Discord Lite'}</span>
        {server && isAdmin && (
          <button className="icon-btn" onClick={onOpenSettings} title={t('settings')} aria-label={t('settings')}>
            <IconSettings />
          </button>
        )}
      </div>

      {server && (
        <div className="invite-code" onClick={() => navigator.clipboard.writeText(server.inviteCode)} title="Copy invite code">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,opacity:0.5}}>
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>{t('invite')}:</span>
          <code>{server.inviteCode}</code>
        </div>
      )}

      <div className="channels-list">
        {/* Text channels */}
        <div className="channel-category">
          <span>{t('textChannels')}</span>
          {isAdmin && (
            <button className="icon-btn-sm" onClick={() => { setShowAddChannel(true); setNewChannelType('text'); }} aria-label={t('addChannel')} title={t('addChannel')}>
              <IconPlus />
            </button>
          )}
        </div>
        {textChannels.map(ch => (
          <button key={ch._id} className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`} onClick={() => onSelectChannel(ch)}>
            <span className="channel-icon"><IconHash /></span>
            <span className="channel-name">{ch.name}</span>
          </button>
        ))}

        {/* Voice channels */}
        <div className="channel-category" style={{ marginTop: 14 }}>
          <span>{t('voiceChannels')}</span>
          {isAdmin && (
            <button className="icon-btn-sm" onClick={() => { setShowAddChannel(true); setNewChannelType('voice'); }} aria-label={t('addChannel')} title={t('addChannel')}>
              <IconPlus />
            </button>
          )}
        </div>
        {voiceChannels.map(ch => (
          <button key={ch._id} className={`channel-item ${activeChannelId === ch._id ? 'active' : ''}`} onClick={() => onSelectChannel(ch)}>
            <span className="channel-icon"><IconVolume /></span>
            <span className="channel-name">{ch.name}</span>
          </button>
        ))}
      </div>

      {/* User panel — clean icon row with tooltips */}
      <div className="user-panel">
        <button className="user-panel-info" onClick={onOpenProfile} title={t('profile')}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
            {user?.avatar
              ? <img src={getAvatarUrl(user.avatar)} alt={user.username} />
              : user?.username?.slice(0, 2).toUpperCase()}
            <span className={`status-dot status-dot sm status-${user?.status || 'offline'}`} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-status">{t(user?.status || 'offline')}</span>
          </div>
        </button>

        {/* Action icons — right side */}
        <div className="user-panel-actions">
          <button className="panel-icon-btn" onClick={() => setShowAI(true)} title="AI Assistant" aria-label="AI Assistant">
            <IconAI />
          </button>
          <button className="panel-icon-btn" onClick={() => setShowTheme(true)} title={t('theme')} aria-label={t('theme')}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <button className="panel-icon-btn" onClick={logout} title={t('logout')} aria-label={t('logout')}>
            <IconLogout />
          </button>
        </div>
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
                <button type="button" className={newChannelType === 'voice' ? 'btn-primary' : 'btn-secondary'} onClick={() => setNewChannelType('voice')}>Voice</button>
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
