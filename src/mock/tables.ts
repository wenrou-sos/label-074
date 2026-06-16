import type { TableInfo, TableStatusConfig } from '../types/table';

const now = new Date();
const minutesAgo = (min: number) => new Date(now.getTime() - min * 60 * 1000);

export const tableStatusConfigs: TableStatusConfig[] = [
  {
    status: 'idle',
    label: '空闲',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-700',
  },
  {
    status: 'dining',
    label: '就餐中',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-700',
  },
  {
    status: 'cleaning',
    label: '待清理',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-700',
  },
  {
    status: 'reserved',
    label: '已预订',
    color: 'bg-violet-500',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-400',
    textColor: 'text-violet-700',
  },
];

export const initialTables: TableInfo[] = [
  { id: 't-a1', name: 'A1', tableType: 'small', capacity: 2, status: 'dining', position: { row: 0, col: 0 }, diningStartTime: minutesAgo(45), diningDuration: 45, currentParty: { customerName: '李先生', partySize: 2 } },
  { id: 't-a2', name: 'A2', tableType: 'small', capacity: 2, status: 'idle', position: { row: 0, col: 1 } },
  { id: 't-a3', name: 'A3', tableType: 'small', capacity: 4, status: 'reserved', position: { row: 0, col: 2 } },
  { id: 't-a4', name: 'A4', tableType: 'small', capacity: 2, status: 'dining', position: { row: 0, col: 3 }, diningStartTime: minutesAgo(20), diningDuration: 20, currentParty: { customerName: '王女士', partySize: 2 } },
  { id: 't-a5', name: 'A5', tableType: 'small', capacity: 4, status: 'reserved', position: { row: 0, col: 4 } },
  { id: 't-a6', name: 'A6', tableType: 'small', capacity: 2, status: 'cleaning', position: { row: 0, col: 5 } },

  { id: 't-b1', name: 'B1', tableType: 'medium', capacity: 4, status: 'dining', position: { row: 1, col: 0 }, diningStartTime: minutesAgo(60), diningDuration: 60, currentParty: { customerName: '张先生一家', partySize: 4 } },
  { id: 't-b2', name: 'B2', tableType: 'medium', capacity: 6, status: 'reserved', position: { row: 1, col: 1 } },
  { id: 't-b3', name: 'B3', tableType: 'medium', capacity: 4, status: 'dining', position: { row: 1, col: 2 }, diningStartTime: minutesAgo(30), diningDuration: 30, currentParty: { customerName: '陈先生', partySize: 3 } },
  { id: 't-b4', name: 'B4', tableType: 'medium', capacity: 6, status: 'reserved', position: { row: 1, col: 3 } },
  { id: 't-b5', name: 'B5', tableType: 'medium', capacity: 4, status: 'idle', position: { row: 1, col: 4 } },
  { id: 't-b6', name: 'B6', tableType: 'medium', capacity: 4, status: 'dining', position: { row: 1, col: 5 }, diningStartTime: minutesAgo(15), diningDuration: 15, currentParty: { customerName: '刘女士', partySize: 4 } },

  { id: 't-c1', name: 'C1', tableType: 'large', capacity: 8, status: 'dining', position: { row: 2, col: 0 }, diningStartTime: minutesAgo(75), diningDuration: 75, currentParty: { customerName: '黄女士生日会', partySize: 6 } },
  { id: 't-c2', name: 'C2', tableType: 'large', capacity: 10, status: 'idle', position: { row: 2, col: 1 } },
  { id: 't-c3', name: 'C3', tableType: 'large', capacity: 8, status: 'reserved', position: { row: 2, col: 2 } },
  { id: 't-c4', name: 'C4', tableType: 'large', capacity: 6, status: 'cleaning', position: { row: 2, col: 3 } },

  { id: 't-d1', name: '牡丹厅', tableType: 'private', capacity: 12, status: 'reserved', position: { row: 3, col: 0 } },
  { id: 't-d2', name: '玫瑰厅', tableType: 'private', capacity: 15, status: 'reserved', position: { row: 3, col: 1 } },
  { id: 't-d3', name: '百合厅', tableType: 'private', capacity: 10, status: 'dining', position: { row: 3, col: 2 }, diningStartTime: minutesAgo(90), diningDuration: 90, currentParty: { customerName: '商务宴请', partySize: 9 } },
];
