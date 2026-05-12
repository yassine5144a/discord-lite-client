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
          {dmMode
            ? <DMList onOpenConversation={handleOpenConversation} activeConvoId={activeConvo?._id} />
            : <Sidebar server={activeServer} activeChannelId={activeChannel?._id} onSelectChannel={handleSelectChannel} onServerUpdated={handleServerUpdated} onOpenSettings={() => setShowServerSettings(true)} onOpenProfile={() => setShowProfile(true)} mobile />
          }
        </div>
        <div className={`mobile-panel ${mobileView === 'chat' ? 'active' : ''}`}>{mainContent}</div>
        <div className={`mobile-panel ${mobileView === 'members' ? 'active' : ''}`}>
          {!dmMode && <MembersList server={activeServer} onServerUpdated={handleServerUpdated} />}
        </div>
        <nav className="mobile-nav">
          <button className={`mobile-nav-btn ${mobileView === 'servers' ? 'active' : ''}`} onClick={() => setMobileView('servers')} aria-label="Servers"><span>🏠</span><span>Servers</span></button>
          <button className={`mobile-nav-btn ${mobileView === 'channels' ? 'active' : ''}`} onClick={() => setMobileView('channels')} aria-label="Channels"><span>#</span><span>Channels</span></button>
          <button className={`mobile-nav-btn ${mobileView === 'chat' ? 'active' : ''}`} onClick={() => setMobileView('chat')} disabled={!activeChannel && !activeConvo} aria-label="Chat"><span>💬</span><span>Chat</span></button>
          <button className={`mobile-nav-btn ${mobileView === 'members' ? 'active' : ''}`} onClick={() => setMobileView('members')} disabled={!activeServer || dmMode} aria-label="Members"><span>👥</span><span>Members</span></button>
        </nav>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      {showServerSettings && activeServer && (
        <ServerSettings server={activeServer} onClose={() => setShowServerSettings(false)} onUpdated={(s) => { handleServerUpdated(s); setShowServerSettings(false); }} />
      )}
    </div>
  );
}
