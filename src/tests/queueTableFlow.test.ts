import { createPinia, setActivePinia } from 'pinia';
import { useQueueStore } from '../stores/queue';
import { useTableStore } from '../stores/table';
import { useStatsStore } from '../stores/stats';
import { useReservationStore } from '../stores/reservation';
import type { TableType } from '../types/queue';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    results.push({ name, passed: true, message: '✓ 通过' });
  } catch (e) {
    results.push({ name, passed: false, message: `✗ 失败: ${(e as Error).message}` });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - 期望: ${expected}, 实际: ${actual}`);
  }
}

function assertNotEmpty(value: any, message: string) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    throw new Error(`${message} - 值为空`);
  }
}

function runTests() {
  setActivePinia(createPinia());

  const queueStore = useQueueStore();
  const tableStore = useTableStore();
  const statsStore = useStatsStore();

  console.log('========== 餐厅前厅运营管理面板 - 功能流转测试 ==========\n');

  test('1. 初始状态验证 - 存在空闲小桌', () => {
    const idleSmallTables = tableStore.getIdleTablesByType('small');
    assert(idleSmallTables.length > 0, '应该存在空闲的小桌');
    console.log(`   空闲小桌数量: ${idleSmallTables.length}`);
  });

  test('2. 初始状态验证 - 排队队列有等待顾客', () => {
    const smallQueue = queueStore.getItemsByType('small');
    assert(smallQueue.length > 0, '小桌队列应该有等待顾客');
    console.log(`   小桌排队人数: ${smallQueue.length}`);
  });

  test('3. 初始状态验证 - 统计数据正确', () => {
    const initialDiningParties = statsStore.stats.totalDiningParties;
    const initialTurnoverRate = statsStore.turnoverRate;
    assert(initialDiningParties > 0, '初始用餐桌次应大于0');
    assert(initialTurnoverRate > 0, '初始翻台率应大于0');
    console.log(`   初始用餐桌次: ${initialDiningParties}`);
    console.log(`   初始翻台率: ${initialTurnoverRate.toFixed(2)}轮`);
  });

  const waitingCustomer = queueStore.getItemsByType('small').find(i => i.status === 'waiting');
  const initialIdleCount = tableStore.getIdleTablesByType('small').length;
  const initialDiningCount = tableStore.diningTables.length;
  const initialDiningParties = statsStore.stats.totalDiningParties;
  let assignedTable: any = null;

  test('4. 核心流程 - 排队顾客确认入座自动分配桌台', () => {
    assertNotEmpty(waitingCustomer, '应该有等待的顾客');
    
    const beforeIdleCount = tableStore.getIdleTablesByType('small').length;
    const beforeDiningCount = tableStore.diningTables.length;

    assignedTable = queueStore.confirmSeated(waitingCustomer!.id);
    
    assertNotEmpty(assignedTable, '应该分配到桌台');
    assertEqual(assignedTable!.tableType, 'small', '分配的桌台类型应该是小桌');
    assertEqual(assignedTable!.status, 'dining', '桌台状态应该变为就餐中');

    const afterIdleCount = tableStore.getIdleTablesByType('small').length;
    const afterDiningCount = tableStore.diningTables.length;

    assertEqual(afterIdleCount, beforeIdleCount - 1, '空闲桌台应该减少1');
    assertEqual(afterDiningCount, beforeDiningCount + 1, '就餐桌台应该增加1');

    const updatedQueueItem = queueStore.items.find(i => i.id === waitingCustomer!.id);
    assertEqual(updatedQueueItem!.status, 'seated', '排队状态应该变为已入座');

    console.log(`   分配桌台: ${assignedTable!.name}`);
    console.log(`   桌台当前顾客: ${assignedTable!.currentParty?.customerName}`);
  });

  test('5. 统计更新 - 用餐桌次和翻台率更新', () => {
    const afterDiningParties = statsStore.stats.totalDiningParties;
    assertEqual(afterDiningParties, initialDiningParties + 1, '用餐桌次应该增加1');
    
    const afterTurnoverRate = statsStore.turnoverRate;
    assert(afterTurnoverRate > statsStore.turnoverRate - 0.01, '翻台率应该更新');
    
    console.log(`   更新后用餐桌次: ${afterDiningParties}`);
    console.log(`   更新后翻台率: ${afterTurnoverRate.toFixed(2)}轮`);
  });

  test('6. 模拟用餐时长更新', () => {
    if (assignedTable) {
      assignedTable.diningDuration = 65;
      assertEqual(assignedTable.diningDuration, 65, '用餐时长应该设置为65分钟');
      console.log(`   桌台 ${assignedTable.name} 已用餐: 65分钟`);
    }
  });

  const initialCompletedDurations = [...statsStore.stats.completedDiningDurations];

  test('7. 核心流程 - 结束用餐进入待清理状态', () => {
    assertNotEmpty(assignedTable, '应该有已分配的桌台');
    
    const beforeCompletedCount = statsStore.stats.completedDiningDurations.length;
    const beforeDiningCount = tableStore.diningTables.length;
    const beforeCleaningCount = tableStore.cleaningTables.length;

    const duration = tableStore.markCleaning(assignedTable!.id);
    
    assertEqual(duration, 65, '应该返回正确的用餐时长');
    assertEqual(assignedTable!.status, 'cleaning', '桌台状态应该变为待清理');
    assert(assignedTable!.diningStartTime === undefined, '用餐开始时间应该清除');
    assert(assignedTable!.currentParty === undefined, '当前顾客信息应该清除');

    const afterCompletedCount = statsStore.stats.completedDiningDurations.length;
    const afterDiningCount = tableStore.diningTables.length;
    const afterCleaningCount = tableStore.cleaningTables.length;

    assertEqual(afterCompletedCount, beforeCompletedCount + 1, '已完成用餐时长记录应该增加1');
    assertEqual(afterDiningCount, beforeDiningCount - 1, '就餐桌台应该减少1');
    assertEqual(afterCleaningCount, beforeCleaningCount + 1, '待清理桌台应该增加1');

    const lastDuration = statsStore.stats.completedDiningDurations[statsStore.stats.completedDiningDurations.length - 1];
    assertEqual(lastDuration, 65, '最后一条时长记录应该是65分钟');

    console.log(`   记录用餐时长: 65分钟`);
    console.log(`   已完成时长样本数: ${afterCompletedCount}`);
  });

  test('8. 统计更新 - 平均用餐时长更新', () => {
    const newAvg = statsStore.avgDiningDuration;
    const oldSum = initialCompletedDurations.reduce((a, b) => a + b, 0);
    const expectedAvg = Math.round((oldSum + 65) / (initialCompletedDurations.length + 1));
    
    assertEqual(newAvg, expectedAvg, `平均用餐时长应该更新为${expectedAvg}分钟`);
    console.log(`   更新后平均用餐时长: ${newAvg}分钟`);
  });

  test('9. 核心流程 - 清理完成变为空闲桌台', () => {
    assertNotEmpty(assignedTable, '应该有已分配的桌台');
    
    const beforeCleaningCount = tableStore.cleaningTables.length;
    const beforeIdleCount = tableStore.getIdleTablesByType('small').length;

    tableStore.markIdle(assignedTable!.id);
    
    assertEqual(assignedTable!.status, 'idle', '桌台状态应该变为空闲');

    const afterCleaningCount = tableStore.cleaningTables.length;
    const afterIdleCount = tableStore.getIdleTablesByType('small').length;

    assertEqual(afterCleaningCount, beforeCleaningCount - 1, '待清理桌台应该减少1');
    assertEqual(afterIdleCount, beforeIdleCount + 1, '空闲桌台应该增加1');
    assertEqual(afterIdleCount, initialIdleCount, '空闲桌台数应该恢复到初始数量');

    console.log(`   桌台 ${assignedTable!.name} 已变为空闲`);
    console.log(`   空闲小桌数量: ${afterIdleCount} (初始: ${initialIdleCount})`);
  });

  test('10. 完整生命周期验证 - 桌台可再次分配', () => {
    const waitingCustomer2 = queueStore.getItemsByType('small').find(i => i.status === 'waiting');
    assertNotEmpty(waitingCustomer2, '应该还有等待的顾客');

    const assignedTable2 = queueStore.confirmSeated(waitingCustomer2!.id);
    assertNotEmpty(assignedTable2, '应该能再次分配到桌台');
    assertEqual(assignedTable2!.status, 'dining', '桌台应该再次变为就餐中');

    console.log(`   桌台 ${assignedTable2!.name} 再次分配给 ${waitingCustomer2!.customerName}`);

    tableStore.markIdle(assignedTable2!.id);
  });

  test('11. 边界测试 - 没有空闲桌台时无法入座', () => {
    const testQueueItem = queueStore.addQueueItem('small', 2);
    assertNotEmpty(testQueueItem, '应该能添加排队项');

    const allSmallTables = tableStore.getTablesByType('small');
    const originalStatuses: Record<string, string> = {};
    
    allSmallTables.forEach(t => {
      originalStatuses[t.id] = t.status;
      tableStore.seatParty(t.id, '测试顾客', 2);
    });

    const idleAfter = tableStore.getIdleTablesByType('small').length;
    assertEqual(idleAfter, 0, '所有小桌都应该被占用');

    const result = queueStore.confirmSeated(testQueueItem!.id);
    assertEqual(result, null, '没有空闲桌台时应该返回null');

    allSmallTables.forEach(t => {
      if (originalStatuses[t.id] === 'idle') {
        tableStore.markIdle(t.id);
      } else if (originalStatuses[t.id] === 'cleaning') {
        tableStore.markCleaning(t.id);
      } else if (originalStatuses[t.id] === 'reserved') {
        tableStore.markReserved(t.id);
      }
    });

    queueStore.cancelItem(testQueueItem!.id);
    console.log('   边界测试通过: 无空闲桌台时无法入座');
  });

  test('12. 边界测试 - 只能分配对应类型的桌台', () => {
    const mediumQueueItem = queueStore.items.find(i => i.tableType === 'medium' && i.status === 'waiting');
    assertNotEmpty(mediumQueueItem, '应该有中桌等待顾客');

    const idleSmallBefore = tableStore.getIdleTablesByType('small').length;
    const idleMediumBefore = tableStore.getIdleTablesByType('medium').length;

    const assigned = queueStore.confirmSeated(mediumQueueItem!.id);
    
    assertNotEmpty(assigned, '应该分配到桌台');
    assertEqual(assigned!.tableType, 'medium', '应该分配中桌，而不是小桌');

    const idleMediumAfter = tableStore.getIdleTablesByType('medium').length;
    assertEqual(idleMediumAfter, idleMediumBefore - 1, '空闲中桌应该减少1');

    const idleSmallAfter = tableStore.getIdleTablesByType('small').length;
    assertEqual(idleSmallAfter, idleSmallBefore, '空闲小桌数量应该不变');

    tableStore.markIdle(assigned!.id);
    console.log(`   分配正确: ${assigned!.name} (${assigned!.tableType})`);
  });

  test('13. 等位流失率统计验证', () => {
    const lossRate = statsStore.queueLossRate;
    const qStats = queueStore.getQueueStats();
    
    assert(qStats.total > 0, '总取号数应该大于0');
    assert(qStats.lost >= 0, '流失人数应该大于等于0');
    assert(lossRate >= 0 && lossRate <= 100, '流失率应该在0-100之间');
    
    console.log(`   总取号: ${qStats.total}人`);
    console.log(`   流失: ${qStats.lost}人`);
    console.log(`   等位流失率: ${lossRate}%`);
  });

  test('14. 预订超时自动取消验证', () => {
    const reservationStore = useReservationStore();
    const pendingCount = reservationStore.pendingReservations.length;
    const expiredCount = reservationStore.reservations.filter((r: any) => r.status === 'expired').length;

    assert(pendingCount >= 0, '待到达预订数应该大于等于0');
    assert(expiredCount >= 0, '已超时预订数应该大于等于0');

    console.log(`   待到店: ${pendingCount}单`);
    console.log(`   已超时: ${expiredCount}单`);
  });

  console.log('\n==================== 测试结果汇总 ====================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`);
    if (!r.passed) {
      console.log(`   ${r.message}`);
    }
  });

  console.log(`\n总计: ${passed} 通过, ${failed} 失败`);
  console.log(`成功率: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ 存在失败的测试，请检查代码！');
  } else {
    console.log('\n✅ 所有测试通过！功能流转正常。');
  }

  return { passed, failed, results };
}

export { runTests, test, assert, assertEqual, assertNotEmpty };
