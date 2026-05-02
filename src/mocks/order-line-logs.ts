import type { OrderLineLog } from '@/types/order-line'

export const orderLineLogsMock: OrderLineLog[] = [
  {
    id: 'log-ring-created',
    orderLineId: 'oi-ring-001',
    purchaseId: 'o-202604-001',
    actionType: 'created',
    actionLabel: '创建销售',
    operatorName: '王客服',
    createdAt: '2026-04-21 10:46',
    toStatus: 'pending_confirm',
    note: '创建山形素圈戒指销售，并引用山形素圈戒指产品模板。'
  },
  {
    id: 'log-ring-production',
    orderLineId: 'oi-ring-001',
    purchaseId: 'o-202604-001',
    actionType: 'status_changed',
    actionLabel: '状态变更',
    operatorName: '李生产',
    createdAt: '2026-04-23 09:30',
    fromStatus: 'pending_outsource',
    toStatus: 'in_production',
    note: '将销售 RING-SH-016 从「待下厂」改为「生产中」'
  },
  {
    id: 'log-pendant-created',
    orderLineId: 'oi-pendant-001',
    purchaseId: 'o-202604-001',
    actionType: 'created',
    actionLabel: '创建销售',
    operatorName: '王客服',
    createdAt: '2026-04-21 10:48',
    toStatus: 'pending_confirm',
    note: '创建如意吊坠销售，并引用如意吊坠产品模板。'
  },
  {
    id: 'log-pendant-shipment',
    orderLineId: 'oi-pendant-001',
    purchaseId: 'o-202604-001',
    actionType: 'status_changed',
    actionLabel: '状态变更',
    operatorName: '王客服',
    createdAt: '2026-04-24 14:20',
    fromStatus: 'in_production',
    toStatus: 'pending_shipment',
    note: '将销售 PDT-SH-S 从「生产中」改为「待发货」'
  }
]
