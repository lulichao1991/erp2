import { useSearchParams } from 'react-router-dom'

export const useDrawerState = (key = 'drawer') => {
  const [searchParams, setSearchParams] = useSearchParams()
  const current = searchParams.get(key)

  const open = (value: string, extras?: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    Object.entries(extras ?? {}).forEach(([extraKey, extraValue]) => next.set(extraKey, extraValue))
    setSearchParams(next)
  }

  const close = () => {
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    next.delete('itemId')
    next.delete('tempItemKey')
    setSearchParams(next)
  }

  return {
    current,
    isOpen: Boolean(current),
    open,
    close
  }
}
