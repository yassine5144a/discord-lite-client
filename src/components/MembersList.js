import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './MembersList.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || '';

export default function MembersList({ server, onServerUpdated }) {
  const { user } = useAuth();
  const [contextMenu, setContextMenu] = useState(null);

  if (!server) return null;

  const myRole = server.members?.find(m => (m.user._id || m.user) === user?._id)?.role;
  const isAdmin = ['owner', 'admin'].includes(myRole);

  const online = server.members?.filter(m => m.user.status !== 'offline') || [];
  const offline = server.members?.filter(m => m.user.status === 'offline') || [];

  const changeRole = async (memberId, role) => {
    try {
      const { data } = await api.patch(`/api/servers/${server._id}/members/${memberId}/role`, { role });
      onServerUpdated?.(data);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    setContextMenu(null);
  };

  const kickMember = async (memberId) => {
    if (!window.confirm('Kick this member?')) return;
    try {
      const { data } = await api.delete(`/api/servers/${server._id}/members/${memberId}`);
      onServerUpdated?.(data);
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    setContextMenu(null);
  };

  const MemberItem = ({ member }) => {
    const memberId = member.user._id;
    const isMe = memberId === user?._id;
    const canManage = isAdmin && !isMe && member.role !== 'owner';

    return (
      <div className="member-item" onContextMenu={canManage ? (e) => { e.preventDefault(); setContextMenu({ memberId, x: e.clientX, y: e.clientY }); } : undefined}>
        <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
          {member.user.avatar
            ? <img src={`${SERVER_URL}${member.user.avatar}`} alt={member.user.username} />
            : member.user.username?.slice(0, 2).toUpperCase()
          }
          <span className={`status-dot sm status-${member.user.status || 'offline'}`} />
        </div>
        <div className="member-info">
          <span className="member-name">{member.user.username}{isMe ? ' (you)' : ''}</span>
          <span className={`role-badge ${member.role}`}>{member.role}</span>
        </div>
        {canManage && (
          <button className="member-menu-btn" onClick={(e) => { e.stopPropagation(); setContextMenu({ memberId, x: e.clientX, y: e.clientY }); }} aria-label="Member options">⋯</button>
        )}
      </div>
    );
  };

  return (
    <div className="members-list" onClick={() => setContextMenu(null)}>
      <div className="members-header">Members</div>
      {online.length > 0 && (<><div className="members-category">Online — {online.length}</div>{online.map(m => <MemberItem key={m.user._id} member={m} />)}</>)}
      {offline.length > 0 && (<><div className="members-category">Offline — {offline.length}</div>{offline.map(m => <MemberItem key={m.user._id} member={m} />)}</>)}

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 180) }} onClick={e => e.stopPropagation()}>
          {myRole === 'owner' && (
            <>
              <div className="context-menu-label">Change Role</div>
              <button onClick={() => changeRole(contextMenu.memberId, 'admin')}>Make Admin</button>
              <button onClick={() => changeRole(contextMenu.memberId, 'moderator')}>Make Moderator</button>
              <button onClick={() => changeRole(contextMenu.memberId, 'member')}>Make Member</button>
              <div className="context-menu-divider" />
            </>
          )}
          <button className="danger" onClick={() => kickMember(contextMenu.memberId)}>Kick Member</button>
        </div>
      )}
    </div>
  );
}
