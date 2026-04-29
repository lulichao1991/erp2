import { Link } from 'react-router-dom'
import {
  PurchaseDraftCommonSection,
  PurchaseDraftCustomerSection,
  PurchaseDraftOrderLinesSection,
  PurchaseDraftPaymentSection,
  usePurchaseDraftForm
} from '@/components/business/purchase'
import { PageContainer, PageHeader } from '@/components/common'

export const PurchaseCreatePage = () => {
  const {
    purchaseDraft,
    orderLineDrafts,
    paymentSummary,
    successMessage,
    errorMessage,
    updatePurchaseDraft,
    addOrderLine,
    removeOrderLine,
    duplicateOrderLine,
    updateOrderLine,
    applyProductToOrderLine,
    selectOrderLineSpec,
    toggleOrderLineSpecialOption,
    saveDraft
  } = usePurchaseDraftForm()

  return (
    <PageContainer>
      <PageHeader
        title="新建购买记录"
        className="compact-page-header"
        actions={
          <div className="row wrap">
            <Link to="/order-lines" className="button secondary">
              返回销售中心
            </Link>
            <button type="button" className="button primary" onClick={saveDraft}>
              保存草稿
            </button>
          </div>
        }
      />

      <div className="stack">
        <div className="subtle-panel">
          <strong>先填写本次购买的公共信息，再逐件添加销售。</strong>
          <div className="text-caption">当前草稿：1 笔购买记录 + {orderLineDrafts.length} 条销售。</div>
        </div>

        {successMessage ? (
          <div className="subtle-panel" role="status">
            {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="danger-alert" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <PurchaseDraftCommonSection draft={purchaseDraft} onChange={updatePurchaseDraft} />
        <PurchaseDraftCustomerSection draft={purchaseDraft} onChange={updatePurchaseDraft} />
        <PurchaseDraftPaymentSection draft={purchaseDraft} paymentSummary={paymentSummary} onChange={updatePurchaseDraft} />
        <PurchaseDraftOrderLinesSection
          orderLines={orderLineDrafts}
          onAdd={addOrderLine}
          onRemove={removeOrderLine}
          onDuplicate={duplicateOrderLine}
          onChange={updateOrderLine}
          onApplyProduct={applyProductToOrderLine}
          onSelectSpec={selectOrderLineSpec}
          onToggleSpecialOption={toggleOrderLineSpecialOption}
        />
      </div>
    </PageContainer>
  )
}
