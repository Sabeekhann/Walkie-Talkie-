
export enum ConnectionStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY', // PeerJS server connected, awaiting friend
  CONNECTING = 'CONNECTING', // Calling friend
  CONNECTED = 'CONNECTED', // Linked to friend
  TRANSMITTING = 'TRANSMITTING',
  RECEIVING = 'RECEIVING',
  ERROR = 'ERROR'
}

export interface RadioEvent {
  type: 'PTT_START' | 'PTT_STOP';
  senderId: string;
}
