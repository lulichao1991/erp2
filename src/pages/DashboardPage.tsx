import { Link } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import { PageContainer, PageHeader, SummaryCard } from '@/components/common'

export const DashboardPage = () => (
  <PageContainer>
    <AppBreadcrumb items={[{ label: '工作台' }]} />
    <PageHeader title="工作台" subtitle="首轮前端当前只把订单中心和产品管理主链路打通，工作台先保留轻量入口。" />
    <div className="hero-placeholder">
      <h2>产品维护 → 订单引用 → 规格选择 → 自动带价</h2>
      <p>从这里可以快速进入订单中心和产品管理，演示首轮核心业务链路。</p>
      <div className="row wrap" style={{ justifyContent: 'center', marginTop: 20 }}>
        <Link to="/products" className="button primary">
          进入产品管理
        </Link>
        <Link to="/orders" className="button secondary">
          进入订单中心
        </Link>
      </div>
    </div>
    <div className="spacer-top">
      <SummaryCard title="当前交付重点">
        <div className="summary-grid three">
          <div>
            <div className="text-caption">产品侧</div>
            <div className="quote-value">规格明细 + 固定加价规则</div>
          </div>
          <div>
            <div className="text-caption">订单侧</div>
            <div className="quote-value">来源产品引用 + 来源抽屉</div>
          </div>
          <div>
            <div className="text-caption">演示侧</div>
            <div className="quote-value">戒指与吊坠自动报价</div>
          </div>
        </div>
      </SummaryCard>
    </div>
  </PageContainer>
)
