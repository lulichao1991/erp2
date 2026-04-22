import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { OrderCreatePage } from '@/pages/orders/OrderCreatePage'
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage'
import { OrderListPage } from '@/pages/orders/OrderListPage'
import { ProductCreatePage } from '@/pages/products/ProductCreatePage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { ProductEditPage } from '@/pages/products/ProductEditPage'
import { ProductListPage } from '@/pages/products/ProductListPage'
import { DashboardPage } from '@/pages/DashboardPage'

export const AppRouter = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/orders" element={<OrderListPage />} />
      <Route path="/orders/new" element={<OrderCreatePage />} />
      <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/new" element={<ProductCreatePage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/products/:productId/edit" element={<ProductEditPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
)
