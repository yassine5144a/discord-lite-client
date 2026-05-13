import React, { useState, useEffect, useRef, useCallback } from 'react';
import api, { getAvatarUrl } from '../api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './DMChat.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function DMChat({ conversation }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const typingRef = useRef(false);

  const otherUser = conversation?.participants?.find(p => p._id !== user?._id);

  const loadMessages = useCallback(async (p = 1) => {
    if (!conversation) return;
    try {
      const { data } = await api.get(`/api/dm/${conversation._id}/messages?page=${p}&limit=30`);
      if (p === 1) { setMessages(data.messages); setHasMore(data.hasMore); setTimeout(() => bottomRef.current?.scrollIntoView(), 50); }
      else { setMessages(prev => [...data.messages, ...prev]); setHasMore(data.hasMore); }
    } catch (err) { console.error(err); }
  }, [conversation]);

  useEffect(() => { setMessages([]); setPage(1); setHasMore(false); loadMessages(1); }, [conversation?._id, loadMessages]);

  useEffect(() => {
    if (!socket || !conversation) return;
    const onNew = ({ conversationId, message }) => {
      if (conversationId !== conversation._id) return;
      setMessages(prev => [message, ...prev]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    const onTypingStart = ({ conversationId, userId }) => { if (conversationId === conversation._id && userId !== user?._id) setIsTyping(true); };
    const onTypingStop = ({ conversationId }) => { if (conversationId === conversation._id) setIsTyping(false); };
    socket.on('dm:new', onNew);
    socket.on('dm:typing:start', onTypingStart);
    socket.on('dm:typing:stop', onTypingStop);
    return () => { socket.off('dm:new', onNew); socket.off('dm:typing:start', onTypingStart); socket.off('dm:typing:stop', onTypingStop); };
  }, [socket, conversation, user]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!typingRef.current && otherUser) {
      typingRef.current = true;
      socket?.emit('dm:typing:start', { conversationId: conversation._id, targetUserId: otherUser._id });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingRef.current = false;
      socket?.emit('dm:typing:stop', { conversationId: conversation._id, targetUserId: otherUser?._id });
    }, 2000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !conversation) return;
    socket.emit('dm:send', { conversationId: conversation._id, content: input.trim() });
    setInput('');
    typingRef.current = false;
    clearTimeout(typingTimer.current);
    socket?.emit('dm:typing:stop', { conversationId: conversation._id, targetUserId: otherUser?._id });
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => {
    const d = new Date(date), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  if (!conversation) return (
    <div className="dm-chat empty">
      <div className="empty-state"><span>💬</span><p>Select a conversation</p></div>
    </div>
  );

  const displayMessages = [...messages].reverse();
  const grouped = [];
  let lastDate = null, lastAuthorId = null;
  displayMessages.forEach((msg, i) => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== lastDate) { grouped.push({ type: 'date', label: msgDate, key: `date-${i}` }); lastDate = msgDate; lastAuthorId = null; }
    const showHeader = msg.author?._id !== lastAuthorId;
    grouped.push({ type: 'message', msg, showHeader, key: msg._id });
    lastAuthorId = msg.author?._id;
  });

  return (
    <div className="dm-chat">
      <div className="dm-chat-header">
        <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
          {otherUser?.avatar ? <img src={getAvatarUrl(otherUser.avatar)} alt={otherUser?.username} /> : otherUser?.username?.slice(0, 2).toUpperCase()}
          <span className={`status-dot sm status-${otherUser?.status || 'offline'}`} />
        </div>
        <div>
          <span className="dm-chat-name">{otherUser?.username}</span>
          <span className="dm-chat-status">{otherUser?.status || 'offline'}</span>
        </div>
      </div>

      <div className="dm-messages">
        {hasMore && <button className="load-more-btn" onClick={async () => { const next = page + 1; await loadMessages(next); setPage(next); }}>Load older messages</button>}
        {grouped.map(item => {
          if (item.type === 'date') return <div key={item.key} className="date-divider"><span>{item.label}</span></div>;
          const { msg, showHeader } = item;
          return (
            <div key={item.key} className={`dm-message ${showHeader ? 'with-header' : 'compact'}`}>
              {showHeader ? (
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
                  {msg.author?.avatar ? <img src={getAvatarUrl(msg.author.avatar)} alt={msg.author?.username} /> : msg.author?.username?.slice(0, 2).toUpperCase()}
                </div>
              ) : <div style={{ width: 34, flexShrink: 0 }} />}
              <div className="dm-message-body">
                {showHeader && <div className="dm-message-header"><span className="dm-message-author">{msg.author?.username}</span><span className="dm-message-time">{formatTime(msg.createdAt)}</span></div>}
                {msg.content && <p className="dm-message-content">{msg.content}</p>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="typing-indicator">
        {isTyping && <span><span className="typing-dots"><span /><span /><span /></span>{otherUser?.username} is typing...</span>}
      </div>

      <form className="dm-input-form" onSubmit={sendMessage}>
        <input type="text" className="dm-input" placeholder={`Message ${otherUser?.username || ''}...`} value={input} onChange={handleInputChange} maxLength={2000} autoComplete="off" />
        <button type="submit" className="send-btn" disabled={!input.trim()} aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    </div>
  );
}
