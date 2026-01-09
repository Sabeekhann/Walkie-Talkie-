
import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusDisplayProps {
  status: ConnectionStatus;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ConnectionStatus.IDLE:
        return { text: 'POWER OFF', color: 'text-stone-600', blink: false };
      case ConnectionStatus.INITIALIZING:
        return { text: 'BOOTING...', color: 'text-yellow-500', blink: true };
      case ConnectionStatus.READY:
        return { text: 'READY / STANDBY', color: 'text-green-800', blink: false };
      case ConnectionStatus.CONNECTING:
        return { text: 'SEARCHING PEER...', color: 'text-yellow-400', blink: true };
      case ConnectionStatus.CONNECTED:
        return { text: 'LINK SECURED', color: 'text-green-500', blink: false };
      case ConnectionStatus.TRANSMITTING:
        return { text: 'TX - BROADCAST', color: 'text-red-500', blink: true };
      case ConnectionStatus.RECEIVING:
        return { text: 'RX - INCOMING', color: 'text-blue-500', blink: true };
      case ConnectionStatus.ERROR:
        return { text: 'HARDWARE FAILURE', color: 'text-red-700', blink: false };
      default:
        return { text: 'UNKNOWN', color: 'text-stone-600', blink: false };
    }
  };

  const { text, color, blink } = getStatusConfig();

  return (
    <div className="flex items-center gap-2 mt-2 border-t border-green-900/20 pt-2">
      <div className={`w-2 h-2 rounded-full ${color.replace('text', 'bg')} ${blink ? 'animate-pulse' : ''}`}></div>
      <span className={`text-[9px] font-black ${color} tracking-widest uppercase`}>{text}</span>
    </div>
  );
};

export default StatusDisplay;
