export interface DailyStats {
  date: string;
  turnoverRate: number;
  avgDiningDuration: number;
  queueLossRate: number;
  totalQueueTaken: number;
  totalQueueLost: number;
  totalDiningParties: number;
  totalTables: number;
  completedDiningDurations: number[];
}
