export type TableType = 'small' | 'medium' | 'large' | 'private';

export type QueueStatus = 'waiting' | 'called' | 'seated' | 'cancelled' | 'missed';

export interface QueueItem {
  id: string;
  number: number;
  prefix: string;
  tableType: TableType;
  customerName: string;
  phone: string;
  partySize: number;
  waitTime: number;
  estimatedTime: number;
  status: QueueStatus;
  createdAt: Date;
  calledAt?: Date;
}

export interface QueueColumnData {
  tableType: TableType;
  label: string;
  prefix: string;
  capacity: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}
