import { EmptyState, InfoField, InfoGrid, SectionCard, SideDrawer, StatusTag, VersionBadge } from '@/components/common'
import type { Product, ProductCategory, ProductPriceRuleType } from '@/types/product'

export type SourceProductCompareValue = {
  sourceLabel?: string
  specValue?: string
  material?: string
  process?: string
  specialOptions?: string[]
}

type CompareStatus = '一致' | '已调整' | '待选择' | '不支持 / 冲突'

const categoryLabelMap: Record<ProductCategory, string> = {
  ring: '戒指',
  pendant: '吊坠',
  necklace: '项链',
  earring: '耳饰',
  bracelet: '手链',
  other: '其他'
}

const priceRuleTypeLabelMap: Record<ProductPriceRuleType, string> = {
  material: '材质加价',
  process: '工艺加价',
  special: '特殊需求加价',
  other: '其他固定加价'
}

const specModeLabelMap: Record<Product['specMode'], string> = {
  none: '无规格',
  single_axis: '单轴规格'
}

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const formatList = (values?: string[], empty = '—') => (values && values.length > 0 ? values.join(' / ') : empty)

const formatSizeFields = (fields: Product['specs'][number]['sizeFields']) =>
  fields.length > 0 ? fields.map((field) => `${field.label} ${field.value}${field.unit || ''}`).join(' / ') : '—'

const getSelectionStatus = ({
  currentValue,
  supportedValues,
  defaultValue
}: {
  currentValue?: string
  supportedValues: string[]
  defaultValue?: string
}): CompareStatus => {
  if (!currentValue) {
    return '待选择'
  }

  if (!supportedValues.includes(currentValue)) {
    return '不支持 / 冲突'
  }

  if (defaultValue && currentValue !== defaultValue) {
    return '已调整'
  }

  return '一致'
}

const getSpecialOptionsStatus = (currentValues: string[] | undefined, supportedValues: string[]): CompareStatus => {
  if (!currentValues || currentValues.length === 0) {
    return '待选择'
  }

  return currentValues.every((value) => supportedValues.includes(value)) ? '一致' : '不支持 / 冲突'
}

const ComparisonRow = ({
  label,
  templateValue,
  currentValue,
  status
}: {
  label: string
  templateValue: string
  currentValue: string
  status: CompareStatus
}) => (
  <div className="subtle-panel">
    <div className="row wrap" style={{ justifyContent: 'space-between' }}>
      <strong>{label}</strong>
      <StatusTag value={status} />
    </div>
    <InfoGrid columns={2}>
      <InfoField label="模板可选 / 默认" value={templateValue} />
      <InfoField label="当前选择" value={currentValue} />
    </InfoGrid>
  </div>
)

const SourceProductCompareSection = ({
  product,
  compareValue
}: {
  product: Product
  compareValue: SourceProductCompareValue
}) => {
  const specValues = product.specs.map((spec) => spec.specValue)
  const selectedSpecialOptions = compareValue.specialOptions ?? []

  return (
    <SectionCard title="销售参数对比" description="左侧是产品模板允许的范围，右侧是当前销售或草稿的实际选择。">
      <div className="stack">
        {compareValue.sourceLabel ? <div className="text-caption">当前对象：{compareValue.sourceLabel}</div> : null}
        <ComparisonRow
          label="规格"
          templateValue={formatList(specValues, product.specMode === 'none' ? '无需规格' : '暂无规格')}
          currentValue={compareValue.specValue || '未选择'}
          status={getSelectionStatus({ currentValue: compareValue.specValue, supportedValues: specValues })}
        />
        <ComparisonRow
          label="材质"
          templateValue={`默认 ${product.defaultMaterial || '—'} / 支持 ${formatList(product.supportedMaterials)}`}
          currentValue={compareValue.material || '未选择'}
          status={getSelectionStatus({
            currentValue: compareValue.material,
            supportedValues: product.supportedMaterials,
            defaultValue: product.defaultMaterial
          })}
        />
        <ComparisonRow
          label="工艺"
          templateValue={`默认 ${product.defaultProcess || '—'} / 支持 ${formatList(product.supportedProcesses)}`}
          currentValue={compareValue.process || '未选择'}
          status={getSelectionStatus({
            currentValue: compareValue.process,
            supportedValues: product.supportedProcesses,
            defaultValue: product.defaultProcess
          })}
        />
        <ComparisonRow
          label="特殊需求"
          templateValue={`支持 ${formatList(product.supportedSpecialOptions, '暂无可选特殊需求')}`}
          currentValue={formatList(selectedSpecialOptions, '未选择')}
          status={getSpecialOptionsStatus(selectedSpecialOptions, product.supportedSpecialOptions)}
        />
      </div>
    </SectionCard>
  )
}

export const SourceProductDrawer = ({
  open,
  product,
  compareValue,
  onClose
}: {
  open: boolean
  product?: Product
  compareValue?: SourceProductCompareValue
  onClose: () => void
}) => (
  <SideDrawer open={open} title="来源产品详情" onClose={onClose}>
    {!product ? (
      <EmptyState title="未找到来源产品" description="当前销售没有可查看的产品模板。" />
    ) : (
      <div className="stack">
        <div className="text-caption">这里展示产品模板原始信息；查看或调整销售不会修改产品模板。</div>

        <SectionCard title="顶部摘要">
          <InfoGrid columns={3}>
            <InfoField label="产品名称" value={product.name} />
            <InfoField label="产品编号" value={product.code} />
            <InfoField label="当前版本" value={<VersionBadge value={product.version} />} />
            <InfoField label="品类" value={categoryLabelMap[product.category] || product.category} />
            <InfoField label="状态" value={<StatusTag value={product.status === 'enabled' ? '启用' : product.status === 'disabled' ? '停用' : '草稿'} />} />
            <InfoField label="是否可引用" value={product.isReferable ? '是' : '否'} />
          </InfoGrid>
        </SectionCard>

        <SectionCard title="参数配置">
          <InfoGrid columns={3}>
            <InfoField label="支持材质" value={formatList(product.supportedMaterials)} />
            <InfoField label="默认材质" value={product.defaultMaterial || '—'} />
            <InfoField label="支持工艺" value={formatList(product.supportedProcesses)} />
            <InfoField label="默认工艺" value={product.defaultProcess || '—'} />
            <InfoField label="支持特殊需求" value={formatList(product.supportedSpecialOptions, '暂无特殊需求')} />
            <InfoField label="规格模式" value={specModeLabelMap[product.specMode]} />
            <InfoField label="规格名称" value={product.specName || '—'} />
          </InfoGrid>
        </SectionCard>

        <SectionCard title="规格明细">
          {product.specs.length > 0 ? (
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>规格值</th>
                    <th>基础价</th>
                    <th>参考重量</th>
                    <th>尺寸字段</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {product.specs.map((spec) => (
                    <tr key={spec.id}>
                      <td>{spec.specValue}</td>
                      <td>{formatPrice(spec.basePrice)}</td>
                      <td>{typeof spec.referenceWeight === 'number' ? `${spec.referenceWeight}g` : '—'}</td>
                      <td>{formatSizeFields(spec.sizeFields)}</td>
                      <td>
                        <StatusTag value={spec.status === 'enabled' ? '启用' : '停用'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="暂无规格" description="当前产品模板不需要规格行。" />
          )}
        </SectionCard>

        <SectionCard title="价格规则">
          {product.priceRules.length > 0 ? (
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>规则类型</th>
                    <th>规则项</th>
                    <th>固定加价</th>
                    <th>状态</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {product.priceRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{priceRuleTypeLabelMap[rule.type]}</td>
                      <td>{rule.ruleKey}</td>
                      <td>{formatPrice(rule.delta)}</td>
                      <td>
                        <StatusTag value={rule.enabled ? '启用' : '停用'} />
                      </td>
                      <td>{rule.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="暂无价格规则" description="当前产品模板没有配置固定加价规则。" />
          )}
        </SectionCard>

        {compareValue ? <SourceProductCompareSection product={product} compareValue={compareValue} /> : null}
      </div>
    )}
  </SideDrawer>
)
