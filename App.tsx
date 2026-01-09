
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { ConnectionStatus } from './types';
import WalkieTalkieUI from './components/WalkieTalkieUI';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [isPTTPressed, setIsPTTPressed] = useState<boolean>(false);
  const [isRemoteTalking, setIsRemoteTalking] = useState<boolean>(false);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate a friendly ID
  const generateId = () => `RADIO-${Math.floor(1000 + Math.random() * 9000)}`;

  const playBeep = (freq: number, duration: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const initRadio = async () => {
    if (peerRef.current) return;
    setStatus(ConnectionStatus.INITIALIZING);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep microphone track disabled until PTT is pressed
      stream.getAudioTracks().forEach(track => (track.enabled = false));
      localStreamRef.current = stream;

      const peer = new Peer(generateId());
      peerRef.current = peer;

      peer.on('open', (id) => {
        setMyPeerId(id);
        setStatus(ConnectionStatus.READY);
      });

      peer.on('call', (incomingCall) => {
        if (window.confirm(`Incoming transmission from ${incomingCall.peer}. Accept?`)) {
          incomingCall.answer(localStreamRef.current!);
          setupCall(incomingCall);
        }
      });

      peer.on('connection', (conn) => {
        setupDataConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('Peer Error:', err);
        setStatus(ConnectionStatus.ERROR);
      });
    } catch (err) {
      console.error('Mic Access Denied:', err);
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const setupCall = (call: MediaConnection) => {
    callRef.current = call;
    setStatus(ConnectionStatus.CONNECTED);

    call.on('stream', (remoteStream) => {
      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
      }
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = volume;
      remoteAudioRef.current.play();
    });

    call.on('close', () => {
      setStatus(ConnectionStatus.READY);
      setIsRemoteTalking(false);
    });
  };

  const setupDataConnection = (conn: DataConnection) => {
    dataConnRef.current = conn;
    conn.on('data', (data: any) => {
      if (data.type === 'PTT_START') {
        setIsRemoteTalking(true);
      } else if (data.type === 'PTT_STOP') {
        setIsRemoteTalking(false);
      }
    });
    conn.on('close', () => {
      dataConnRef.current = null;
    });
  };

  const connectToFriend = () => {
    if (!targetPeerId || !peerRef.current || !localStreamRef.current) return;
    setStatus(ConnectionStatus.CONNECTING);

    // Start Audio Call
    const call = peerRef.current.call(targetPeerId, localStreamRef.current);
    setupCall(call);

    // Start Data Connection for PTT signaling
    const conn = peerRef.current.connect(targetPeerId);
    setupDataConnection(conn);
  };

  const disconnect = () => {
    callRef.current?.close();
    dataConnRef.current?.close();
    setStatus(ConnectionStatus.READY);
    setIsRemoteTalking(false);
  };

  const handlePTTDown = () => {
    if (status !== ConnectionStatus.CONNECTED || isRemoteTalking) return;
    
    setIsPTTPressed(true);
    playBeep(880, 0.05);

    // Unmute Mic
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = true));
    }

    // Signal Peer
    dataConnRef.current?.send({ type: 'PTT_START' });
  };

  const handlePTTUp = () => {
    if (!isPTTPressed) return;

    setIsPTTPressed(false);
    playBeep(440, 0.05);

    // Mute Mic
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
    }

    // Signal Peer
    dataConnRef.current?.send({ type: 'PTT_STOP' });
  };

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = volume;
    }
  }, [volume]);

  // Map internal flags to visual status
  const currentVisualStatus = 
    isPTTPressed ? ConnectionStatus.TRANSMITTING : 
    isRemoteTalking ? ConnectionStatus.RECEIVING : 
    status;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-800 rounded-3xl p-6 border-8 border-stone-900 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 right-12 w-4 h-24 bg-stone-900 rounded-t-lg z-0"></div>
        
        <WalkieTalkieUI 
          status={currentVisualStatus}
          myId={myPeerId}
          targetId={targetPeerId}
          setTargetId={setTargetPeerId}
          volume={volume}
          setVolume={setVolume}
          isPTTPressed={isPTTPressed}
          onPTTDown={handlePTTDown}
          onPTTUp={handlePTTUp}
          onPower={status === ConnectionStatus.IDLE ? initRadio : disconnect}
          onConnect={connectToFriend}
        />
      </div>
      
      <p className="mt-8 text-stone-500 text-xs font-mono tracking-widest uppercase">
        P2P Tactical Link // v3.0 Real-Person Mode
      </p>
    </div>
  );
};

export default App;
