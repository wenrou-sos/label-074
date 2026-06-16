import type { TableType } from './queue';
export type { TableType };

export type TableStatus = 'idle' | 'dining' | 'cleaning' | 'reserved';

export interface TableParty {
  customerName: string;
  partySize: number;
  queueId?: string;
  reservationId?: string;
}

export interface TableInfo {
  id: string;
  name: string;
  tableType: TableType;
  capacity: number;
  status: TableStatus;
  position: { row: number; col: number };
  diningStartTime?: Date;
  diningDuration?: number;
  currentParty?: TableParty;
}

export interface TableStatusConfig {
  status: TableStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}
