import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    axios.get('/api/servers').then(({ data }) => setServers(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeServerId) { setActiveServer(null); setActiveChannel(null); return; }
    axios.get(`/api/servers/${activeServerId}`)
      .then(({ data }) => {
        setActiveServer(data);
        const firstText = data.channels?.find(c => c.type === 'text');
        if (firstText) setActiveChannel(firstText);
      })
      .catch(console.error);
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

  // Determine what to show in main content
  const mainContent = dmMode
    ? <DMChat conversation={activeConvo} />
    : activeChannel?.type === 'voice'
      ? <VoiceChannel server={activeServer} channel={activeChannel} />
      : <ChatArea server={activeServer} channel={activeChannel} />;

  const sidebarContent = dmMode
    ? <DMList onOpenConversation={handleOpenConversation} activeConvoId={activeConvo?._id} />
    : <Sidebar
        server={activeServer}
        activeChannelId={activeChannel?._id}
        onSelectChannel={setActiveChannel}
        onServerUpdated={handleServerUpdated}
        onOpenSettings={() => setShowServerSettings(true)}
        onOpenProfile={() => setShowProfile(true)}
      />;

  return (
    <div className="home">
      {/* ── Desktop ── */}
      <div className="desktop-only">
        <ServerBar
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={handleSelectServer}
          onServerCreated={handleServerCreated}
          onOpenDMs={handleOpenDMs}
        />
        {sidebarContent}
        <div className="main-content">{mainContent}</div>
        {!dmMode && activeServer && (
          <MembersList server={activeServer} onServerUpdated={handleServerUpdated} />
        )}
      </div>

      {/* ── Mobile ── */}
      <div className="mobile-only">
        <div className={`mobile-panel ${mobileView === 'servers' ? 'active' : ''}`}>
          <ServerBar servers={servers} activeServerId={activeServerId} onSelectServer={handleSelectServer} onServerCreated={handleServerCreated} onOpenDMs={handleOpenDMs} mobile />
        </div>
        <div className={`mobile-panel ${mobileView === 'channels' ? 'active' : ''}`}>
          {dmMode
            ? <DMList onOpenConversation={handleOpenConversation} activeConvoId={activeConvo?._id} />
            : <Sidebar server={activeServer} activeChannelId={activeChannel?._id} onSelectChannel={handleSelectChannel} onServerUpdated={handleServerUpdated} onOpenSettings={() => setShowServerSettings(true)} onOpenProfile={() => setShowProfile(true)} mobile />
          }
        </div>
        <div className={`mobile-panel ${mobileView === 'chat' ? 'active' : ''}`}>
          {mainContent}
        </div>
        <div className={`mobile-panel ${mobileView === 'members' ? 'active' : ''}`}>
          {!dmMode && <MembersList server={activeServer} onServerUpdated={handleServerUpdated} />}
        </div>

        <nav className="mobile-nav">
          <button className={`mobile-nav-btn ${mobileView === 'servers' ? 'active' : ''}`} onClick={() => setMobileView('servers')} aria-label="Servers">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
            <span>Servers</span>
          </button>
          <button className={`mobile-nav-btn ${mobileView === 'channels' ? 'active' : ''}`} onClick={() => setMobileView('channels')} aria-label="Channels">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            <span>Channels</span>
          </button>
          <button className={`mobile-nav-btn ${mobileView === 'chat' ? 'active' : ''}`} onClick={() => setMobileView('chat')} disabled={!activeChannel && !activeConvo} aria-label="Chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.5c0-1.38-1.12-2.5-2.5-2.5h-13C4.12 4 3 5.12 3 6.5v9C3 16.88 4.12 18 5.5 18H18l3 3V6.5z"/></svg>
            <span>Chat</span>
          </button>
          <button className={`mobile-nav-btn ${mobileView === 'members' ? 'active' : ''}`} onClick={() => setMobileView('members')} disabled={!activeServer || dmMode} aria-label="Members">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <span>Members</span>
          </button>
        </nav>
      </div>

      {/* Modals */}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      {showServerSettings && activeServer && (
        <ServerSettings
          server={activeServer}
          onClose={() => setShowServerSettings(false)}
          onUpdated={(s) => { handleServerUpdated(s); setShowServerSettings(false); }}
        />
      )}
    </div>
  );
}
