import React, { useState, useEffect } from 'react';
import api from '../api';
import ServerBar from '../components/ServerBar';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import VoiceChannel from '../components/VoiceChannel';
import MembersList from '../components/MembersList';
import UserProfile from '../components/UserProfile';
import ServerSettings from '../components/ServerSettings';
import './Home.css';

// Mobile views: 'servers' | 'channels' | 'chat' | 'members'
export default function Home() {
  const [servers, setServers] = useState([]);
  const [activeServerId, setActiveServerId] = useState(null);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [mobileView, setMobileView] = useState('servers');
  const [showProfile, setShowProfile] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false); // current mobile panel

  useEffect(() => {
    api.get('/api/servers')
      .then(({ data }) => setServers(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeServerId) {
      setActiveServer(null);
      setActiveChannel(null);
      return;
    }
    api.get(`/api/servers/${activeServerId}`)
      .then(({ data }) => {
        setActiveServer(data);
        const firstText = data.channels?.find(c => c.type === 'text');
        if (firstText) setActiveChannel(firstText);
      })
      .catch(console.error);
  }, [activeServerId]);

  const handleServerCreated = (server) => {
    setServers(prev => {
      if (prev.find(s => s._id === server._id)) return prev;
      return [...prev, server];
    });
    setActiveServerId(server._id);
    setMobileView('channels');
  };

  const handleServerUpdated = (server) => {
    setActiveServer(server);
    setServers(prev => prev.map(s => s._id === server._id ? server : s));
  };

  const handleSelectServer = (id) => {
    setActiveServerId(id);
    setMobileView(id ? 'channels' : 'servers');
  };

  const handleSelectChannel = (ch) => {
    setActiveChannel(ch);
    setMobileView('chat');
  };

  return (
    <div className="home">
      {/* ── Desktop layout (always visible) ── */}
      <div className="desktop-only">
        <ServerBar
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={setActiveServerId}
          onServerCreated={handleServerCreated}
        />
        <Sidebar
          server={activeServer}
          activeChannelId={activeChannel?._id}
          onSelectChannel={setActiveChannel}
          onServerUpdated={handleServerUpdated}
          onOpenSettings={() => setShowServerSettings(true)}
          onOpenProfile={() => setShowProfile(true)}
        />
        <div className="main-content">
          {activeChannel?.type === 'voice'
            ? <VoiceChannel server={activeServer} channel={activeChannel} />
            : <ChatArea server={activeServer} channel={activeChannel} />
          }
        </div>
        {activeServer && <MembersList server={activeServer} />}
      </div>

      {/* ── Mobile layout ── */}
      <div className="mobile-only">
        <div className={`mobile-panel ${mobileView === 'servers' ? 'active' : ''}`}>
          <ServerBar servers={servers} activeServerId={activeServerId} onSelectServer={handleSelectServer} onServerCreated={handleServerCreated} mobile />
        </div>
        <div className={`mobile-panel ${mobileView === 'channels' ? 'active' : ''}`}>
          <Sidebar server={activeServer} activeChannelId={activeChannel?._id} onSelectChannel={handleSelectChannel} onServerUpdated={handleServerUpdated} onOpenSettings={() => setShowServerSettings(true)} onOpenProfile={() => setShowProfile(true)} mobile />
        </div>
        <div className={`mobile-panel ${mobileView === 'chat' ? 'active' : ''}`}>
          {activeChannel?.type === 'voice'
            ? <VoiceChannel server={activeServer} channel={activeChannel} />
            : <ChatArea server={activeServer} channel={activeChannel} />
          }
        </div>
        <div className={`mobile-panel ${mobileView === 'members' ? 'active' : ''}`}>
          <MembersList server={activeServer} />
        </div>
        <nav className="mobile-nav">
          <button className={`mobile-nav-btn ${mobileView === 'servers' ? 'active' : ''}`} onClick={() => setMobileView('servers')} aria-label="Servers"><span>🏠</span><span>Servers</span></button>
          <button className={`mobile-nav-btn ${mobileView === 'channels' ? 'active' : ''}`} onClick={() => setMobileView('channels')} disabled={!activeServer} aria-label="Channels"><span>#</span><span>Channels</span></button>
          <button className={`mobile-nav-btn ${mobileView === 'chat' ? 'active' : ''}`} onClick={() => setMobileView('chat')} disabled={!activeChannel} aria-label="Chat"><span>💬</span><span>Chat</span></button>
          <button className={`mobile-nav-btn ${mobileView === 'members' ? 'active' : ''}`} onClick={() => setMobileView('members')} disabled={!activeServer} aria-label="Members"><span>👥</span><span>Members</span></button>
        </nav>
      </div>

      {/* ── Modals ── */}
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
