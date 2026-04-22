import { useState } from 'react'

export const useSourceProductDrawer = () => {
  const [activeTab, setActiveTab] = useState<'detail' | 'compare' | 'assets'>('detail')
  const [viewVersionMode, setViewVersionMode] = useState<'referenced' | 'current'>('referenced')

  return {
    activeTab,
    setActiveTab,
    viewVersionMode,
    setViewVersionMode
  }
}
