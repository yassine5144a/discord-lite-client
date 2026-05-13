import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { useLang } from '../context/LangContext';
import EmojiPicker from './EmojiPicker';
import XOGame from './XOGame';
import './ChatArea.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function ChatArea({ server, channel }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t, lang } = useLang();

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { _id, content, author }
  const [mentionList, setMentionList] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showXO, setShowXO] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [dataSaver, setDataSaver] = useState(() => localStorage.getItem('dl_datasaver') === 'true');
  const [translating, setTranslating] = useState({});
  const [translations, setTranslationsMap] = useState({});
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const isTyping = useRef(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadMessages = useCallback(async (p = 1) => {
    if (!server || !channel) return;
    try {
      const { data } = await api.get(`/api/servers/${server._id}/channels/${channel._id}/messages?page=${p}&limit=30`);
      if (p === 1) { setMessages(data.messages); setHasMore(data.hasMore); setTimeout(() => bottomRef.current?.scrollIntoView(), 50); }
      else { setMessages(prev => [...data.messages, ...prev]); setHasMore(data.hasMore); }
    } catch (err) { console.error(err); }
  }, [server, channel]);

  useEffect(() => { setMessages([]); setPage(1); setHasMore(false); setReplyTo(null); setSummary(null); loadMessages(1); }, [channel?._id, loadMessages]);

  useEffect(() => {
    if (!socket || !server) return;
    socket.emit('server:join', server._id);

    const onNew = ({ channelId, message }) => {
      if (channelId !== channel?._id) return;
      setMessages(prev => [message, ...prev]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      if (message.author?._id !== user?._id) {
        addToast(`${message.author?.username}: ${message.content?.slice(0, 50) || '📎'}`, 'message', 4000);
      }
    };
    const onEdited = ({ channelId, messageId, content }) => {
      if (channelId !== channel?._id) return;
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, content, edited: true } : m));
    };
    const onDeleted = ({ channelId, messageId }) => {
      if (channelId !== channel?._id) return;
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true, content: '' } : m));
    };
    const onPinned = ({ channelId, messageId, pinned }) => {
      if (channelId !== channel?._id) return;
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, pinned } : m));
      addToast(pinned ? '📌 Message pinned' : '📌 Message unpinned', 'info', 2000);
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
      addToast(`🔔 ${from} mentioned you`, 'mention', 5000);
      try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(`${from} mentioned you`, { body: content, icon: '/icon-192.png' }); } catch (e) {}
    };

    socket.on('message:new', onNew);
    socket.on('message:edited', onEdited);
    socket.on('message:deleted', onDeleted);
    socket.on('message:pinned', onPinned);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('notification:mention', onMention);
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}

    return () => {
      socket.off('message:new', onNew); socket.off('message:edited', onEdited);
      socket.off('message:deleted', onDeleted); socket.off('message:pinned', onPinned);
      socket.off('typing:start', onTypingStart); socket.off('typing:stop', onTypingStop);
      socket.off('notification:mention', onMention);
    };
  }, [socket, server, channel, user]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    const atMatch = val.slice(0, e.target.selectionStart).match(/@(\w*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      const filtered = server?.members?.filter(m => m.user.username.toLowerCase().startsWith(query) && m.user._id !== user?._id) || [];
      setMentionList(filtered); setShowMentions(filtered.length > 0);
    } else { setShowMentions(false); }
    if (!isTyping.current) { isTyping.current = true; socket?.emit('typing:start', { serverId: server._id, channelId: channel._id }); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { isTyping.current = false; socket?.emit('typing:stop', { serverId: server._id, channelId: channel._id }); }, 2000);
  };

  const insertMention = (member) => {
    const cursorPos = inputRef.current?.selectionStart || input.length;
    const before = input.slice(0, cursorPos).replace(/@\w*$/, `@${member.user.username} `);
    setInput(before + input.slice(cursorPos));
    setShowMentions(false); inputRef.current?.focus();
  };

  const getMentionIds = (text) => {
    const matches = text.match(/@(\w+)/g) || [];
    return matches.map(m => { const member = server?.members?.find(mb => mb.user.username === m.slice(1)); return member?.user._id; }).filter(Boolean);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || !server || !channel) return;
    const mentionIds = getMentionIds(input);
    socket.emit('message:send', {
      serverId: server._id, channelId: channel._id, content: input.trim(), mentions: mentionIds,
      replyTo: replyTo ? { messageId: replyTo._id, content: replyTo.content?.slice(0, 100), author: replyTo.author?.username } : null
    });
    setInput(''); setReplyTo(null);
    isTyping.current = false; clearTimeout(typingTimer.current);
    socket.emit('typing:stop', { serverId: server._id, channelId: channel._id });
    setShowMentions(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !server || !channel) return;
    if (dataSaver) { addToast('Data saver mode is ON - file upload disabled', 'info'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/api/servers/${server._id}/channels/${channel._id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      socket.emit('message:send', { serverId: server._id, channelId: channel._id, content: '', attachment: data.url, attachmentType: data.type, attachmentName: data.name, mentions: [] });
    } catch (err) { addToast('Upload failed: ' + (err.response?.data?.message || err.message), 'error'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const translateMessage = async (msgId, content) => {
    if (translating[msgId]) return;

    // Detect if already translated - toggle off
    if (translations[msgId]) {
      setTranslationsMap(prev => { const n = { ...prev }; delete n[msgId]; return n; });
      return;
    }

    setTranslating(prev => ({ ...prev, [msgId]: true }));
    try {
      // Auto-detect: if content is Arabic translate to English, otherwise translate to Arabic
      const hasArabic = /[\u0600-\u06FF]/.test(content);
      const targetLang = hasArabic ? 'en' : (lang === 'en' ? 'ar' : lang);

      const { data } = await api.post('/api/ai/translate', { text: content, targetLang });

      if (!data.translation || data.translation === content) {
        setTranslationsMap(prev => ({ ...prev, [msgId]: '(Same language)' }));
      } else {
        setTranslationsMap(prev => ({ ...prev, [msgId]: data.translation }));
      }
    } catch (err) {
      addToast('Translation failed', 'error');
    } finally {
      setTranslating(prev => ({ ...prev, [msgId]: false }));
    }
  };

  const summarizeChat = async () => {
    setSummarizing(true);
    try {
      const msgs = [...messages].reverse().filter(m => !m.deleted && m.content).map(m => ({ author: m.author?.username, content: m.content }));
      const { data } = await api.post('/api/ai/summarize', { messages: msgs, lang });
      setSummary(data.summary);
    } catch (err) { addToast('Summarize failed', 'error'); }
    finally { setSummarizing(false); }
  };

  const loadPinned = async () => {
    try {
      const { data } = await api.get(`/api/servers/${server._id}/channels/${channel._id}/pinned`);
      setPinnedMessages(data);
      setShowPinned(true);
    } catch (err) { addToast('Failed to load pinned', 'error'); }
  };

  const pinMessage = (msgId) => {
    socket?.emit('message:pin', { serverId: server._id, channelId: channel._id, messageId: msgId });
  };

  const toggleDataSaver = () => {
    const newVal = !dataSaver;
    setDataSaver(newVal);
    localStorage.setItem('dl_datasaver', newVal.toString());
    addToast(newVal ? '⚡ Data saver ON - images hidden' : '⚡ Data saver OFF', 'info');
  };

  const startEdit = (msg) => { setEditingId(msg._id); setEditContent(msg.content); };
  const submitEdit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    socket?.emit('message:edit', { serverId: server._id, channelId: channel._id, messageId: editingId, content: editContent.trim() });
    setEditingId(null);
  };
  const deleteMessage = (msgId) => {
    if (!window.confirm(t('messageDeleted') + '?')) return;
    socket?.emit('message:delete', { serverId: server._id, channelId: channel._id, messageId: msgId });
  };
  const loadMore = async () => { setLoadingMore(true); const next = page + 1; await loadMessages(next); setPage(next); setLoadingMore(false); };

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => {
    const d = new Date(date), today = new Date(), yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t('today');
    if (d.toDateString() === yesterday.toDateString()) return t('yesterday');
    return d.toLocaleDateString();
  };

  const renderContent = (content, mentions) => {
    if (!content) return null;
    return content.split(/(@\w+)/g).map((part, i) => {
      if (part.startsWith('@')) {
        const isMentioned = mentions?.some(m => (m.username || m) === part.slice(1));
        return <span key={i} className={`mention ${isMentioned ? 'mention-me' : ''}`}>{part}</span>;
      }
      return part;
    });
  };

  const isAdmin = server?.members?.find(m => m.user._id === user?._id && ['owner', 'admin', 'moderator'].includes(m.role));

  if (!channel) return (
    <div className="chat-area empty">
      <div className="empty-state"><span>⚡</span><p>{t('selectChannel')}</p></div>
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
    <div className="chat-area">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-channel-name"># {channel.name}</span>
        <div className="chat-header-actions">
          <button className="chat-action-btn" onClick={loadPinned} title="Pinned messages" aria-label="Pinned">📌</button>
          <button className={`chat-action-btn ${dataSaver ? 'active' : ''}`} onClick={toggleDataSaver} title="Data saver" aria-label="Data saver">⚡</button>
          <button className="chat-action-btn" onClick={summarizeChat} disabled={summarizing} title="Summarize with AI" aria-label="Summarize">
            {summarizing ? '⏳' : '🤖'}
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="summary-panel">
          <div className="summary-header">
            <span>🤖 AI Summary</span>
            <button onClick={() => setSummary(null)}>✕</button>
          </div>
          <p>{summary}</p>
        </div>
      )}

      {/* Pinned messages panel */}
      {showPinned && (
        <div className="pinned-panel">
          <div className="pinned-header">
            <span>📌 Pinned Messages ({pinnedMessages.length})</span>
            <button onClick={() => setShowPinned(false)}>✕</button>
          </div>
          {pinnedMessages.length === 0 ? <p className="pinned-empty">No pinned messages</p> : (
            pinnedMessages.map(msg => (
              <div key={msg._id} className="pinned-item">
                <span className="pinned-author">{msg.author?.username}</span>
                <span className="pinned-content">{msg.content?.slice(0, 100)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {hasMore && <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>{loadingMore ? t('loading') : t('loadOlder')}</button>}

        {grouped.map(item => {
          if (item.type === 'date') return <div key={item.key} className="date-divider"><span>{item.label}</span></div>;

          const { msg, showHeader } = item;
          const isOwn = msg.author?._id === user?._id;

          if (msg.deleted) return (
            <div key={item.key} className={`message ${showHeader ? 'with-header' : 'compact'}`}>
              {showHeader && <div className="message-avatar deleted-avatar" />}
              {!showHeader && <div className="message-time-stub" />}
              <div className="message-body">
                {showHeader && <div className="message-header"><span className="message-author">{msg.author?.username}</span><span className="message-time">{formatTime(msg.createdAt)}</span></div>}
                <p className="message-content deleted-msg">{t('messageDeleted')}</p>
              </div>
            </div>
          );

          return (
            <div key={item.key} className={`message ${showHeader ? 'with-header' : 'compact'} ${msg.pinned ? 'pinned' : ''} ${isOwn ? 'own-message' : ''}`}>
              {showHeader && (
                <div className="message-avatar">
                  {msg.author?.avatar ? <img src={`${SERVER_URL}${msg.author.avatar}`} alt={msg.author?.username} /> : msg.author?.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
              {!showHeader && <div className="message-time-stub">{formatTime(msg.createdAt)}</div>}

              <div className="message-body">
                {/* Reply preview */}
                {msg.replyTo?.author && (
                  <div className="reply-preview">
                    <span className="reply-author">↩ {msg.replyTo.author}</span>
                    <span className="reply-content">{msg.replyTo.content}</span>
                  </div>
                )}

                {showHeader && (
                  <div className="message-header">
                    <span className="message-author">{msg.author?.username}</span>
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                    {msg.edited && <span className="edited-tag">({t('edited')})</span>}
                    {msg.pinned && <span className="pin-tag">📌</span>}
                  </div>
                )}

                {editingId === msg._id ? (
                  <form onSubmit={submitEdit} className="edit-form">
                    <input value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus maxLength={2000} />
                    <div className="edit-actions">
                      <button type="submit" className="edit-save">Save</button>
                      <button type="button" className="edit-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    {msg.content && <p className="message-content">{renderContent(msg.content, msg.mentions)}</p>}
                    {/* Translation */}
                    {translations[msg._id] && <p className="message-translation">🌐 {translations[msg._id]}</p>}
                    {msg.attachment && !dataSaver && (
                      <div className="attachment">
                        {msg.attachmentType === 'image'
                          ? <img src={`${SERVER_URL}${msg.attachment}`} alt={msg.attachmentName || 'attachment'} className="attachment-image" loading="lazy" onClick={() => window.open(`${SERVER_URL}${msg.attachment}`, '_blank')} />
                          : <a href={`${SERVER_URL}${msg.attachment}`} target="_blank" rel="noreferrer" className="attachment-file">📎 {msg.attachmentName || 'File'}</a>
                        }
                      </div>
                    )}
                    {msg.attachment && dataSaver && <p className="data-saver-hidden">📎 Attachment hidden (data saver)</p>}
                  </>
                )}
              </div>

              {/* Message actions */}
              {!msg.deleted && editingId !== msg._id && (
                <div className="message-actions">
                  <button className="msg-action-btn" onClick={() => setReplyTo(msg)} title="Reply">↩</button>
                  {msg.content && <button className="msg-action-btn" onClick={() => translateMessage(msg._id, msg.content)} title="Translate" disabled={translating[msg._id]}>{translating[msg._id] ? '⏳' : '🌐'}</button>}
                  {isAdmin && <button className="msg-action-btn" onClick={() => pinMessage(msg._id)} title={msg.pinned ? 'Unpin' : 'Pin'}>📌</button>}
                  {isOwn && <button className="msg-action-btn" onClick={() => startEdit(msg)} title="Edit">✏️</button>}
                  {(isOwn || isAdmin) && <button className="msg-action-btn danger" onClick={() => deleteMessage(msg._id)} title="Delete">🗑</button>}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing */}
      <div className="typing-indicator">
        {typingUsers.length > 0 && <span><span className="typing-dots"><span /><span /><span /></span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>}
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="reply-bar">
          <span>↩ Replying to <strong>{replyTo.author?.username}</strong>: {replyTo.content?.slice(0, 60)}</span>
          <button onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* @mention dropdown */}
      {showMentions && (
        <div className="mention-dropdown">
          {mentionList.map(m => (
            <button key={m.user._id} className="mention-item" onClick={() => insertMention(m)}>
              <div className="mention-avatar">{m.user.avatar ? <img src={`${SERVER_URL}${m.user.avatar}`} alt={m.user.username} /> : m.user.username.slice(0, 2).toUpperCase()}</div>
              @{m.user.username}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form className="chat-input-form" onSubmit={sendMessage}>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*,.pdf,.txt,.zip,.mp3,.mp4" />
        <button type="button" className="attach-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Attach" aria-label="Attach">{uploading ? '⏳' : '📎'}</button>
        <button type="button" className="attach-btn" onClick={() => setShowXO(true)} title={t('playXO')} aria-label={t('playXO')}>🎮</button>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={`${t('typeMessage')} #${channel.name}`}
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => { if (e.key === 'Escape') { setShowMentions(false); setEditingId(null); setReplyTo(null); } }}
          maxLength={2000}
          autoComplete="off"
        />
        <button type="submit" className="send-btn" disabled={!input.trim() && !uploading} aria-label="Send">➤</button>
      </form>

      {showXO && server && channel && <XOGame serverId={server._id} channelId={channel._id} onClose={() => setShowXO(false)} />}
    </div>
  );
}
