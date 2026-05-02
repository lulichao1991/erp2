import { useState, type MouseEvent, type ReactNode } from 'react'

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ')

export const PageContainer = ({ children }: { children: ReactNode }) => <div className="page-container">{children}</div>

type PageHeaderProps = {
  title: string
  actions?: ReactNode
  className?: string
}

export const PageHeader = ({ title, actions, className }: PageHeaderProps) => (
  <div className={cx('page-header', className)}>
    <div>
      <h1 className="page-header-title">{title}</h1>
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
  className?: string
  onHeaderClick?: () => void
  headerAriaLabel?: string
  headerExpanded?: boolean
}

export const SectionCard = ({ title, description, actions, children, id, className, onHeaderClick, headerAriaLabel, headerExpanded }: SectionCardProps) => (
  <section className={cx('section-card', className)} id={id}>
    <div className="section-card-header">
      <div
        className={cx('section-card-heading', onHeaderClick && 'section-card-heading-clickable')}
        onClick={onHeaderClick}
        onKeyDown={
          onHeaderClick
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onHeaderClick()
                }
              }
            : undefined
        }
        role={onHeaderClick ? 'button' : undefined}
        tabIndex={onHeaderClick ? 0 : undefined}
        aria-label={onHeaderClick ? headerAriaLabel : undefined}
        aria-expanded={onHeaderClick ? headerExpanded : undefined}
      >
        <h2 className="section-card-title">{title}</h2>
      </div>
      {actions}
    </div>
    {description ? <p className="section-card-description text-muted">{description}</p> : null}
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

export const CopyableText = ({
  value,
  children,
  label,
  className
}: {
  value?: string | number | null
  children?: ReactNode
  label?: string
  className?: string
}) => {
  const [copied, setCopied] = useState(false)
  const copyValue = value === null || value === undefined ? '' : String(value)
  const displayValue = children ?? (copyValue || '—')

  if (!copyValue || copyValue === '—') {
    return <span className={className}>{displayValue}</span>
  }

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(copyValue)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = copyValue
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      className={cx('copyable-text', copied && 'copied', className)}
      title={copied ? '已复制' : `点击复制${label ? ` ${label}` : ''}`}
      aria-label={`复制${label || '内容'}：${copyValue}`}
      onClick={handleCopy}
    >
      {displayValue}
      {copied ? (
        <span className="copyable-text-success" role="status" aria-live="polite">
          复制成功
        </span>
      ) : null}
    </button>
  )
}

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
    lowered.includes('启用') || lowered.includes('ready') || lowered.includes('进行中') || lowered.includes('已完成') || lowered.includes('done')
      ? 'enabled'
      : lowered.includes('草稿') || lowered.includes('待') || lowered.includes('逾期') || lowered.includes('overdue')
        ? 'draft'
        : lowered.includes('禁用') || lowered.includes('停用') || lowered.includes('取消') || lowered.includes('关闭') || lowered.includes('closed')
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

type RecordTimelineItem = {
  id: string
  title: ReactNode
  meta?: ReactNode
  description?: ReactNode
  extra?: ReactNode
}

export const RecordTimeline = ({ items }: { items: RecordTimelineItem[] }) =>
  items.length > 0 ? (
    <ol className="timeline-list list-reset">
      {items.map((item) => (
        <li key={item.id} className="timeline-item">
          <div className="timeline-dot" aria-hidden="true" />
          <div className="timeline-content">
            <div className="row wrap" style={{ justifyContent: 'space-between' }}>
              <strong>{item.title}</strong>
              {item.meta}
            </div>
            {item.description ? <div className="spacer-top">{item.description}</div> : null}
            {item.extra ? <div className="spacer-top">{item.extra}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <div className="placeholder-block">暂无记录</div>
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
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export const LargeModal = ({ open, title, onClose, children, footer }: OverlayProps) => {
  if (!open) {
    return null
  }

  return (
    <>
      <button className="modal-backdrop" aria-label="close modal" onClick={onClose} />
      <div className="modal-shell" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            {typeof title === 'string' ? <h2 className="section-card-title">{title}</h2> : title}
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

export const SideDrawer = ({ open, title, onClose, children, footer }: OverlayProps) => {
  if (!open) {
    return null
  }

  return (
    <>
      <button className="drawer-backdrop" aria-label="close drawer" onClick={onClose} />
      <aside className="drawer-shell" role="dialog" aria-modal="true">
        <div className="drawer-header">
          <div>
            {typeof title === 'string' ? <h2 className="section-card-title">{title}</h2> : title}
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
