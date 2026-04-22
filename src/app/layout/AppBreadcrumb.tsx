import { Link } from 'react-router-dom'

export type BreadcrumbItem = {
  label: string
  to?: string
}

export const AppBreadcrumb = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav className="app-breadcrumb" aria-label="breadcrumb">
    {items.map((item, index) => (
      <span key={`${item.label}-${index}`} className="row">
        {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        {index < items.length - 1 ? <span className="breadcrumb-separator">/</span> : null}
      </span>
    ))}
  </nav>
)
