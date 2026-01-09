
import React from 'https://esm.sh/react@18.2.0';
import { ConnectionStatus } from '../types.ts';
import AudioVisualizer from './AudioVisualizer.tsx';
import StatusDisplay from './StatusDisplay.tsx';

interface WalkieTalkieUIProps {
  status: ConnectionStatus;
  myId: string;
  targetId: string;
  setTargetId: (id: string) => void;
  volume: number;
  setVolume: (v: number) => void;
  isPTTPressed: boolean;
  onPTTDown: () => void;
  onPTTUp: () => void;
  onPower: () => void;
  onConnect: () => void;
}

const WalkieTalkieUI: React.FC<WalkieTalkieUIProps> = ({
  status,
  myId,
  targetId,
  setTargetId,
  volume,
  setVolume,
  isPTTPressed,
  onPTTDown,
  onPTTUp,
  onPower,
  onConnect
}) => {
  const isOff = status === ConnectionStatus.IDLE;
  const isReady = status === ConnectionStatus.READY;
  const isConnected = status === ConnectionStatus.CONNECTED || 
                      status === ConnectionStatus.TRANSMITTING || 
                      status === ConnectionStatus.RECEIVING;

  const copyId = () => {
    if (!myId) return;
    navigator.clipboard.writeText(myId);
    alert('Callsign Copied! Send this to your friend.');
  };

  return (
    <div className="relative z-10 space-y-5">
      {/* Speaker Grill */}
      <div className="grid grid-cols-8 gap-1 h-8 opacity-20">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="bg-black rounded-full h-1 w-1"></div>
        ))}
      </div>

      {/* Main LCD Screen */}
      <div className="lcd-screen rounded-xl p-4 min-h-[160px] flex flex-col justify-between border-4 border-stone-700">
        <div className="flex justify-between items-start">
          <div className="font-orbitron cursor-pointer group" onClick={copyId}>
            <div className="text-[9px] opacity-70 group-hover:text-green-400 transition-colors">YOUR CALLSIGN (TAP TO COPY)</div>
            <div className="text-sm font-bold tracking-wider group-hover:scale-105 transition-transform origin-left">{myId || 'OFFLINE'}</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-[9px] opacity-70">PWR</div>
            <div className="text-[10px] text-green-500">{isOff ? 'OFF' : 'ON'}</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center py-2 overflow-hidden">
          {isOff ? (
            <div className="text-center opacity-40 py-4 font-orbitron animate-pulse">RADIO DEACTIVATED</div>
          ) : isReady ? (
            <div className="space-y-2">
              <div className="text-[10px] text-center opacity-70 uppercase font-bold tracking-tighter">Enter Target Callsign</div>
              <input 
                placeholder="TARGET-ID"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.toUpperCase().trim())}
                className="w-full bg-stone-900/80 border border-green-900/50 rounded p-3 text-center text-sm font-mono focus:outline-none focus:border-green-500 text-green-400 uppercase tracking-widest"
              />
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <AudioVisualizer active={status === ConnectionStatus.TRANSMITTING || status === ConnectionStatus.RECEIVING} />
              <div className="text-[10px] font-bold tracking-widest uppercase py-1">
                {status === ConnectionStatus.TRANSMITTING ? '>>> TRANSMITTING >>>' : 
                 status === ConnectionStatus.RECEIVING ? '<<< RECEIVING <<<' : 
                 'LINK ESTABLISHED'}
              </div>
            </div>
          )}
        </div>

        <StatusDisplay status={status} />
      </div>

      {/* Volume & Link Control */}
      <div className="flex justify-between items-end gap-4 bg-stone-900/30 p-2 rounded-lg border border-stone-700/50">
        <div className="flex-1 space-y-1">
          <label className="text-[9px] font-bold text-stone-500 block">SQUELCH / GAIN</label>
          <input 
            type="range" min="0" max="1" step="0.1" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>
        {isReady && (
          <button 
            onClick={onConnect}
            className="px-6 py-2 bg-green-600 text-black text-[10px] font-black rounded uppercase hover:bg-green-500 active:scale-95 shadow-lg shadow-green-900/20 transition-all"
          >
            Connect
          </button>
        )}
      </div>

      {/* PTT Button */}
      <div className="flex flex-col items-center py-2">
        <button
          onMouseDown={onPTTDown}
          onMouseUp={onPTTUp}
          onMouseLeave={onPTTUp}
          onTouchStart={(e) => { e.preventDefault(); onPTTDown(); }}
          onTouchEnd={(e) => { e.preventDefault(); onPTTUp(); }}
          disabled={!isConnected}
          className={`
            relative w-40 h-40 rounded-full border-[12px] border-stone-900 flex items-center justify-center transition-all duration-75
            ${!isConnected ? 'opacity-10 cursor-not-allowed grayscale scale-90' : 'active:scale-90 active:translate-y-1'}
            ${isPTTPressed ? 'ptt-active bg-red-600 border-red-900' : 'bg-stone-700 hover:bg-stone-600'}
            shadow-[0_16px_0_0_#1a1a1a] active:shadow-none
          `}
        >
          <div className={`text-white font-orbitron font-black text-2xl text-center leading-tight ${isPTTPressed ? 'animate-pulse' : ''}`}>
            TALK<br/><span className="text-[10px] opacity-60">PUSH TO TALK</span>
          </div>
          {isPTTPressed && <div className="absolute inset-0 rounded-full border-4 border-red-400/50 animate-ping"></div>}
        </button>
      </div>

      {/* Main Power Button */}
      <button
        onClick={onPower}
        className={`
          w-full py-5 rounded-2xl font-orbitron font-black text-sm transition-all tracking-widest uppercase
          ${isOff 
            ? 'bg-green-600 hover:bg-green-500 text-black shadow-[0_6px_0_0_#15803d]' 
            : 'bg-stone-900 text-red-500 border-2 border-red-900/50 hover:bg-red-950/20'}
          active:translate-y-1 active:shadow-none
        `}
      >
        {isOff ? 'Initialize Radio' : 'Power Down System'}
      </button>

      {/* Bottom Grid Decor */}
      <div className="grid grid-cols-12 gap-1 h-4 opacity-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="bg-black rounded-full h-1 w-1"></div>
        ))}
      </div>
    </div>
  );
};

export default WalkieTalkieUI;
