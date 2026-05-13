import React, { useState, useEffect } from 'react';
import api, { getAvatarUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import './DMList.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function DMList({ onOpenConversation, activeConvoId }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    api.get('/api/dm').then(({ data }) => setConversations(data)).catch(console.error);
  }, []);

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data);
    } catch (e) {}
  };

  const openDM = async (userId) => {
    try {
      const { data } = await api.post(`/api/dm/open/${userId}`);
      setConversations(prev => prev.find(c => c._id === data._id) ? prev : [data, ...prev]);
      onOpenConversation(data);
      setSearchQuery(''); setSearchResults([]);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const getOtherUser = (convo) => convo.participants?.find(p => p._id !== user?._id);

  return (
    <div className="dm-list">
      <div className="dm-header"><h3>Direct Messages</h3></div>
      <div className="dm-search">
        <input type="text" placeholder="Find or start a conversation..." value={searchQuery} onChange={e => searchUsers(e.target.value)} />
      </div>
      {searchResults.length > 0 && (
        <div className="dm-search-results">
          {searchResults.map(u => (
            <button key={u._id} className="dm-search-item" onClick={() => openDM(u._id)}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                {u.avatar ? <img src={getAvatarUrl(u.avatar)} alt={u.username} /> : u.username.slice(0, 2).toUpperCase()}
                <span className={`status-dot sm status-${u.status || 'offline'}`} />
              </div>
              <span>{u.username}</span>
            </button>
          ))}
        </div>
      )}
      <div className="dm-conversations">
        {conversations.length === 0 && !searchQuery && (
          <div className="dm-empty">
            <span>💬</span>
            <p>No conversations yet</p>
            <p>Search for a user to start chatting</p>
          </div>
        )}
        {conversations.map(convo => {
          const other = getOtherUser(convo);
          if (!other) return null;
          return (
            <button key={convo._id} className={`dm-item ${activeConvoId === convo._id ? 'active' : ''}`} onClick={() => onOpenConversation(convo)}>
              <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                {other.avatar ? <img src={getAvatarUrl(other.avatar)} alt={other.username} /> : other.username.slice(0, 2).toUpperCase()}
                <span className={`status-dot sm status-${other.status || 'offline'}`} />
              </div>
              <div className="dm-item-info">
                <span className="dm-item-name">{other.username}</span>
                <span className="dm-item-status">{other.status || 'offline'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
