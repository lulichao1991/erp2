export type CustomerTag =
  | 'new'
  | 'returning'
  | 'vip'
  | 'high_value'
  | 'after_sales_sensitive'
  | 'blacklist_watch'
  | 'other'

export type CustomerChannel =
  | 'taobao'
  | 'tmall'
  | 'xiaohongshu'
  | 'wechat'
  | 'offline'
  | 'other'

export type Customer = {
  id: string
  name?: string
  phone?: string
  wechat?: string
  defaultRecipientName?: string
  defaultRecipientPhone?: string
  defaultRecipientAddress?: string
  sourceChannels: CustomerChannel[]
  tags: CustomerTag[]
  remark?: string
  firstTransactionAt?: string
  lastTransactionAt?: string
  totalTransactionCount: number
  totalOrderLineCount: number
  totalAfterSalesCount: number
}
