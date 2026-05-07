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
  lastTransactionAt: '2026-04-21 10:46'
}

export const linCustomerMock: Customer = {
  id: 'customer-lin-001',
  name: '林小姐',
  phone: '13900005678',
  wechat: 'lin_custom_jewelry',
  defaultRecipientName: '林小姐',
  defaultRecipientPhone: '13900005678',
  defaultRecipientAddress: '杭州市西湖区文三路 99 号',
  sourceChannels: ['xiaohongshu', 'wechat'],
  tags: ['new', 'other'],
  remark: '全定制客户，本次购买不引用现有款式模板，设计和建模分开推进。',
  firstTransactionAt: '2026-04-26 09:10',
  lastTransactionAt: '2026-04-26 09:10'
}

export const zhaoCustomerMock: Customer = {
  id: 'customer-zhao-001',
  name: '赵女士',
  phone: '13700004321',
  wechat: 'zhao_stock_ring',
  defaultRecipientName: '赵女士',
  defaultRecipientPhone: '13700004321',
  defaultRecipientAddress: '北京市朝阳区建国路 88 号',
  sourceChannels: ['offline'],
  tags: ['returning', 'other'],
  remark: '现货客户，购买记录需要能追溯库存占用、出库、财务确认和发货。',
  firstTransactionAt: '2026-03-28 14:20',
  lastTransactionAt: '2026-03-28 14:20'
}

export const internalCustomerMock: Customer = {
  id: 'customer-internal-rd-001',
  name: '内部研发',
  defaultRecipientName: '研发样品库',
  defaultRecipientPhone: '00000000000',
  defaultRecipientAddress: '上海市内部研发样品库',
  sourceChannels: ['other'],
  tags: ['other'],
  remark: '内部研发和新品打样使用的前端 mock 客户档，只用于归组内部购买记录，不代表真实外部客户。',
  firstTransactionAt: '2026-05-01 09:00',
  lastTransactionAt: '2026-05-01 09:00'
}

export const customersMock: Customer[] = [customerMock, linCustomerMock, zhaoCustomerMock, internalCustomerMock]
