import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { OrderCreatePage } from '@/pages/orders/OrderCreatePage'
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage'
import { OrderListPage } from '@/pages/orders/OrderListPage'
import { OrderLineListPage } from '@/pages/orderLines/OrderLineListPage'
import { ProductCreatePage } from '@/pages/products/ProductCreatePage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { ProductEditPage } from '@/pages/products/ProductEditPage'
import { ProductListPage } from '@/pages/products/ProductListPage'
import { PurchaseCreatePage } from '@/pages/purchases/PurchaseCreatePage'
import { PurchaseDetailPage } from '@/pages/purchases/PurchaseDetailPage'
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage'
import { CustomerListPage } from '@/pages/customers/CustomerListPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TaskDetailPage } from '@/pages/tasks/TaskDetailPage'
import { TaskListPage } from '@/pages/tasks/TaskListPage'
import { ProductionPlanDetailPage } from '@/pages/productionPlan/ProductionPlanDetailPage'
import { ProductionPlanListPage } from '@/pages/productionPlan/ProductionPlanListPage'

export const AppRouter = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/order-lines" element={<OrderLineListPage />} />
      <Route path="/purchases/new" element={<PurchaseCreatePage />} />
      <Route path="/purchases/:purchaseId" element={<PurchaseDetailPage />} />
      <Route path="/customers" element={<CustomerListPage />} />
      <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
      <Route path="/orders" element={<OrderListPage />} />
      <Route path="/orders/new" element={<OrderCreatePage />} />
      <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      <Route path="/tasks" element={<TaskListPage />} />
      <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      <Route path="/production-plan" element={<ProductionPlanListPage />} />
      <Route path="/production-plan/:taskId" element={<ProductionPlanDetailPage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/new" element={<ProductCreatePage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/products/:productId/edit" element={<ProductEditPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
)
