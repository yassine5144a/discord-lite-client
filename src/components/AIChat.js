import React, { useState, useRef, useEffect } from 'react';
import api from '../api';
import './AIChat.css';

export default function AIChat({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك؟\nHello! I\'m your AI assistant. How can I help you?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
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
          ? '⚠️ AI not configured yet. Add GROQ_API_KEY to Railway variables.'
          : '❌ Error: ' + (err.response?.data?.message || err.message)
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-chat" onClick={e => e.stopPropagation()}>
        <div className="ai-header">
          <div className="ai-title">
            <span className="ai-icon">🤖</span>
            <span>AI Assistant</span>
            <span className="ai-badge">Groq</span>
          </div>
          <button onClick={onClose} className="ai-close">✕</button>
        </div>

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
