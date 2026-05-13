import React from 'react';
import './Skeleton.css';

export function MessageSkeleton() {
  return (
    <div className="skeleton-message">
      <div className="skeleton-avatar skeleton-pulse" />
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-pulse" style={{ width: '120px', height: '12px' }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '80%', height: '14px', marginTop: 6 }} />
        <div className="skeleton-line skeleton-pulse" style={{ width: '60%', height: '14px', marginTop: 4 }} />
      </div>
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div className="skeleton-channel">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="skeleton-channel-item skeleton-pulse" style={{ width: `${60 + i * 8}%` }} />
      ))}
    </div>
  );
}

export function MemberSkeleton() {
  return (
    <div className="skeleton-members">
      {[1,2,3].map(i => (
        <div key={i} className="skeleton-member">
          <div className="skeleton-avatar skeleton-pulse" style={{ width: 32, height: 32 }} />
          <div className="skeleton-line skeleton-pulse" style={{ width: `${50 + i * 15}%`, height: 12 }} />
        </div>
      ))}
    </div>
  );
}
