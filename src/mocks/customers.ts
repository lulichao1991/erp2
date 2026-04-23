import type { Customer } from '@/types/customer'

export const mockCustomers: Customer[] = [
  {
    id: 'customer-lin-001',
    name: '林小姐',
    phone: '13800001234',
    wechat: 'linxiaojie_2218',
    defaultRecipientName: '林小姐',
    defaultRecipientPhone: '13800001234',
    defaultRecipientAddress: '上海市徐汇区漕溪北路 188 号',
    sourceChannels: ['taobao'],
    tags: ['returning', 'high_value'],
    remark: '礼盒卡片请备注生日快乐',
    firstTransactionAt: '2026-03-28 14:20',
    lastTransactionAt: '2026-04-21 10:46',
    totalTransactionCount: 2,
    totalOrderLineCount: 3,
    totalAfterSalesCount: 1
  },
  {
    id: 'customer-wang-001',
    name: '王先生',
    phone: '13900005678',
    defaultRecipientName: '王先生',
    defaultRecipientPhone: '13900005678',
    defaultRecipientAddress: '杭州市滨江区江南大道 999 号',
    sourceChannels: ['offline'],
    tags: ['new'],
    remark: '到店复尺后再排产',
    firstTransactionAt: '2026-04-22 08:30',
    lastTransactionAt: '2026-04-22 08:30',
    totalTransactionCount: 1,
    totalOrderLineCount: 1,
    totalAfterSalesCount: 0
  }
]
