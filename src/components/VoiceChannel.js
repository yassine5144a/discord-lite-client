import React, { useState, useEffect, useCallback } from 'react';
import { LiveKitRoom, useParticipants, useLocalParticipant, RoomAudioRenderer } from '@livekit/components-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import './VoiceChannel.css';

// Inner component - inside LiveKitRoom
function VoiceRoomInner({ onLeave, muted, deafened, speaking, setSpeaking }) {
  const { user } = useAuth();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  // Mute/unmute local mic
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!muted);
    }
  }, [muted, localParticipant]);

  // Track speaking via audio levels
  useEffect(() => {
    if (!localParticipant) return;
    const interval = setInterval(() => {
      const level = localParticipant.audioLevel || 0;
      setSpeaking(prev => ({ ...prev, self: level > 0.05 && !muted }));
    }, 200);
    return () => clearInterval(interval);
  }, [localParticipant, muted, setSpeaking]);

  return (
    <>
      {/* Render all remote audio */}
      <RoomAudioRenderer muted={deafened} />

      <div className="voice-participants">
        {/* Self */}
        <div className={`participant ${muted ? 'muted' : ''} ${speaking.self ? 'speaking' : ''}`}>
          <div className="participant-avatar">
            {localParticipant?.name?.slice(0, 2).toUpperCase() || '??'}
            {muted && <span className="muted-icon">🔇</span>}
          </div>
          <span>{localParticipant?.name || 'You'} (you)</span>
        </div>

        {/* Remote participants */}
        {participants.filter(p => !p.isLocal).map(participant => (
          <div
            key={participant.identity}
            className={`participant ${speaking[participant.identity] ? 'speaking' : ''}`}
          >
            <div className="participant-avatar">
              {participant.name?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <span>{participant.name || participant.identity}</span>
          </div>
        ))}

        {participants.filter(p => !p.isLocal).length === 0 && (
          <p className="waiting-text">{t('waitingForOthers')}</p>
        )}
      </div>
    </>
  );
}

export default function VoiceChannel({ server, channel }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [token, setToken] = useState(null);
  const [livekitUrl, setLivekitUrl] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [speaking, setSpeaking] = useState({});
  const [error, setError] = useState(null);

  const joinVoice = async () => {
    try {
      setError(null);
      const roomName = `${server._id}-${channel._id}`;
      const { data } = await api.post('/api/livekit/token', {
        roomName,
        participantName: user.username
      });
      setToken(data.token);
      setLivekitUrl(data.url);
      setInCall(true);
    } catch (err) {
      setError('Failed to join voice: ' + (err.response?.data?.message || err.message));
    }
  };

  const leaveVoice = useCallback(() => {
    setInCall(false);
    setToken(null);
    setMuted(false);
    setDeafened(false);
    setSpeaking({});
  }, []);

  if (!channel) return null;

  return (
    <div className="voice-channel">
      <div className="voice-header">
        <span>🔊 {channel.name}</span>
        <span className="voice-badge">Voice</span>
      </div>

      {!inCall ? (
        <div className="voice-join">
          <p>Join voice channel to talk</p>
          <p className="voice-hint">Powered by LiveKit — stable & low latency</p>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button className="btn-join-voice" onClick={joinVoice}>{t('joinVoice')}</button>
        </div>
      ) : (
        <div className="voice-active">
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={leaveVoice}
            options={{
              audioCaptureDefaults: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 12000,
                channelCount: 1
              }
            }}
          >
            <VoiceRoomInner
              onLeave={leaveVoice}
              muted={muted}
              deafened={deafened}
              speaking={speaking}
              setSpeaking={setSpeaking}
            />
          </LiveKitRoom>

          <div className="voice-controls">
            <button
              className={`voice-btn ${muted ? 'active-danger' : ''}`}
              onClick={() => setMuted(!muted)}
              title={muted ? 'Unmute' : 'Mute'}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🎤'}
            </button>
            <button
              className={`voice-btn ${deafened ? 'active-danger' : ''}`}
              onClick={() => setDeafened(!deafened)}
              title={deafened ? 'Undeafen' : 'Deafen'}
              aria-label={deafened ? 'Undeafen' : 'Deafen'}
            >
              {deafened ? '🔕' : '🔊'}
            </button>
            <button
              className="voice-btn leave-btn"
              onClick={leaveVoice}
              title="Leave voice"
              aria-label="Leave voice channel"
            >
              📵
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
