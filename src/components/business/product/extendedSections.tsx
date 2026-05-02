import { useState } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { InfoField, InfoGrid, SectionCard } from '@/components/common'
import type { Product, ProductAssetFile, ProductVersionRecord } from '@/types/product'

type ProductPlatformListing = {
  id: string
  platform: string
  shopName: string
  itemTitle: string
  externalSku: string
  url: string
}

type ProductAssetFileGroupKey = 'modelFiles' | 'craftFiles' | 'sizeFiles' | 'otherFiles'

const productPlatformListings: Record<string, ProductPlatformListing[]> = {
  'p-ring-001': [
    {
      id: 'ring-taobao',
      platform: '淘宝',
      shopName: '珠宝定制旗舰店',
      itemTitle: '山形素圈戒指 足金 / 18K 定制',
      externalSku: 'TB-RING-SH-016',
      url: 'https://item.taobao.com/item.htm?id=ring-sh-016'
    },
    {
      id: 'ring-douyin',
      platform: '抖音小店',
      shopName: '山形珠宝定制',
      itemTitle: '山形系列素圈戒指',
      externalSku: 'DY-RING-SH-016',
      url: 'https://haohuo.jinritemai.com/views/product/item2?id=ring-sh-016'
    },
    {
      id: 'ring-xhs',
      platform: '小红书店铺',
      shopName: '山形手作饰品',
      itemTitle: '极简山形戒指 日常佩戴',
      externalSku: 'XHS-RING-SH-016',
      url: 'https://www.xiaohongshu.com/goods-detail/ring-sh-016'
    }
  ],
  'p-pendant-001': [
    {
      id: 'pendant-taobao',
      platform: '淘宝',
      shopName: '珠宝定制旗舰店',
      itemTitle: '如意吊坠 足银 / 18K 定制',
      externalSku: 'TB-PDT-S',
      url: 'https://item.taobao.com/item.htm?id=pdt-sh-s'
    },
    {
      id: 'pendant-douyin',
      platform: '抖音小店',
      shopName: '山形珠宝定制',
      itemTitle: '如意系列吊坠',
      externalSku: 'DY-PDT-S',
      url: 'https://haohuo.jinritemai.com/views/product/item2?id=pdt-sh-s'
    }
  ]
}

const productAssetFileGroups: Array<{ key: ProductAssetFileGroupKey; title: string; type: ProductAssetFile['type'] }> = [
  { key: 'modelFiles', title: '建模文件', type: 'model' },
  { key: 'craftFiles', title: '工艺文件', type: 'craft' },
  { key: 'sizeFiles', title: '尺寸文件', type: 'size' },
  { key: 'otherFiles', title: '其他文件', type: 'other' }
]

const splitValues = (value: string) =>
  value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean)

const mergeUniqueValues = (...groups: Array<string[] | undefined>) =>
  Array.from(new Set(groups.flatMap((group) => group ?? []).map((item) => item.trim()).filter(Boolean)))

const updateAssetFileAt = (files: ProductAssetFile[], index: number, next: ProductAssetFile) =>
  files.map((item, currentIndex) => (currentIndex === index ? next : item))

const getNextDesignVersion = (version: string) => {
  const matched = version.trim().match(/^v(\d+)$/i)

  if (!matched) {
    return `${version.trim() || 'v1'}-next`
  }

  return `v${Number(matched[1]) + 1}`
}

export const ProductPlatformListingSection = ({ product }: { product: Product }) => {
  const listings = productPlatformListings[product.id] ?? []

  return (
    <SectionCard id="platforms" title="平台店铺商品">
      {listings.length > 0 ? (
        <div className="platform-listing-grid">
          {listings.map((listing) => (
            <div key={listing.id} className="subtle-panel platform-listing-card">
              <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>{listing.platform}</strong>
                  <div className="text-caption">{listing.shopName}</div>
                </div>
                <a className="button ghost small" href={listing.url} target="_blank" rel="noreferrer">
                  打开商品
                </a>
              </div>
              <div className="spacer-top">
                <InfoGrid columns={2}>
                  <InfoField label="店铺商品标题" value={listing.itemTitle} />
                  <InfoField label="平台货号" value={listing.externalSku} />
                </InfoGrid>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="placeholder-block">当前款式还没有维护平台店铺商品链接。</div>
      )}
    </SectionCard>
  )
}

export const ProductDesignVersionFormSection = ({
  product,
  onCreateVersion
}: {
  product: Product
  onCreateVersion: (nextProduct: Product) => void
}) => {
  const [summary, setSummary] = useState('')
  const [changesText, setChangesText] = useState('')
  const [filesText, setFilesText] = useState('')
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([])
  const nextVersion = getNextDesignVersion(product.version)
  const changes = splitValues(changesText)
  const relatedFiles = mergeUniqueValues(splitValues(filesText), uploadedFileNames)
  const canCreate = summary.trim().length > 0 && changes.length > 0

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []).map((file) => file.name)
    if (nextFiles.length > 0) {
      setUploadedFileNames((current) => mergeUniqueValues(current, nextFiles))
    }
    event.target.value = ''
  }

  const handleCreateVersion = () => {
    if (!canCreate) {
      return
    }

    const updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const record: ProductVersionRecord = {
      id: `ver-${product.id}-${Date.now()}`,
      version: nextVersion,
      updatedAt,
      operatorName: '管理员',
      summary: summary.trim(),
      changes,
      relatedFiles,
      status: 'published'
    }

    onCreateVersion({
      ...product,
      version: nextVersion,
      updatedAt,
      versionHistory: [record, ...product.versionHistory]
    })
  }

  return (
    <SectionCard
      id="version-form"
      title="设计版本"
      description="只有款式外观结构、设计稿或设计方案变化时，才在这里创建新版本。"
    >
      <p className="text-muted product-version-note">不同设计版本保存在同一个款式下，不需要新建款式；只有款式外观结构、设计稿或设计方案变化时才创建新版本。</p>
      <div className="field-grid three product-edit-field-grid">
        <div className="field-control">
          <label className="field-label">当前版本</label>
          <div className="input readonly-input">{product.version}</div>
        </div>
        <div className="field-control">
          <label className="field-label">下一设计版本</label>
          <div className="input readonly-input">{nextVersion}</div>
        </div>
        <div className="field-control">
          <label className="field-label">设计文件上传</label>
          <input type="file" multiple aria-label="设计版本文件上传" onChange={handleFileUpload} />
        </div>
        <div className="field-control product-edit-wide-field">
          <label className="field-label">版本说明</label>
          <input
            className="input"
            aria-label="设计版本说明"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="例如：调整戒臂弧度并重做面宽比例"
          />
        </div>
        <div className="field-control">
          <label className="field-label">相关文件</label>
          <input
            className="input"
            aria-label="设计版本相关文件"
            value={filesText}
            onChange={(event) => setFilesText(event.target.value)}
            placeholder="可用逗号分隔文件名"
          />
        </div>
        <div className="field-control product-edit-wide-field">
          <label className="field-label">设计变更点</label>
          <textarea
            className="textarea"
            aria-label="设计变更点"
            rows={4}
            value={changesText}
            onChange={(event) => setChangesText(event.target.value)}
            placeholder="每行一个变更点，例如：戒臂弧度由直线改为微弧"
          />
        </div>
        <div className="field-control">
          <label className="field-label">操作</label>
          <button type="button" className="button primary" onClick={handleCreateVersion} disabled={!canCreate}>
            创建设计新版本
          </button>
        </div>
      </div>
      {uploadedFileNames.length > 0 ? (
        <div className="row wrap spacer-top">
          {uploadedFileNames.map((file) => (
            <span key={file} className="tag version">
              {file}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-muted spacer-top">补齐参数、价格规则、生产参考、图片与普通文件资料，请直接保存修改，不要在这里升版。</p>
    </SectionCard>
  )
}

export const ProductAssetsFormSection = ({
  product,
  setProduct
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
}) => {
  const addDetailImage = () =>
    setProduct((current) => ({
      ...current,
      assets: { ...current.assets, detailImages: [...current.assets.detailImages, ''] }
    }))

  const handleDetailImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setProduct((current) => ({
      ...current,
      assets: { ...current.assets, detailImages: [...current.assets.detailImages, file.name] }
    }))
    event.target.value = ''
  }

  const addAssetFile = (groupKey: ProductAssetFileGroupKey, type: ProductAssetFile['type'], file?: File) =>
    setProduct((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [groupKey]: [
          ...current.assets[groupKey],
          {
            id: `${type}-${Date.now()}`,
            name: file?.name || '',
            type,
            version: current.version,
            url: file?.name || ''
          }
        ]
      }
    }))

  const handleAssetFileUpload = (groupKey: ProductAssetFileGroupKey, type: ProductAssetFile['type']) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    addAssetFile(groupKey, type, file)
    event.target.value = ''
  }

  return (
    <SectionCard id="assets-form" title="图片与文件">
      <div className="stack">
        <div className="subtle-panel">
          <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>详情图片</strong>
            <div className="row wrap">
              <input type="file" aria-label="详情图片上传" accept="image/*" onChange={handleDetailImageUpload} />
              <button type="button" className="button secondary small" onClick={addDetailImage}>
                新增图片链接
              </button>
            </div>
          </div>
          <div className="stack">
            {product.assets.detailImages.map((image, index) => (
              <div key={`detail-image-${index}`} className="field-grid three product-edit-field-grid">
                <div className="field-control product-edit-wide-field">
                  <label className="field-label">图片链接或文件名</label>
                  <input
                    className="input"
                    value={image}
                    onChange={(event) =>
                      setProduct((current) => ({
                        ...current,
                        assets: {
                          ...current.assets,
                          detailImages: current.assets.detailImages.map((item, currentIndex) => (currentIndex === index ? event.target.value : item))
                        }
                      }))
                    }
                  />
                </div>
                <div className="field-control">
                  <label className="field-label">操作</label>
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() =>
                      setProduct((current) => ({
                        ...current,
                        assets: {
                          ...current.assets,
                          detailImages: current.assets.detailImages.filter((_, currentIndex) => currentIndex !== index)
                        }
                      }))
                    }
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
            {product.assets.detailImages.length === 0 ? <div className="placeholder-block">当前没有详情图片。</div> : null}
          </div>
        </div>
        {productAssetFileGroups.map(({ key, title, type }) => (
          <div key={key} className="subtle-panel">
            <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>{title}</strong>
              <div className="row wrap">
                <input type="file" aria-label={`${title}上传`} onChange={handleAssetFileUpload(key, type)} />
                <button type="button" className="button secondary small" onClick={() => addAssetFile(key, type)}>
                  新增文件
                </button>
              </div>
            </div>
            <div className="stack">
              {product.assets[key].map((file, index) => (
                <div key={file.id} className="field-grid three product-edit-field-grid">
                  <div className="field-control">
                    <label className="field-label">文件名称</label>
                    <input
                      className="input"
                      value={file.name}
                      onChange={(event) =>
                        setProduct((current) => ({
                          ...current,
                          assets: {
                            ...current.assets,
                            [key]: updateAssetFileAt(current.assets[key], index, { ...file, name: event.target.value })
                          }
                        }))
                      }
                    />
                  </div>
                  <div className="field-control">
                    <label className="field-label">文件版本</label>
                    <input
                      className="input"
                      value={file.version || ''}
                      onChange={(event) =>
                        setProduct((current) => ({
                          ...current,
                          assets: {
                            ...current.assets,
                            [key]: updateAssetFileAt(current.assets[key], index, { ...file, version: event.target.value })
                          }
                        }))
                      }
                    />
                  </div>
                  <div className="field-control">
                    <label className="field-label">文件链接或文件名</label>
                    <div className="row">
                      <input
                        className="input"
                        value={file.url}
                        onChange={(event) =>
                          setProduct((current) => ({
                            ...current,
                            assets: {
                              ...current.assets,
                              [key]: updateAssetFileAt(current.assets[key], index, { ...file, url: event.target.value })
                            }
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="button secondary small"
                        onClick={() =>
                          setProduct((current) => ({
                            ...current,
                            assets: {
                              ...current.assets,
                              [key]: current.assets[key].filter((item) => item.id !== file.id)
                            }
                          }))
                        }
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {product.assets[key].length === 0 ? <div className="placeholder-block">当前没有{title}。</div> : null}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
