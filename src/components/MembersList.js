import React from 'react';
import './MembersList.css';

export default function MembersList({ server }) {
  if (!server) return null;

  const online = server.members?.filter(m => m.user.status !== 'offline') || [];
  const offline = server.members?.filter(m => m.user.status === 'offline') || [];

  const MemberItem = ({ member }) => (
    <div className="member-item">
      <div className="member-avatar">
        {member.user.avatar
          ? <img src={member.user.avatar} alt={member.user.username} />
          : member.user.username?.slice(0, 2).toUpperCase()
        }
        <span className={`status-dot status-${member.user.status || 'offline'}`} />
      </div>
      <div className="member-info">
        <span className="member-name">{member.user.username}</span>
        {member.role !== 'member' && (
          <span className="member-role">{member.role}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="members-list">
      {online.length > 0 && (
        <>
          <div className="members-category">ONLINE — {online.length}</div>
          {online.map(m => <MemberItem key={m.user._id} member={m} />)}
        </>
      )}
      {offline.length > 0 && (
        <>
          <div className="members-category">OFFLINE — {offline.length}</div>
          {offline.map(m => <MemberItem key={m.user._id} member={m} />)}
        </>
      )}
    </div>
  );
}
