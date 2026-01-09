
import React from 'https://esm.sh/react@18.2.0';
import { ConnectionStatus } from '../types.ts';

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
        return { text: 'STANDBY', color: 'text-green-800', blink: false };
      case ConnectionStatus.CONNECTING:
        return { text: 'LINKING...', color: 'text-yellow-400', blink: true };
      case ConnectionStatus.CONNECTED:
        return { text: 'SECURE', color: 'text-green-500', blink: false };
      case ConnectionStatus.TRANSMITTING:
        return { text: 'TX', color: 'text-red-500', blink: true };
      case ConnectionStatus.RECEIVING:
        return { text: 'RX', color: 'text-blue-500', blink: true };
      case ConnectionStatus.ERROR:
        return { text: 'FAIL', color: 'text-red-700', blink: false };
      default:
        return { text: 'OFF', color: 'text-stone-600', blink: false };
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
