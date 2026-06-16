import type { TableType } from './queue';

export type ReservationStatus = 'pending' | 'arrived' | 'cancelled' | 'expired';

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  tableType: TableType;
  tableId?: string;
  tableName?: string;
  reservedTime: Date;
  status: ReservationStatus;
  note?: string;
  createdAt: Date;
}
