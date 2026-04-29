export type GoodsNumberRule = {
  prefix: string
  dateSegment: string
  sequenceLength: number
}

export const defaultGoodsNumberRule: GoodsNumberRule = {
  prefix: 'SKU',
  dateSegment: '202604',
  sequenceLength: 3
}

export const generateGoodsNumber = (sequence: number, rule: GoodsNumberRule = defaultGoodsNumberRule) =>
  `${rule.prefix}-${rule.dateSegment}-${String(sequence).padStart(rule.sequenceLength, '0')}`

export const getGoodsNumberExample = (rule: GoodsNumberRule = defaultGoodsNumberRule) => generateGoodsNumber(1, rule)
