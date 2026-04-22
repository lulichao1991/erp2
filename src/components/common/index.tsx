import type { ReactNode } from 'react'

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ')

export const PageContainer = ({ children }: { children: ReactNode }) => <div className="page-container">{children}</div>

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="page-header">
    <div>
      <h1 className="page-header-title">{title}</h1>
      {subtitle ? <p className="page-header-subtitle">{subtitle}</p> : null}
    </div>
    {actions ? <div className="page-header-actions">{actions}</div> : null}
  </div>
)

type SectionCardProps = {
  title: ReactNode
  description?: string
  actions?: ReactNode
  children: ReactNode
  id?: string
}

export const SectionCard = ({ title, description, actions, children, id }: SectionCardProps) => (
  <section className="section-card" id={id}>
    <div className="section-card-header">
      <div>
        <h2 className="section-card-title">{title}</h2>
        {description ? <p className="text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
    {children}
  </section>
)

type SummaryCardProps = {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export const SummaryCard = ({ title, actions, children }: SummaryCardProps) => (
  <section className="summary-card">
    <div className="summary-card-header">
      <h2 className="summary-card-title">{title}</h2>
      {actions}
    </div>
    {children}
  </section>
)

export const InfoGrid = ({
  columns = 3,
  children
}: {
  columns?: 2 | 3
  children: ReactNode
}) => <div className={cx('info-grid', columns === 2 ? 'two' : 'three')}>{children}</div>

export const InfoField = ({
  label,
  value,
  muted = false
}: {
  label: string
  value?: ReactNode
  muted?: boolean
}) => (
  <div className="info-field">
    <span className="info-field-label">{label}</span>
    <div className={cx('info-field-value', muted && 'muted')}>{value ?? '—'}</div>
  </div>
)

const tagClassMap: Record<string, string> = {
  enabled: 'status-enabled',
  ready: 'status-ready',
  normal: 'status-normal',
  draft: 'status-draft',
  waiting: 'status-waiting',
  warning: 'status-warning',
  disabled: 'status-disabled',
  conflict: 'status-conflict',
  on: 'reference-on',
  off: 'reference-off',
  version: 'version',
  normalTime: 'time-normal',
  dueSoon: 'time-due-soon',
  overdue: 'time-overdue',
  high: 'risk-high',
  adjusted: 'risk-adjusted'
}

export const StatusTag = ({ value }: { value: string }) => {
  const lowered = value.toLowerCase()
  const variant =
    lowered.includes('启用') || lowered.includes('ready') || lowered.includes('进行中')
      ? 'enabled'
      : lowered.includes('草稿') || lowered.includes('待')
        ? 'draft'
        : lowered.includes('禁用') || lowered.includes('停用')
          ? 'disabled'
          : lowered.includes('warning')
            ? 'warning'
            : 'normal'
  return <span className={cx('tag', tagClassMap[variant])}>{value}</span>
}

export const RiskTag = ({ value }: { value: string }) => {
  const variant = value.includes('冲突') || value.includes('高') ? 'high' : 'adjusted'
  return <span className={cx('tag', tagClassMap[variant])}>{value}</span>
}

export const ReferenceTag = ({ active }: { active: boolean }) => (
  <span className={cx('tag', active ? tagClassMap.on : tagClassMap.off)}>{active ? '可引用' : '不可引用'}</span>
)

export const VersionBadge = ({ value }: { value: string }) => <span className={cx('tag', tagClassMap.version)}>{value}</span>

export const TimePressureBadge = ({
  label,
  variant
}: {
  label: string
  variant: 'normal' | 'dueSoon' | 'overdue'
}) => (
  <span className={cx('tag', tagClassMap[variant === 'normal' ? 'normalTime' : variant])}>{label}</span>
)

export const ImageThumb = ({ src, alt }: { src?: string; alt: string }) =>
  src ? <img src={src} alt={alt} className="cover" /> : <div className="placeholder-block">暂无图片</div>

export const ImageGallery = ({ images }: { images: string[] }) => (
  <div className="gallery-grid">
    {images.length > 0 ? images.map((item, index) => <img key={`${item}-${index}`} src={item} alt={`gallery-${index}`} className="cover" />) : <div className="placeholder-block">暂无图片资料</div>}
  </div>
)

type FileItem = { id: string; name: string; version?: string; url: string }

export const FileList = ({ title, files }: { title: string; files: FileItem[] }) => (
  <div className="subtle-panel">
    <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
      <strong>{title}</strong>
      <span className="text-caption">{files.length} 个文件</span>
    </div>
    {files.length > 0 ? (
      <ul className="list-reset stack">
        {files.map((file) => (
          <li key={file.id} className="row wrap" style={{ justifyContent: 'space-between' }}>
            <span>{file.name}</span>
            <div className="row">
              {file.version ? <VersionBadge value={file.version} /> : null}
              <a href={file.url} className="button ghost small">
                查看
              </a>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <div className="text-muted">暂无文件</div>
    )}
  </div>
)

export const EmptyState = ({
  title,
  description,
  action
}: {
  title: string
  description?: string
  action?: ReactNode
}) => (
  <div className="empty-state">
    <h3>{title}</h3>
    {description ? <p>{description}</p> : null}
    {action ? <div className="spacer-top">{action}</div> : null}
  </div>
)

type OverlayProps = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export const LargeModal = ({ open, title, subtitle, onClose, children, footer }: OverlayProps) => {
  if (!open) {
    return null
  }

  return (
    <>
      <button className="modal-backdrop" aria-label="close modal" onClick={onClose} />
      <div className="modal-shell" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2 className="section-card-title">{title}</h2>
            {subtitle ? <p className="text-muted">{subtitle}</p> : null}
          </div>
          <button className="button secondary small" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </>
  )
}

export const SideDrawer = ({ open, title, subtitle, onClose, children, footer }: OverlayProps) => {
  if (!open) {
    return null
  }

  return (
    <>
      <button className="drawer-backdrop" aria-label="close drawer" onClick={onClose} />
      <aside className="drawer-shell" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <div>
            <h2 className="section-card-title">{title}</h2>
            {subtitle ? <p className="text-muted">{subtitle}</p> : null}
          </div>
          <button className="button secondary small" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-footer">{footer}</div> : null}
      </aside>
    </>
  )
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = '确认',
  onConfirm,
  onClose
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) => (
  <LargeModal
    open={open}
    title={title}
    subtitle={description}
    onClose={onClose}
    footer={
      <>
        <button className="button secondary" onClick={onClose}>
          取消
        </button>
        <button className="button primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </>
    }
  >
    <p className="text-muted">该操作仅影响当前前端 mock 数据状态，不会触发真实后端写入。</p>
  </LargeModal>
)
