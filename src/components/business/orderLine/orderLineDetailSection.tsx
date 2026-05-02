import type { ReactNode } from 'react'
import { SectionCard } from '@/components/common'

export const DetailSection = ({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) => (
  <SectionCard title={title} actions={actions} className="compact-card order-line-detail-section">
    {children}
  </SectionCard>
)
