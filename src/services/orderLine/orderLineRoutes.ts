export const getOrderLineDetailPath = (orderLineId?: string) =>
  orderLineId ? `/order-lines/${encodeURIComponent(orderLineId)}` : '/order-lines'
