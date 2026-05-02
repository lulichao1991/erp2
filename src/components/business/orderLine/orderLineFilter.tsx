import { useState } from 'react'
import { categoryOptions, quickViewOptions, statusFilterOptions } from '@/components/business/orderLine/orderLineOptions'
import type { OrderLineCenterFilters } from '@/services/orderLine/orderLineWorkspace'

export const OrderLineFilterBar = ({
  value,
  onChange
}: {
  value: OrderLineCenterFilters
  onChange: (next: OrderLineCenterFilters) => void
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <section className="section-card compact-card order-line-filter-card" aria-label="销售筛选">
      <div className="order-line-filter-toolbar">
        <div className="order-line-filter-strip">
          {quickViewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`button small ${value.quickView === option.value ? 'primary' : 'ghost'}`}
              onClick={() => onChange({ ...value, quickView: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" className="button secondary small" onClick={() => setAdvancedOpen((current) => !current)}>
          {advancedOpen ? '收起筛选' : '展开筛选'}
        </button>
      </div>
      <div className="order-line-filter-primary">
        <div className="field-control">
          <label className="field-label">搜索货号 / 款式名称 / 客户 / 购买记录 / 平台单号</label>
          <input
            className="input"
            aria-label="搜索货号 / 款式名称 / 客户 / 购买记录 / 平台单号"
            value={value.keyword}
            onChange={(event) => onChange({ ...value, keyword: event.target.value })}
            placeholder="例如：RING-SH-016 / 山形素圈戒指 / 张三"
          />
        </div>
        <div className="field-control">
          <label className="field-label">状态筛选</label>
          <select className="select" aria-label="状态筛选" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {advancedOpen ? (
        <div className="field-grid three order-line-filter-advanced">
          <div className="field-control">
            <label className="field-label">品类筛选</label>
            <select className="select" aria-label="品类筛选" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}>
              <option value="all">全部品类</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">负责人筛选</label>
            <input
              className="input"
              aria-label="负责人筛选"
              value={value.owner}
              onChange={(event) => onChange({ ...value, owner: event.target.value })}
              placeholder="例如：王客服 / 陈设计"
            />
          </div>
          <div className="field-control">
            <label className="field-label">是否加急</label>
            <select className="select" aria-label="是否加急筛选" value={value.urgent} onChange={(event) => onChange({ ...value, urgent: event.target.value as OrderLineCenterFilters['urgent'] })}>
              <option value="all">全部</option>
              <option value="yes">加急</option>
              <option value="no">非加急</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">是否售后中</label>
            <select className="select" aria-label="是否售后中" value={value.afterSales} onChange={(event) => onChange({ ...value, afterSales: event.target.value as OrderLineCenterFilters['afterSales'] })}>
              <option value="all">全部</option>
              <option value="yes">售后中</option>
              <option value="no">无活跃售后</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">是否超期</label>
            <select className="select" aria-label="是否超期" value={value.overdue} onChange={(event) => onChange({ ...value, overdue: event.target.value as OrderLineCenterFilters['overdue'] })}>
              <option value="all">全部</option>
              <option value="yes">已超期</option>
              <option value="no">未超期</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">工厂筛选</label>
            <input
              className="input"
              aria-label="工厂筛选"
              value={value.factory}
              onChange={(event) => onChange({ ...value, factory: event.target.value })}
              placeholder="例如：苏州金工厂"
            />
          </div>
          <div className="field-control">
            <label className="field-label">购买记录筛选</label>
            <input
              className="input"
              aria-label="购买记录筛选"
              value={value.purchase}
              onChange={(event) => onChange({ ...value, purchase: event.target.value })}
              placeholder="例如：PUR-202604-001"
            />
          </div>
          <div className="field-control">
            <label className="field-label">客户筛选</label>
            <input
              className="input"
              aria-label="客户筛选"
              value={value.customer}
              onChange={(event) => onChange({ ...value, customer: event.target.value })}
              placeholder="例如：张三 / 手机号"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
