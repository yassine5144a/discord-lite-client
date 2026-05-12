import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function UserProfile({ onClose }) {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('profile'); // 'profile' | 'password'
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/api/users/me', { username, bio });
      setUser(data);
      showMsg('Profile updated!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error', 'error');
    } finally { setLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) return showMsg('Passwords do not match', 'error');
    if (newPw.length < 6) return showMsg('Password must be at least 6 chars', 'error');
    setLoading(true);
    try {
      await api.post('/api/users/me/password', { currentPassword: currentPw, newPassword: newPw });
      showMsg('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error', 'error');
    } finally { setLoading(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setLoading(true);
    try {
      const { data } = await api.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(data);
      showMsg('Avatar updated!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error', 'error');
    } finally { setLoading(false); e.target.value = ''; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-header">
          <h2>User Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Avatar */}
        <div className="avatar-section">
          <label className="avatar-upload" title="Change avatar">
            <div className="profile-avatar">
              {user?.avatar
                ? <img src={`${SERVER_URL}${user.avatar}`} alt={user.username} />
                : user?.username?.slice(0, 2).toUpperCase()
              }
              <div className="avatar-overlay">📷</div>
            </div>
            <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
          </label>
          <div>
            <p className="profile-username">{user?.username}</p>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>Profile</button>
          <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}>Password</button>
        </div>

        {msg.text && <p className={`profile-msg ${msg.type}`}>{msg.text}</p>}

        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="profile-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                minLength={3} maxLength={32}
              />
            </div>
            <div className="form-group">
              <label>Bio <span className="char-count">{bio.length}/190</span></label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={190}
                rows={3}
                placeholder="Tell something about yourself..."
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={changePassword} className="profile-form">
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
