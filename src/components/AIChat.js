import React, { useState, useRef, useEffect } from 'react';
import api from '../api';
import './AIChat.css';

const STORAGE_KEY = 'dl_ai_history';
const MAX_HISTORY = 50;

export default function AIChat({ onClose }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك؟\nHello! I\'m your AI assistant. How can I help you?' }
      ];
    } catch {
      return [{ role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي.\nHello! I\'m your AI assistant.' }];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef(null);

  // Save to localStorage on every message
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
    } catch {}
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/api/ai/chat', {
        message: input.trim(),
        context
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.message === 'AI not configured'
          ? '⚠️ AI not configured. Add GROQ_API_KEY to Railway.'
          : '❌ ' + (err.response?.data?.message || err.message)
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    const initial = [{ role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي.\nHello! I\'m your AI assistant.' }];
    setMessages(initial);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-chat" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-header">
          <div className="ai-title">
            <span className="ai-icon">🤖</span>
            <span>AI Assistant</span>
            <span className="ai-badge">Groq</span>
          </div>
          <div className="ai-header-actions">
            <button
              className="ai-action-btn"
              onClick={() => setShowHistory(!showHistory)}
              title="History"
              aria-label="Toggle history"
            >
              🕐
            </button>
            <button
              className="ai-action-btn"
              onClick={clearHistory}
              title="Clear history"
              aria-label="Clear history"
            >
              🗑
            </button>
            <button onClick={onClose} className="ai-close">✕</button>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="ai-history-panel">
            <div className="ai-history-header">
              <span>📋 Conversation History ({messages.length} messages)</span>
              <button onClick={() => setShowHistory(false)}>✕</button>
            </div>
            <div className="ai-history-list">
              {messages.map((msg, i) => (
                <div key={i} className={`ai-history-item ${msg.role}`}>
                  <span className="ai-history-role">{msg.role === 'user' ? '👤' : '🤖'}</span>
                  <span className="ai-history-text">{msg.content.slice(0, 80)}{msg.content.length > 80 ? '...' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`}>
              {msg.role === 'assistant' && <span className="ai-avatar">🤖</span>}
              <div className="ai-bubble">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
              <span className="ai-avatar">🤖</span>
              <div className="ai-bubble ai-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form className="ai-input-form" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Ask anything... / اسأل أي شيء..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" disabled={!input.trim() || loading} className="ai-send">
            {loading ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}
