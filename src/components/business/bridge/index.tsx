import { Link } from 'react-router-dom'
import {
  FileList,
  ImageGallery,
  InfoField,
  InfoGrid,
  LargeModal,
  ReferenceTag,
  SideDrawer,
  StatusTag,
  VersionBadge
} from '@/components/common'
import { useProductPicker } from '@/hooks/useProductPicker'
import { useSourceProductDrawer } from '@/hooks/useSourceProductDrawer'
import type { OrderItem } from '@/types/order'
import type { Product } from '@/types/product'

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const formatPriceRange = (values: number[]) => {
  if (values.length === 0) {
    return '—'
  }

  const sorted = [...values].sort((a, b) => a - b)

  return sorted[0] === sorted[sorted.length - 1]
    ? formatPrice(sorted[0])
    : `${formatPrice(sorted[0])} ~ ${formatPrice(sorted[sorted.length - 1])}`
}

const buildSpecColumns = (product: Product) => {
  const columns: Array<{ key: string; label: string; unit?: string }> = []
  const seen = new Set<string>()

  product.specs.forEach((spec) => {
    spec.sizeFields.forEach((field) => {
      if (seen.has(field.key)) {
        return
      }

      seen.add(field.key)
      columns.push({ key: field.key, label: field.label, unit: field.unit })
    })
  })

  return columns
}

export const ProductPickerModal = ({
  open,
  products,
  onClose,
  onConfirm
}: {
  open: boolean
  products: Product[]
  onClose: () => void
  onConfirm: (product: Product) => void
}) => {
  const picker = useProductPicker(products)

  return (
    <LargeModal
      open={open}
      title="产品引用选择器"
      subtitle="在订单上下文内完成产品搜索、筛选、预览和确认引用。"
      onClose={onClose}
      footer={
        <>
          <button className="button secondary" onClick={onClose}>
            取消
          </button>
          <button className="button primary" disabled={!picker.selectedProduct} onClick={() => picker.selectedProduct && onConfirm(picker.selectedProduct)}>
            确认引用
          </button>
        </>
      }
    >
      <div className="product-picker-layout">
        <div className="stack product-picker-filters">
          <div className="field-control">
            <label className="field-label">搜索产品</label>
            <input className="input" value={picker.keyword} onChange={(event) => picker.setKeyword(event.target.value)} placeholder="产品名称 / 编号 / 系列" />
          </div>
          <div className="field-control">
            <label className="field-label">品类</label>
            <select className="select" value={picker.filters.category} onChange={(event) => picker.setFilters((current) => ({ ...current, category: event.target.value }))}>
              <option value="all">全部品类</option>
              <option value="ring">戒指</option>
              <option value="pendant">吊坠</option>
              <option value="necklace">项链</option>
              <option value="earring">耳饰</option>
              <option value="bracelet">手链</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">状态</label>
            <select className="select" value={picker.filters.status} onChange={(event) => picker.setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="all">全部状态</option>
              <option value="enabled">启用</option>
              <option value="draft">草稿</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">引用状态</label>
            <select className="select" value={picker.filters.isReferable} onChange={(event) => picker.setFilters((current) => ({ ...current, isReferable: event.target.value as 'all' | 'yes' }))}>
              <option value="yes">仅可引用</option>
              <option value="all">全部</option>
            </select>
          </div>
        </div>

        <div className="product-picker-content">
          <div className="subtle-panel product-picker-results">
            <div className="product-picker-panel-header">
              <div>
                <div className="section-card-title">可引用产品</div>
                <div className="text-muted">当前共 {picker.filteredProducts.length} 个结果</div>
              </div>
            </div>
            <div className="card-grid product-picker-grid">
              {picker.filteredProducts.length > 0 ? (
                picker.filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    className={`product-card product-picker-card${picker.selectedProductId === product.id ? ' selected' : ''}`}
                    onClick={() => picker.setSelectedProductId(product.id)}
                  >
                    <img src={product.coverImage} alt={product.name} className="cover product-picker-cover" />
                    <div className="stack product-picker-card-body">
                      <strong>{product.name}</strong>
                      <span className="text-caption">{product.code}</span>
                      <div className="row wrap product-picker-card-tags">
                        <ReferenceTag active={product.isReferable} />
                        <VersionBadge value={product.version} />
                      </div>
                      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                        <span className="text-price">{formatPrice(product.specs[0]?.basePrice)}</span>
                        <span className="text-caption">{product.specs.length} 个规格</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="placeholder-block">当前筛选下暂无可引用产品。</div>
              )}
            </div>
          </div>
          <div className="subtle-panel product-picker-preview">
            {picker.selectedProduct ? (
              <div className="stack">
                <div className="product-picker-panel-header">
                  <div>
                    <div className="section-card-title">快速预览</div>
                    <div className="text-muted">右侧先看核心信息，再决定是否引用到当前商品卡。</div>
                  </div>
                </div>
                <img src={picker.selectedProduct.coverImage} alt={picker.selectedProduct.name} className="cover" />
                <div className="row wrap">
                  <StatusTag value={picker.selectedProduct.status === 'enabled' ? '启用' : picker.selectedProduct.status === 'draft' ? '草稿' : '禁用'} />
                  <ReferenceTag active={picker.selectedProduct.isReferable} />
                  <VersionBadge value={picker.selectedProduct.version} />
                </div>
                <InfoGrid columns={2}>
                  <InfoField label="产品名称" value={picker.selectedProduct.name} />
                  <InfoField label="产品编号" value={picker.selectedProduct.code} />
                  <InfoField label="默认材质" value={picker.selectedProduct.defaultMaterial || '—'} />
                  <InfoField label="默认工艺" value={picker.selectedProduct.defaultProcess || '—'} />
                  <InfoField label="规格模式" value={picker.selectedProduct.specMode === 'single_axis' ? '单轴规格' : '无规格'} />
                  <InfoField label="参考基础价" value={formatPrice(picker.selectedProduct.specs[0]?.basePrice)} />
                </InfoGrid>
                <div className="subtle-panel">
                  <strong>规格摘要</strong>
                  <ul className="list-reset stack spacer-top">
                    {picker.selectedProduct.specs.map((spec) => (
                      <li key={spec.id} className="row wrap" style={{ justifyContent: 'space-between' }}>
                        <span>{spec.specValue}</span>
                        <span className="text-price">{formatPrice(spec.basePrice)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="placeholder-block">左侧选择一个产品后，这里会显示快速预览。</div>
            )}
          </div>
        </div>
      </div>
    </LargeModal>
  )
}

export const SourceProductDrawer = ({
  open,
  product,
  item,
  onClose
}: {
  open: boolean
  product?: Product
  item?: OrderItem
  onClose: () => void
}) => {
  const drawer = useSourceProductDrawer()

  if (!product || !item) {
    return null
  }

  const compareRows = [
    {
      label: '材质',
      orderValue: item.selectedMaterial || '未选择',
      productValue: product.defaultMaterial || '未维护',
      status: item.selectedMaterial && item.selectedMaterial !== product.defaultMaterial ? 'adjusted' : 'matched'
    },
    {
      label: '工艺',
      orderValue: item.selectedProcess || '未选择',
      productValue: product.defaultProcess || '未维护',
      status: item.selectedProcess && item.selectedProcess !== product.defaultProcess ? 'adjusted' : 'matched'
    },
    {
      label: '规格值',
      orderValue: item.selectedSpecValue || '未选择',
      productValue: item.sourceProduct?.sourceSpecValue || '引用时未记录',
      status: item.selectedSpecValue && item.selectedSpecValue !== item.sourceProduct?.sourceSpecValue ? 'adjusted' : 'matched'
    },
    {
      label: '需测量工具',
      orderValue: '沿用模板',
      productValue: product.customRules.requiresMeasureTool ? '是' : '否',
      status: 'matched'
    },
    {
      label: '需重新建模',
      orderValue: '沿用模板',
      productValue: product.customRules.requiresRemodeling ? '是' : '否',
      status: 'matched'
    }
  ]

  const specColumns = buildSpecColumns(product)
  const sortedSpecs = [...product.specs].sort((left, right) => left.sortOrder - right.sortOrder)
  const currentSpecValue = item.selectedSpecValue || item.selectedSpecSnapshot?.specValue
  const sourceSpecValue = item.sourceProduct?.sourceSpecValue
  const priceRange = formatPriceRange(product.specs.map((spec) => spec.basePrice).filter((value): value is number => typeof value === 'number'))

  return (
    <SideDrawer
      open={open}
      title="来源产品详情"
      subtitle="用于核对订单商品参数与来源产品模板原始值，不打开订单商品详情。"
      onClose={onClose}
      footer={
        <>
          <button className="button secondary" onClick={onClose}>
            返回订单
          </button>
          <Link to={`/products/${product.id}`} className="button primary">
            在产品模块中查看
          </Link>
        </>
      }
    >
      <div className="subtle-panel">
        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>{product.name}</strong>
            <div className="text-caption">{product.code}</div>
          </div>
          <div className="row wrap">
            <VersionBadge value={item.sourceProduct?.sourceProductVersion || product.version} />
            <span className="topbar-pill">当前查看：{drawer.viewVersionMode === 'referenced' ? '引用时版本语义' : '当前版本'}</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {[
          ['detail', '模板原始详情'],
          ['compare', '订单参数对比'],
          ['assets', '文件资料']
        ].map(([key, label]) => (
          <button key={key} className={`tab-button${drawer.activeTab === key ? ' active' : ''}`} onClick={() => drawer.setActiveTab(key as 'detail' | 'compare' | 'assets')}>
            {label}
          </button>
        ))}
      </div>

      {drawer.activeTab === 'detail' ? (
        <div className="stack">
          <img src={product.coverImage} alt={product.name} className="cover" />
          <InfoGrid columns={2}>
            <InfoField label="产品名称" value={product.name} />
            <InfoField label="产品编号" value={product.code} />
            <InfoField label="默认材质" value={product.defaultMaterial || '—'} />
            <InfoField label="默认工艺" value={product.defaultProcess || '—'} />
            <InfoField label="规格模式" value={product.specMode === 'single_axis' ? '单轴规格' : '无规格'} />
            <InfoField label="规格名称" value={product.specName || '—'} />
          </InfoGrid>
          <div className="subtle-panel">
            <strong>定制规则</strong>
            <div className="row wrap spacer-top">
              <span className={`tag ${product.customRules.requiresMeasureTool ? 'status-warning' : 'reference-off'}`}>需测量工具：{product.customRules.requiresMeasureTool ? '是' : '否'}</span>
              <span className={`tag ${product.customRules.requiresRemodeling ? 'status-warning' : 'reference-off'}`}>需重新建模：{product.customRules.requiresRemodeling ? '是' : '否'}</span>
              <span className={`tag ${product.customRules.canEngrave ? 'status-enabled' : 'reference-off'}`}>支持刻字：{product.customRules.canEngrave ? '是' : '否'}</span>
            </div>
          </div>
          <div className="field-grid four">
            <div className="subtle-panel">
              <div className="text-caption">模板规格数</div>
              <div className="quote-value">{sortedSpecs.length}</div>
            </div>
            <div className="subtle-panel">
              <div className="text-caption">当前订单所选规格</div>
              <div className="row wrap spacer-top">
                <strong>{currentSpecValue || '未选择'}</strong>
              </div>
            </div>
            <div className="subtle-panel">
              <div className="text-caption">引用时规格</div>
              <div className="row wrap spacer-top">
                <strong>{sourceSpecValue || '未记录'}</strong>
              </div>
            </div>
            <div className="subtle-panel">
              <div className="text-caption">基础价格区间</div>
              <div className="quote-value">{priceRange}</div>
            </div>
          </div>
          <div className="subtle-panel">
            <strong>完整规格参数表</strong>
            <div className="text-muted spacer-top">下表展示模板全部规格参数、参考重量和基础价格，当前订单所选规格会高亮，方便横向核对。</div>
            <div className="spacer-top table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>{product.specName || '规格值'}</th>
                    {specColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    <th>参考重量</th>
                    <th>基础价格</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSpecs.map((spec) => {
                    const isCurrent = currentSpecValue === spec.specValue
                    const isSource = sourceSpecValue === spec.specValue

                    return (
                      <tr key={spec.id} className={isCurrent ? 'row-highlight' : undefined}>
                        <td>
                          <div className="stack" style={{ gap: 6 }}>
                            <strong>{spec.specValue}</strong>
                            <div className="row wrap">
                              {isCurrent ? <span className="tag status-warning">当前订单选择</span> : null}
                              {isSource ? <span className="tag version">引用时规格</span> : null}
                            </div>
                          </div>
                        </td>
                        {specColumns.map((column) => {
                          const field = spec.sizeFields.find((item) => item.key === column.key)
                          return <td key={`${spec.id}-${column.key}`}>{field ? `${field.value}${field.unit ?? ''}` : '—'}</td>
                        })}
                        <td>{typeof spec.referenceWeight === 'number' ? `${spec.referenceWeight} g` : '—'}</td>
                        <td className="price">{formatPrice(spec.basePrice)}</td>
                        <td>
                          <StatusTag value={spec.status === 'enabled' ? '启用' : '禁用'} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {drawer.activeTab === 'compare' ? (
        <div className="stack">
          {compareRows.map((row) => (
            <div key={row.label} className="subtle-panel">
              <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                <strong>{row.label}</strong>
                <span className={`tag ${row.status === 'matched' ? 'status-enabled' : 'status-warning'}`}>{row.status === 'matched' ? '一致 / 沿用模板' : '已调整'}</span>
              </div>
              <div className="field-grid two spacer-top">
                <InfoField label="订单当前值" value={row.orderValue} />
                <InfoField label="来源模板值" value={row.productValue} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {drawer.activeTab === 'assets' ? (
        <div className="stack">
          <ImageGallery images={[...product.galleryImages, ...product.assets.detailImages]} />
          <FileList title="建模文件摘要" files={product.assets.modelFiles} />
          <FileList title="工艺文件摘要" files={product.assets.craftFiles} />
          <FileList title="其他文件摘要" files={[...product.assets.sizeFiles, ...product.assets.otherFiles]} />
        </div>
      ) : null}
    </SideDrawer>
  )
}
