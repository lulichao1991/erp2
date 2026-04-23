const orderSourceChannelsStorageKey = 'erp-demo-order-source-channels'

const defaultOrderSourceChannels = ['淘宝', '京东', '小红书', '抖音', '微信', '线下门店', '企业研发']

const normalizeChannels = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )

export const getOrderSourceChannels = () => {
  if (typeof window === 'undefined') {
    return defaultOrderSourceChannels
  }

  const raw = window.localStorage.getItem(orderSourceChannelsStorageKey)
  if (!raw) {
    return defaultOrderSourceChannels
  }

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return normalizeChannels([...defaultOrderSourceChannels, ...parsed])
    }
  } catch {
    return defaultOrderSourceChannels
  }

  return defaultOrderSourceChannels
}

export const saveOrderSourceChannels = (values: string[]) => {
  const normalized = normalizeChannels(values)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(orderSourceChannelsStorageKey, JSON.stringify(normalized))
  }
  return normalized
}

export const addOrderSourceChannel = (rawValue: string, currentValues?: string[]) =>
  saveOrderSourceChannels([...(currentValues ?? getOrderSourceChannels()), rawValue])
