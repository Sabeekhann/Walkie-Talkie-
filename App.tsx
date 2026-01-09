
import React, { useState, useCallback, useRef, useEffect } from 'https://esm.sh/react@18.2.0';
import { Peer } from 'https://esm.sh/peerjs@1.5.4';
import type { MediaConnection, DataConnection } from 'https://esm.sh/peerjs@1.5.4';
import { ConnectionStatus } from './types.ts';
import WalkieTalkieUI from './components/WalkieTalkieUI.tsx';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [volume, setVolume] = useState<number>(0.8);
  const [isPTTPressed, setIsPTTPressed] = useState<boolean>(false);
  const [isRemoteTalking, setIsRemoteTalking] = useState<boolean>(false);

  const peerRef = useRef<any>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const generateId = () => `RADIO-${Math.floor(1000 + Math.random() * 8999)}`;

  const playBeep = (freq: number, duration: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio feedback blocked');
    }
  };

  const setupDataConnection = (conn: DataConnection) => {
    dataConnRef.current = conn;
    conn.on('data', (data: any) => {
      if (data && typeof data === 'object') {
        if (data.type === 'PTT_START') setIsRemoteTalking(true);
        if (data.type === 'PTT_STOP') setIsRemoteTalking(false);
      }
    });
    conn.on('close', () => {
      dataConnRef.current = null;
      if (status !== ConnectionStatus.READY) setStatus(ConnectionStatus.READY);
    });
    conn.on('error', (err) => {
      console.error('Data channel error:', err);
    });
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
      remoteAudioRef.current.play().catch(err => console.warn('Autoplay prevented', err));
    });

    call.on('close', () => {
      setStatus(ConnectionStatus.READY);
      setIsRemoteTalking(false);
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
      setStatus(ConnectionStatus.READY);
    });
  };

  const initRadio = async () => {
    if (peerRef.current) return;
    setStatus(ConnectionStatus.INITIALIZING);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getAudioTracks().forEach(track => (track.enabled = false));
      localStreamRef.current = stream;

      const peer = new Peer(generateId(), {
        debug: 2
      });
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        setMyPeerId(id);
        setStatus(ConnectionStatus.READY);
      });

      peer.on('call', (incomingCall: MediaConnection) => {
        const accept = window.confirm(`Incoming transmission from ${incomingCall.peer}. Connect?`);
        if (accept) {
          incomingCall.answer(localStreamRef.current!);
          setupCall(incomingCall);
        }
      });

      peer.on('connection', (conn: DataConnection) => {
        setupDataConnection(conn);
      });

      peer.on('error', (err: any) => {
        console.error('PeerJS error:', err);
        if (err.type === 'peer-unavailable') {
          alert('Callsign not found. Check ID and try again.');
        } else {
          setStatus(ConnectionStatus.ERROR);
        }
      });

      peer.on('disconnected', () => {
        console.log('Peer server disconnected, attempting reconnect...');
        peer.reconnect();
      });

    } catch (err) {
      console.error('Radio boot failed:', err);
      setStatus(ConnectionStatus.ERROR);
      alert('Microphone access is mandatory for this device.');
    }
  };

  const connectToFriend = () => {
    if (!targetPeerId || !peerRef.current || !localStreamRef.current) return;
    if (targetPeerId === myPeerId) {
      alert("Cannot connect to self.");
      return;
    }
    
    setStatus(ConnectionStatus.CONNECTING);

    const call = peerRef.current.call(targetPeerId, localStreamRef.current);
    setupCall(call);

    const conn = peerRef.current.connect(targetPeerId);
    setupDataConnection(conn);
  };

  const disconnect = () => {
    callRef.current?.close();
    dataConnRef.current?.close();
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setStatus(ConnectionStatus.IDLE);
    setMyPeerId('');
    setIsRemoteTalking(false);
  };

  const handlePTTDown = () => {
    if (status !== ConnectionStatus.CONNECTED || isRemoteTalking) return;
    
    setIsPTTPressed(true);
    playBeep(880, 0.05);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = true));
    }

    if (dataConnRef.current?.open) {
      dataConnRef.current.send({ type: 'PTT_START' });
    }
  };

  const handlePTTUp = () => {
    if (!isPTTPressed) return;

    setIsPTTPressed(false);
    playBeep(440, 0.05);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
    }

    if (dataConnRef.current?.open) {
      dataConnRef.current.send({ type: 'PTT_STOP' });
    }
  };

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = volume;
    }
  }, [volume]);

  const currentVisualStatus = 
    isPTTPressed ? ConnectionStatus.TRANSMITTING : 
    isRemoteTalking ? ConnectionStatus.RECEIVING : 
    status;

  return (
    <div className="w-full max-w-md bg-stone-800 rounded-3xl p-6 border-8 border-stone-900 shadow-2xl relative overflow-hidden m-auto">
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
      
      <p className="mt-8 text-stone-500 text-[8px] font-mono tracking-widest uppercase text-center opacity-50">
        P2P Tactical Link // WebRTC PeerJS
      </p>
    </div>
  );
};

export default App;
