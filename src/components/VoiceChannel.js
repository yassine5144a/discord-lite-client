import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  ConnectionState,
} from 'livekit-client';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import './VoiceChannel.css';

export default function VoiceChannel({ server, channel }) {
  const { user } = useAuth();
  const { t } = useLang();

  const roomRef = useRef(null);
  const audioTracksRef = useRef({}); // remoteIdentity -> <audio> element

  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [speaking, setSpeaking] = useState({});
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState(null);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  // ─── Attach remote audio track to a real <audio> element ─────────────────
  const attachRemoteTrack = useCallback((track, participantIdentity) => {
    // Remove old element if exists
    if (audioTracksRef.current[participantIdentity]) {
      audioTracksRef.current[participantIdentity].remove();
    }
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.playsInline = true;
    // Force play on Android WebView
    audioEl.setAttribute('playsinline', '');
    audioEl.setAttribute('webkit-playsinline', '');
    document.body.appendChild(audioEl);
    track.attach(audioEl);
    // Force play (needed on some Android WebViews)
    audioEl.play().catch(() => {});
    audioTracksRef.current[participantIdentity] = audioEl;
  }, []);

  const detachRemoteTrack = useCallback((participantIdentity) => {
    if (audioTracksRef.current[participantIdentity]) {
      audioTracksRef.current[participantIdentity].remove();
      delete audioTracksRef.current[participantIdentity];
    }
  }, []);

  // ─── Join voice ───────────────────────────────────────────────────────────
  const joinVoice = async () => {
    try {
      setError(null);

      // Step 1: Request mic permission explicitly BEFORE connecting
      // This is critical for Android WebView
      let micStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        // Stop the test stream — LiveKit will create its own
        micStream.getTracks().forEach(t => t.stop());
      } catch (permErr) {
        setError('Microphone permission denied. Please allow microphone access.');
        return;
      }

      // Step 2: Get LiveKit token
      const roomName = `${server._id}-${channel._id}`;
      const { data } = await api.post('/api/livekit/token', {
        roomName,
        participantName: user.username,
      });

      // Step 3: Create room with optimized audio settings
      const room = new Room({
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          // Low latency capture hint
          latency: 'interactive',
        },
        publishDefaults: {
          audioPreset: { maxBitrate: 64000 },
          dtx: false,   // Disable DTX — causes audio gaps that feel like delay
          red: false,   // Disable RED — adds buffering latency
          simulcast: false,
        },
        adaptiveStream: false, // Disable — adds jitter buffer delay
        dynacast: false,       // Disable — adds processing delay
        stopLocalTrackOnUnpublish: false,
        // Minimize jitter buffer
        audio: {
          jitterBufferTarget: 0, // Minimum buffering
        },
        reconnectPolicy: {
          maxRetries: 10,
          nextRetryDelayInMs: () => 1000,
        },
      });

      roomRef.current = room;

      // ─── Room events ────────────────────────────────────────────────────
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        setParticipants([...room.remoteParticipants.values()]);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        detachRemoteTrack(participant.identity);
        setParticipants([...room.remoteParticipants.values()]);
      });

      // Attach audio when a remote track is subscribed
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          attachRemoteTrack(track, participant.identity);
        }
        setParticipants([...room.remoteParticipants.values()]);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          detachRemoteTrack(participant.identity);
        }
      });

      // Speaking detection
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const map = {};
        speakers.forEach(p => { map[p.identity] = true; });
        setSpeaking(map);
      });

      room.on(RoomEvent.Disconnected, () => {
        leaveVoice();
      });

      // Step 4: Connect to LiveKit
      await room.connect(data.url, data.token);

      // Step 5: Create and publish local audio track explicitly
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        // Force lowest possible latency
        latency: 'interactive',
        sampleRate: 48000,
        sampleSize: 16,
      });
      await room.localParticipant.publishTrack(audioTrack);

      setParticipants([...room.remoteParticipants.values()]);
      setInCall(true);

      // Start Android foreground service
      if (window.AndroidVoice) {
        window.AndroidVoice.startVoiceService();
      }

    } catch (err) {
      console.error('Voice join error:', err);
      setError('Failed to join voice: ' + (err.message || String(err)));
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    }
  };

  // ─── Leave voice ──────────────────────────────────────────────────────────
  const leaveVoice = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    // Remove all remote audio elements
    Object.keys(audioTracksRef.current).forEach(id => {
      audioTracksRef.current[id].remove();
    });
    audioTracksRef.current = {};

    setInCall(false);
    setMuted(false);
    setDeafened(false);
    setParticipants([]);
    setSpeaking({});
    setConnectionState('disconnected');

    if (window.AndroidVoice) {
      window.AndroidVoice.stopVoiceService();
    }
  }, []);

  // ─── Mute/unmute ─────────────────────────────────────────────────────────
  const toggleMute = useCallback(async () => {
    if (!roomRef.current) return;
    const newMuted = !muted;
    setMuted(newMuted);
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
  }, [muted]);

  // ─── Deafen/undeafen ─────────────────────────────────────────────────────
  const toggleDeafen = useCallback(() => {
    const newDeafened = !deafened;
    setDeafened(newDeafened);
    // Mute/unmute all remote audio elements
    Object.values(audioTracksRef.current).forEach(el => {
      el.muted = newDeafened;
    });
  }, [deafened]);

  if (!channel) return null;

  const localName = user?.username || 'You';
  const isSpeakingLocal = speaking[roomRef.current?.localParticipant?.identity] || false;

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
          {/* Connection status */}
          {connectionState !== 'connected' && (
            <p style={{ color: 'var(--warning)', fontSize: 12, textAlign: 'center' }}>
              {connectionState === 'reconnecting' ? '🔄 Reconnecting...' : '⏳ Connecting...'}
            </p>
          )}

          <div className="voice-participants">
            {/* Local participant */}
            <div className={`participant ${muted ? 'muted' : ''} ${isSpeakingLocal ? 'speaking' : ''}`}>
              <div className="participant-avatar">
                {localName.slice(0, 2).toUpperCase()}
                {muted && <span className="muted-icon">🔇</span>}
              </div>
              <span>{localName} (you)</span>
            </div>

            {/* Remote participants */}
            {participants.map(participant => (
              <div
                key={participant.identity}
                className={`participant ${speaking[participant.identity] ? 'speaking' : ''}`}
              >
                <div className="participant-avatar">
                  {(participant.name || participant.identity).slice(0, 2).toUpperCase()}
                </div>
                <span>{participant.name || participant.identity}</span>
              </div>
            ))}

            {participants.length === 0 && (
              <p className="waiting-text">{t('waitingForOthers')}</p>
            )}
          </div>

          <div className="voice-controls">
            <button
              className={`voice-btn ${muted ? 'active-danger' : ''}`}
              onClick={toggleMute}
              title={muted ? 'Unmute' : 'Mute'}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🎤'}
            </button>
            <button
              className={`voice-btn ${deafened ? 'active-danger' : ''}`}
              onClick={toggleDeafen}
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
