import React, { useState, useEffect } from 'react';
import api from '../api';
import ServerBar from '../components/ServerBar';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import VoiceChannel from '../components/VoiceChannel';
import MembersList from '../components/MembersList';
import DMList from '../components/DMList';
import DMChat from '../components/DMChat';
import UserProfile from '../components/UserProfile';
import ServerSettings from '../components/ServerSettings';
import './Home.css';

export default function Home() {
  const [servers, setServers] = useState([]);
  const [activeServerId, setActiveServerId] = useState(null);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [dmMode, setDmMode] = useState(false);
  const [activeConvo, setActiveConvo] = useState(null);
  const [mobileView, setMobileView] = useState('servers');
  const [showProfile, setShowProfile] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);

  useEffect(() => {
    api.get('/api/servers').then(({ data }) => setServers(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeServerId) { setActiveServer(null); setActiveChannel(null); return; }
    api.get(`/api/servers/${activeServerId}`)
      .then(({ data }) => {
        setActiveServer(data);
        const firstText = data.channels?.find(c => c.type === 'text');
        if (firstText) setActiveChannel(firstText);
      }).catch(console.error);
  }, [activeServerId]);

  const handleServerCreated = (server) => {
    setServers(prev => prev.find(s => s._id === server._id) ? prev : [...prev, server]);
    setActiveServerId(server._id);
    setDmMode(false);
    setMobileView('channels');
  };

  const handleServerUpdated = (server) => {
    setActiveServer(server);
    setServers(prev => prev.map(s => s._id === server._id ? server : s));
  };

  const handleSelectServer = (id) => {
    setActiveServerId(id);
    setDmMode(false);
    setMobileView(id ? 'channels' : 'servers');
  };

  const handleSelectChannel = (ch) => {
    setActiveChannel(ch);
    setMobileView('chat');
  };

  const handleOpenDMs = () => {
    setDmMode(true);
    setActiveServerId(null);
    setMobileView('channels');
  };

  const handleOpenConversation = (convo) => {
    setActiveConvo(convo);
    setMobileView('chat');
  };

  const mainContent = dmMode
    ? <DMChat conversation={activeConvo} />
    : activeChannel?.type === 'voice'
      ? <VoiceChannel server={activeServer} channel={activeChannel} />
      : <ChatArea server={activeServer} channel={activeChannel} />;

  const sidebarContent = dmMode
    ? <DMList onOpenConversation={handleOpenConversation} activeConvoId={activeConvo?._id} />
    : <Sidebar server={activeServer} activeChannelId={activeChannel?._id} onSelectChannel={setActiveChannel} onServerUpdated={handleServerUpdated} onOpenSettings={() => setShowServerSettings(true)} onOpenProfile={() => setShowProfile(true)} />;

  return (
    <div className="home">
      {/* Desktop */}
      <div className="desktop-only">
        <ServerBar servers={servers} activeServerId={activeServerId} onSelectServer={handleSelectServer} onServerCreated={handleServerCreated} onOpenDMs={handleOpenDMs} />
        {sidebarContent}
        <div className="main-content">{mainContent}</div>
        {!dmMode && activeServer && <MembersList server={activeServer} onServerUpdated={handleServerUpdated} />}
      </div>

      {/* Mobile */}
      <div className="mobile-only">
        <div className={`mobile-panel ${mobileView === 'servers' ? 'active' : ''}`}>
          <ServerBar servers={servers} activeServerId={activeServerId} onSelectServer={handleSelectServer} onServerCreated={handleServerCreated} onOpenDMs={handleOpenDMs} mobile />
        </div>
        <div className={`mobile-panel ${mobileView === 'channels' ? 'active' : ''}`}>
          <div className="mobile-panel-header">
            <button className="mobile-back-btn" onClick={() => setMobileView('servers')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="mobile-panel-title">{dmMode ? 'Messages' : (activeServer?.name || 'Channels')}</span>
          </div>
          {dmMode
            ? <DMList onOpenConversation={handleOpenConversation} activeConvoId={activeConvo?._id} />
            : <Sidebar server={activeServer} activeChannelId={activeChannel?._id} onSelectChannel={handleSelectChannel} onServerUpdated={handleServerUpdated} onOpenSettings={() => setShowServerSettings(true)} onOpenProfile={() => setShowProfile(true)} mobile />
          }
        </div>
        <div className={`mobile-panel ${mobileView === 'chat' ? 'active' : ''}`}>
          <div className="mobile-panel-header">
            <button className="mobile-back-btn" onClick={() => setMobileView('channels')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="mobile-panel-title">
              {dmMode ? (activeConvo?.participants?.find(p => p._id !== activeConvo?.me)?.[0]?.username || 'Chat') : (activeChannel ? `# ${activeChannel.name}` : 'Chat')}
            </span>
            {!dmMode && activeServer && (
              <button className="mobile-members-btn" onClick={() => setMobileView('members')}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </button>
            )}
          </div>
          {mainContent}
        </div>
        <div className={`mobile-panel ${mobileView === 'members' ? 'active' : ''}`}>
          <div className="mobile-panel-header">
            <button className="mobile-back-btn" onClick={() => setMobileView('chat')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="mobile-panel-title">Members</span>
          </div>
          {!dmMode && <MembersList server={activeServer} onServerUpdated={handleServerUpdated} />}
        </div>

        <nav className="mobile-nav">
          <button className={`mobile-nav-btn ${mobileView === 'servers' ? 'active' : ''}`} onClick={() => setMobileView('servers')} aria-label="Servers">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
              <rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Servers</span>
          </button>
          <button className={`mobile-nav-btn ${mobileView === 'channels' ? 'active' : ''}`} onClick={() => setMobileView('channels')} aria-label="Channels">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/>
              <line x1="9" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="15" y2="21"/>
            </svg>
            <span>Channels</span>
          </button>
          <button className={`mobile-nav-btn ${mobileView === 'chat' ? 'active' : ''}`} onClick={() => setMobileView('chat')} disabled={!activeChannel && !activeConvo} aria-label="Chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Chat</span>
          </button>
          <button className={`mobile-nav-btn ${mobileView === 'members' ? 'active' : ''}`} onClick={() => setMobileView('members')} disabled={!activeServer || dmMode} aria-label="Members">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Members</span>
          </button>
        </nav>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      {showServerSettings && activeServer && (
        <ServerSettings server={activeServer} onClose={() => setShowServerSettings(false)} onUpdated={(s) => { handleServerUpdated(s); setShowServerSettings(false); }} />
      )}
    </div>
  );
}
