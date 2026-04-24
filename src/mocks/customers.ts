import type { Customer } from '@/types/customer'

export const customerMock: Customer = {
  id: 'customer-zhang-001',
  name: '张三',
  phone: '13800001234',
  wechat: 'zhangsan_jewelry',
  defaultRecipientName: '张三',
  defaultRecipientPhone: '13800001234',
  defaultRecipientAddress: '上海市徐汇区漕溪北路 188 号',
  sourceChannels: ['taobao'],
  tags: ['returning', 'high_value'],
  remark: '希望三件商品同单记录，但按单件分别跟进生产、发货和售后。',
  firstTransactionAt: '2026-03-28 14:20',
  lastTransactionAt: '2026-04-21 10:46',
  totalTransactionCount: 2,
  totalOrderLineCount: 3,
  totalAfterSalesCount: 1
}

export const customersMock: Customer[] = [customerMock]

// Compatibility export for existing imports.
export const mockCustomers = customersMock
