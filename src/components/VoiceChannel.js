import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './VoiceChannel.css';

// Start/stop Android foreground service to keep call alive in background
const startVoiceService = async () => {
  try {
    const { Plugins } = await import('@capacitor/core');
    if (Plugins.VoiceService) await Plugins.VoiceService.startService();
  } catch (e) { /* Not on Android */ }
};

const stopVoiceService = async () => {
  try {
    const { Plugins } = await import('@capacitor/core');
    if (Plugins.VoiceService) await Plugins.VoiceService.stopService();
  } catch (e) { /* Not on Android */ }
};

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN servers for NAT traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 12000,      // 12kHz = توازن بين الجودة والبيانات
    channelCount: 1,        // Mono
    sampleSize: 16
  },
  video: false
};

export default function VoiceChannel({ server, channel }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [inCall, setInCall] = useState(false);
  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [speaking, setSpeaking] = useState({});
  const [screenSharing, setScreenSharing] = useState(false);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnections = useRef({});
  const pendingStreams = useRef({});
  const analyserRefs = useRef({});
  const speakingTimers = useRef({});

  const getUsername = useCallback((userId) => {
    const member = server?.members?.find(m => m.user._id === userId);
    return member?.user?.username || 'Unknown';
  }, [server]);

  const startVAD = useCallback((userId, stream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRefs.current[userId] = { analyser, ctx };
      const data = new Uint8Array(analyser.frequencyBinCount);
      const check = () => {
        if (!analyserRefs.current[userId]) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const isSpeaking = avg > 15;
        setSpeaking(prev => prev[userId] === isSpeaking ? prev : { ...prev, [userId]: isSpeaking });
        speakingTimers.current[userId] = requestAnimationFrame(check);
      };
      check();
    } catch (e) {}
  }, []);

  const stopVAD = useCallback((userId) => {
    if (analyserRefs.current[userId]) {
      analyserRefs.current[userId].ctx.close().catch(() => {});
      delete analyserRefs.current[userId];
    }
    if (speakingTimers.current[userId]) {
      cancelAnimationFrame(speakingTimers.current[userId]);
      delete speakingTimers.current[userId];
    }
    setSpeaking(prev => { const n = { ...prev }; delete n[userId]; return n; });
  }, []);

  const setAudioRef = useCallback((userId, el) => {
    if (!el) return;
    if (pendingStreams.current[userId]) {
      el.srcObject = pendingStreams.current[userId];
      el.play().catch(() => {});
      startVAD(userId, pendingStreams.current[userId]);
      delete pendingStreams.current[userId];
    }
  }, [startVAD]);

  const createPeerConnection = useCallback((targetUserId) => {
    if (peerConnections.current[targetUserId]) {
      peerConnections.current[targetUserId].close();
    }
    const pc = new RTCPeerConnection(RTC_CONFIG);
    localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const audioEl = document.getElementById(`audio-${targetUserId}`);
      if (audioEl) {
        audioEl.srcObject = stream;
        audioEl.play().catch(() => {});
        startVAD(targetUserId, stream);
      } else {
        pendingStreams.current[targetUserId] = stream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', { targetUserId, candidate: event.candidate });
      }
    };

    peerConnections.current[targetUserId] = pc;
    return pc;
  }, [socket, startVAD]);

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      localStreamRef.current = stream;
      startVAD('self', stream);
      setInCall(true);
      socket.emit('voice:join', { serverId: server._id, channelId: channel._id });
      // Start foreground service on Android
      await startVoiceService();
    } catch (err) {
      alert('Microphone access denied: ' + err.message);
    }
  };

  const leaveVoice = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    Object.keys(analyserRefs.current).forEach(stopVAD);
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    pendingStreams.current = {};
    socket?.emit('voice:leave');
    setInCall(false);
    setPeers([]);
    setScreenSharing(false);
    setSpeaking({});
    // Stop foreground service on Android
    stopVoiceService();
  }, [socket, stopVAD]);

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) pc.removeTrack(sender);
      });
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, width: { max: 1280 } },
        audio: false
      });
      screenStreamRef.current = screenStream;
      setScreenSharing(true);
      const videoTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach(pc => pc.addTrack(videoTrack, screenStream));
      videoTrack.onended = () => { setScreenSharing(false); screenStreamRef.current = null; };
    } catch (err) {
      if (err.name !== 'NotAllowedError') alert('Screen share failed: ' + err.message);
    }
  };

  useEffect(() => {
    if (!socket || !inCall) return;

    const handlePeers = async ({ peers: existingPeers }) => {
      for (const peerId of existingPeers) {
        if (peerId === user._id) continue;
        setPeers(prev => prev.find(p => p.userId === peerId) ? prev : [...prev, { userId: peerId, username: getUsername(peerId) }]);
        await new Promise(r => setTimeout(r, 100));
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { targetUserId: peerId, offer });
      }
    };

    const handleUserJoined = ({ userId }) => {
      if (userId === user._id) return;
      setPeers(prev => prev.find(p => p.userId === userId) ? prev : [...prev, { userId, username: getUsername(userId) }]);
    };

    const handleUserLeft = ({ userId }) => {
      peerConnections.current[userId]?.close();
      delete peerConnections.current[userId];
      delete pendingStreams.current[userId];
      stopVAD(userId);
      const el = document.getElementById(`audio-${userId}`);
      if (el) el.srcObject = null;
      setPeers(prev => prev.filter(p => p.userId !== userId));
    };

    const handleOffer = async ({ fromUserId, offer }) => {
      setPeers(prev => prev.find(p => p.userId === fromUserId) ? prev : [...prev, { userId: fromUserId, username: getUsername(fromUserId) }]);
      await new Promise(r => setTimeout(r, 100));
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetUserId: fromUserId, answer });
    };

    const handleAnswer = async ({ fromUserId, answer }) => {
      const pc = peerConnections.current[fromUserId];
      if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async ({ fromUserId, candidate }) => {
      const pc = peerConnections.current[fromUserId];
      if (pc && pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
      }
    };

    socket.on('voice:peers', handlePeers);
    socket.on('voice:user-joined', handleUserJoined);
    socket.on('voice:user-left', handleUserLeft);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIce);

    return () => {
      socket.off('voice:peers', handlePeers);
      socket.off('voice:user-joined', handleUserJoined);
      socket.off('voice:user-left', handleUserLeft);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIce);
    };
  }, [socket, inCall, user._id, createPeerConnection, getUsername, stopVAD]);

  useEffect(() => { return () => { if (inCall) leaveVoice(); }; }, []);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(!muted);
  };

  const toggleDeafen = () => {
    peers.forEach(peer => {
      const el = document.getElementById(`audio-${peer.userId}`);
      if (el) el.muted = !deafened;
    });
    setDeafened(!deafened);
  };

  return (
    <div className="voice-channel">
      <div className="voice-header">
        <span>🔊 {channel.name}</span>
        <span className="voice-badge">Voice</span>
      </div>

      {!inCall ? (
        <div className="voice-join">
          <p>Join voice channel to talk</p>
          <p className="voice-hint">Low-bitrate audio (16kHz mono) — saves data</p>
          <button className="btn-join-voice" onClick={joinVoice}>Join Voice</button>
        </div>
      ) : (
        <div className="voice-active">
          {peers.map(peer => (
            <audio key={peer.userId} id={`audio-${peer.userId}`} ref={el => setAudioRef(peer.userId, el)} autoPlay playsInline />
          ))}

          {screenSharing && <div className="screen-preview"><p>📺 You are sharing your screen</p></div>}

          <div className="voice-participants">
            <div className={`participant ${muted ? 'muted' : ''} ${speaking['self'] && !muted ? 'speaking' : ''}`}>
              <div className="participant-avatar">
                {user?.username?.slice(0, 2).toUpperCase()}
                {muted && <span className="muted-icon">🔇</span>}
              </div>
              <span>{user?.username} (you)</span>
            </div>

            {peers.map(peer => (
              <div key={peer.userId} className={`participant ${speaking[peer.userId] ? 'speaking' : ''}`}>
                <div className="participant-avatar">{peer.username.slice(0, 2).toUpperCase()}</div>
                <span>{peer.username}</span>
              </div>
            ))}

            {peers.length === 0 && <p className="waiting-text">Waiting for others to join...</p>}
          </div>

          <div className="voice-controls">
            <button className={`voice-btn ${muted ? 'active-danger' : ''}`} onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted ? '🔇' : '🎤'}
            </button>
            <button className={`voice-btn ${deafened ? 'active-danger' : ''}`} onClick={toggleDeafen} title={deafened ? 'Undeafen' : 'Deafen'} aria-label={deafened ? 'Undeafen' : 'Deafen'}>
              {deafened ? '🔕' : '🔊'}
            </button>
            <button className={`voice-btn ${screenSharing ? 'active-screen' : ''}`} onClick={toggleScreenShare} title={screenSharing ? 'Stop sharing' : 'Share screen'} aria-label="Share screen">
              🖥️
            </button>
            <button className="voice-btn leave-btn" onClick={leaveVoice} title="Leave voice" aria-label="Leave voice channel">
              📵
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
