import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './ChatArea.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function ChatArea({ server, channel }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionList, setMentionList] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const isTyping = useRef(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadMessages = useCallback(async (p = 1) => {
    if (!server || !channel) return;
    try {
      const { data } = await api.get(
        `/api/servers/${server._id}/channels/${channel._id}/messages?page=${p}&limit=30`
      );
      if (p === 1) {
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      } else {
        setMessages(prev => [...data.messages, ...prev]);
        setHasMore(data.hasMore);
      }
    } catch (err) { console.error(err); }
  }, [server, channel]);

  useEffect(() => {
    setMessages([]); setPage(1); setHasMore(false);
    loadMessages(1);
  }, [channel?._id, loadMessages]);

  // Socket events
  useEffect(() => {
    if (!socket || !server) return;
    socket.emit('server:join', server._id);

    const onNew = ({ channelId, message }) => {
      if (channelId !== channel?._id) return;
      setMessages(prev => [message, ...prev]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const onEdited = ({ channelId, messageId, content }) => {
      if (channelId !== channel?._id) return;
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, content, edited: true } : m
      ));
    };

    const onDeleted = ({ channelId, messageId }) => {
      if (channelId !== channel?._id) return;
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, deleted: true, content: '' } : m
      ));
    };

    const onTypingStart = ({ userId: uid, channelId }) => {
      if (channelId !== channel?._id || uid === user?._id) return;
      const member = server.members?.find(m => m.user._id === uid);
      if (!member) return;
      setTypingUsers(prev => prev.includes(member.user.username) ? prev : [...prev, member.user.username]);
    };

    const onTypingStop = ({ userId: uid, channelId }) => {
      if (channelId !== channel?._id) return;
      const member = server.members?.find(m => m.user._id === uid);
      if (!member) return;
      setTypingUsers(prev => prev.filter(u => u !== member.user.username));
    };

    const onMention = ({ from, content }) => {
      // Browser notification for mentions - only if supported
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`${from} mentioned you`, { body: content, icon: '/icon-192.png' });
        }
      } catch (e) { /* Notification not supported in WebView */ }
    };

    socket.on('message:new', onNew);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('notification:mention', onMention);

    // Request notification permission - only if supported
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (e) { /* Not supported */ }

    return () => {
      socket.off('message:new', onNew);
      socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('notification:mention', onMention);
    };
  }, [socket, server, channel, user]);

  // Handle @mention autocomplete
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    // Detect @mention
    const atMatch = val.slice(0, e.target.selectionStart).match(/@(\w*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      setMentionQuery(query);
      const filtered = server?.members?.filter(m =>
        m.user.username.toLowerCase().startsWith(query) && m.user._id !== user?._id
      ) || [];
      setMentionList(filtered);
      setShowMentions(filtered.length > 0);
    } else {
      setShowMentions(false);
    }

    // Typing indicator
    if (!isTyping.current) {
      isTyping.current = true;
      socket?.emit('typing:start', { serverId: server._id, channelId: channel._id });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      socket?.emit('typing:stop', { serverId: server._id, channelId: channel._id });
    }, 2000);
  };

  const insertMention = (member) => {
    const cursorPos = inputRef.current?.selectionStart || input.length;
    const before = input.slice(0, cursorPos).replace(/@\w*$/, `@${member.user.username} `);
    const after = input.slice(cursorPos);
    setInput(before + after);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const getMentionIds = (text) => {
    const matches = text.match(/@(\w+)/g) || [];
    return matches.map(m => {
      const username = m.slice(1);
      const member = server?.members?.find(mb => mb.user.username === username);
      return member?.user._id;
    }).filter(Boolean);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !server || !channel) return;
    const mentionIds = getMentionIds(input);
    socket.emit('message:send', {
      serverId: server._id,
      channelId: channel._id,
      content: input.trim(),
      mentions: mentionIds
    });
    setInput('');
    isTyping.current = false;
    clearTimeout(typingTimer.current);
    socket.emit('typing:stop', { serverId: server._id, channelId: channel._id });
    setShowMentions(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !server || !channel) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(
        `/api/servers/${server._id}/channels/${channel._id}/upload`,
        formData, { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      socket.emit('message:send', {
        serverId: server._id,
        channelId: channel._id,
        content: '',
        attachment: data.url,
        attachmentType: data.type,
        attachmentName: data.name,
        mentions: []
      });
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg._id);
    setEditContent(msg.content);
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    socket?.emit('message:edit', {
      serverId: server._id,
      channelId: channel._id,
      messageId: editingId,
      content: editContent.trim()
    });
    setEditingId(null);
  };

  const deleteMessage = (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    socket?.emit('message:delete', {
      serverId: server._id,
      channelId: channel._id,
      messageId: msgId
    });
  };

  const loadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    await loadMessages(next);
    setPage(next);
    setLoadingMore(false);
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => {
    const d = new Date(date), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Render message content with @mention highlighting
  const renderContent = (content, mentions) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const isMentioned = mentions?.some(m => (m.username || m) === username);
        return <span key={i} className={`mention ${isMentioned ? 'mention-me' : ''}`}>{part}</span>;
      }
      return part;
    });
  };

  if (!channel) {
    return (
      <div className="chat-area empty">
        <div className="empty-state"><span>⚡</span><p>Select a channel to start chatting</p></div>
      </div>
    );
  }

  const displayMessages = [...messages].reverse();
  const grouped = [];
  let lastDate = null, lastAuthorId = null;
  displayMessages.forEach((msg, i) => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== lastDate) {
      grouped.push({ type: 'date', label: msgDate, key: `date-${i}` });
      lastDate = msgDate; lastAuthorId = null;
    }
    const showHeader = msg.author?._id !== lastAuthorId;
    grouped.push({ type: 'message', msg, showHeader, key: msg._id });
    lastAuthorId = msg.author?._id;
  });

  return (
    <div className="chat-area">
      <div className="chat-header">
        <span className="chat-channel-name"># {channel.name}</span>
      </div>

      <div className="messages-container">
        {hasMore && (
          <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load older messages'}
          </button>
        )}

        {grouped.map(item => {
          if (item.type === 'date') return (
            <div key={item.key} className="date-divider"><span>{item.label}</span></div>
          );

          const { msg, showHeader } = item;
          const isOwn = msg.author?._id === user?._id;

          if (msg.deleted) return (
            <div key={item.key} className={`message ${showHeader ? 'with-header' : 'compact'}`}>
              {showHeader && <div className="message-avatar deleted-avatar" />}
              {!showHeader && <div className="message-time-stub" />}
              <div className="message-body">
                {showHeader && (
                  <div className="message-header">
                    <span className="message-author">{msg.author?.username}</span>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                  </div>
                )}
                <p className="message-content deleted-msg">🗑 Message deleted</p>
              </div>
            </div>
          );

          return (
            <div key={item.key} className={`message ${showHeader ? 'with-header' : 'compact'}`}>
              {showHeader && (
                <div className="message-avatar">
                  {msg.author?.avatar
                    ? <img src={`${SERVER_URL}${msg.author.avatar}`} alt={msg.author?.username} />
                    : msg.author?.username?.slice(0, 2).toUpperCase()
                  }
                </div>
              )}
              {!showHeader && <div className="message-time-stub">{formatTime(msg.createdAt)}</div>}

              <div className="message-body">
                {showHeader && (
                  <div className="message-header">
                    <span className="message-author">{msg.author?.username}</span>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                    {msg.edited && <span className="edited-tag">(edited)</span>}
                  </div>
                )}

                {editingId === msg._id ? (
                  <form onSubmit={submitEdit} className="edit-form">
                    <input
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      autoFocus
                      maxLength={2000}
                    />
                    <div className="edit-actions">
                      <button type="submit" className="edit-save">Save</button>
                      <button type="button" className="edit-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    {msg.content && (
                      <p className="message-content">
                        {renderContent(msg.content, msg.mentions)}
                      </p>
                    )}
                    {msg.attachment && (
                      <div className="attachment">
                        {msg.attachmentType === 'image' ? (
                          <img
                            src={`${SERVER_URL}${msg.attachment}`}
                            alt={msg.attachmentName || 'attachment'}
                            className="attachment-image"
                            loading="lazy"
                            onClick={() => window.open(`${SERVER_URL}${msg.attachment}`, '_blank')}
                          />
                        ) : (
                          <a
                            href={`${SERVER_URL}${msg.attachment}`}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-file"
                          >
                            📎 {msg.attachmentName || 'File'}
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Message actions (hover) */}
              {!msg.deleted && editingId !== msg._id && (
                <div className="message-actions">
                  {isOwn && (
                    <button className="msg-action-btn" onClick={() => startEdit(msg)} title="Edit">✏️</button>
                  )}
                  {(isOwn || server?.members?.find(m => m.user._id === user?._id && ['owner','admin'].includes(m.role))) && (
                    <button className="msg-action-btn danger" onClick={() => deleteMessage(msg._id)} title="Delete">🗑</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      <div className="typing-indicator">
        {typingUsers.length > 0 && (
          <span>
            <span className="typing-dots"><span /><span /><span /></span>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        )}
      </div>

      {/* @mention autocomplete */}
      {showMentions && (
        <div className="mention-dropdown">
          {mentionList.map(m => (
            <button key={m.user._id} className="mention-item" onClick={() => insertMention(m)}>
              <div className="mention-avatar">
                {m.user.avatar
                  ? <img src={`${SERVER_URL}${m.user.avatar}`} alt={m.user.username} />
                  : m.user.username.slice(0, 2).toUpperCase()
                }
              </div>
              @{m.user.username}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.txt,.zip,.mp3,.mp4"
        />
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach file"
          aria-label="Attach file"
        >
          {uploading ? '⏳' : '📎'}
        </button>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={`Message #${channel.name} — use @ to mention`}
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => {
            if (e.key === 'Escape') { setShowMentions(false); setEditingId(null); }
            if (e.key === 'ArrowUp' && !input && messages.length > 0) {
              const myMsg = messages.find(m => m.author?._id === user?._id && !m.deleted);
              if (myMsg) startEdit(myMsg);
            }
          }}
          maxLength={2000}
          autoComplete="off"
        />
        <button type="submit" className="send-btn" disabled={!input.trim() && !uploading} aria-label="Send">
          ➤
        </button>
      </form>
    </div>
  );
}
