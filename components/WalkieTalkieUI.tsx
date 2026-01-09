
import React from 'react';
import { ConnectionStatus } from '../types';
import AudioVisualizer from './AudioVisualizer';
import StatusDisplay from './StatusDisplay';

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
          <div className="font-orbitron">
            <div className="text-[9px] opacity-70">CALLSIGN</div>
            <div className="text-sm font-bold tracking-wider">{myId || 'OFFLINE'}</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-[9px] opacity-70">BATTERY</div>
            <div className="text-[10px]">100% [||||]</div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 flex flex-col justify-center py-2 overflow-hidden">
          {isOff ? (
            <div className="text-center opacity-40">SYSTEM DEPLETED</div>
          ) : isReady ? (
            <div className="space-y-2">
              <div className="text-[10px] text-center opacity-70 animate-pulse">AWAITING CONNECTION</div>
              <input 
                placeholder="ENTER FRIEND ID"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                className="w-full bg-stone-900/50 border border-green-900/50 rounded p-2 text-center text-xs font-mono focus:outline-none focus:border-green-500 text-green-400 uppercase"
              />
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <AudioVisualizer active={status === ConnectionStatus.TRANSMITTING || status === ConnectionStatus.RECEIVING} />
              <div className="text-xs font-bold tracking-widest uppercase">
                {status === ConnectionStatus.TRANSMITTING ? '>>> TRANSMITTING >>>' : 
                 status === ConnectionStatus.RECEIVING ? '<<< RECEIVING <<<' : 
                 'SECURE LINK ESTABLISHED'}
              </div>
            </div>
          )}
        </div>

        <StatusDisplay status={status} />
      </div>

      {/* Vol & Link Control */}
      <div className="flex justify-between items-end gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-stone-500 block">VOLUME</label>
          <input 
            type="range" min="0" max="1" step="0.1" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>
        {isReady && (
          <button 
            onClick={onConnect}
            className="px-4 py-1 bg-green-600 text-black text-[10px] font-black rounded hover:bg-green-500 active:scale-95"
          >
            CONNECT
          </button>
        )}
      </div>

      {/* PTT Button */}
      <div className="flex flex-col items-center py-4">
        <button
          onMouseDown={onPTTDown}
          onMouseUp={onPTTUp}
          onMouseLeave={onPTTUp}
          onTouchStart={(e) => { e.preventDefault(); onPTTDown(); }}
          onTouchEnd={(e) => { e.preventDefault(); onPTTUp(); }}
          disabled={!isConnected}
          className={`
            relative w-36 h-36 rounded-full border-8 border-stone-900 flex items-center justify-center transition-all duration-75
            ${!isConnected ? 'opacity-20 cursor-not-allowed grayscale' : 'active:scale-90'}
            ${isPTTPressed ? 'ptt-active bg-red-600' : 'bg-stone-700 hover:bg-stone-600'}
            shadow-[0_12px_0_0_#1a1a1a] active:shadow-none active:translate-y-2
          `}
        >
          <div className="text-white font-orbitron font-black text-2xl text-center leading-none">
            TALK<br/><span className="text-[10px] opacity-60">HOLD PTT</span>
          </div>
          {isPTTPressed && <div className="absolute inset-0 rounded-full border-4 border-red-400/50 animate-ping"></div>}
        </button>
      </div>

      {/* Main Power Button */}
      <button
        onClick={onPower}
        className={`
          w-full py-4 rounded-xl font-orbitron font-black text-xs transition-all tracking-widest
          ${isOff 
            ? 'bg-green-600 hover:bg-green-500 text-black shadow-[0_4px_0_0_#15803d]' 
            : 'bg-stone-900 text-red-500 border border-red-900'}
          active:translate-y-1 active:shadow-none
        `}
      >
        {isOff ? 'INITIALIZE RADIO' : 'SHUT DOWN TERMINAL'}
      </button>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-1 h-6 opacity-5">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="bg-black rounded-full h-1 w-1"></div>
        ))}
      </div>
    </div>
  );
};

export default WalkieTalkieUI;
