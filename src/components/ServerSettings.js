import React, { useState } from 'react';
import api from '../api';
import './ServerSettings.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function ServerSettings({ server, onClose, onUpdated }) {
  const [name, setName] = useState(server?.name || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.patch(`/api/servers/${server._id}`, { name });
      onUpdated(data);
      showMsg('Server name updated!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error', 'error');
    } finally { setLoading(false); }
  };

  const uploadIcon = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('icon', file);
    setLoading(true);
    try {
      const { data } = await api.post(`/api/servers/${server._id}/icon`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdated(data);
      showMsg('Server icon updated!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error', 'error');
    } finally { setLoading(false); e.target.value = ''; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="server-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Server Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Server icon */}
        <div className="avatar-section">
          <label className="avatar-upload" title="Change server icon">
            <div className="profile-avatar">
              {server?.icon
                ? <img src={`${SERVER_URL}${server.icon}`} alt={server.name} />
                : server?.name?.slice(0, 2).toUpperCase()
              }
              <div className="avatar-overlay">📷</div>
            </div>
            <input type="file" accept="image/*" onChange={uploadIcon} style={{ display: 'none' }} />
          </label>
          <div>
            <p className="profile-username">{server?.name}</p>
            <p className="profile-email">Invite: {server?.inviteCode}</p>
          </div>
        </div>

        {msg.text && <p className={`profile-msg ${msg.type}`} style={{ margin: '0 24px 8px' }}>{msg.text}</p>}

        <form onSubmit={saveName} className="profile-form">
          <div className="form-group">
            <label>Server Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
