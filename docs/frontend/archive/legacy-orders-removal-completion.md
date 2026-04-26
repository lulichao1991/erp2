# Legacy /orders Removal Completion

> 归档说明：本文只记录 legacy `/orders` 删除完成历史。当前路由与页面口径以 `docs/frontend/routes-and-pages.md` 为准。

This document records the completed removal of the legacy `/orders` module.

## Final Status

- `/orders`, `/orders/new`, and `/orders/:orderId` route entries have been removed.
- `src/pages/orders/*` has been removed.
- `src/components/business/order/*` and the old bridge components have been removed.
- `src/services/order/*` has been removed.
- `src/mocks/orders.ts` and `src/types/order.ts` have been removed.
- `useAppData.orders`, `updateOrderItem`, `createTaskFromOrder`, and the legacy orders timeline helpers have been removed.
- legacy `/orders` smoke tests have been removed.

## Current Workflow

The active workflow is now fully based on:

- `Customer`
- `Purchase`
- `OrderLine`
- `Product`

Current route guardrails cover:

- `/purchases`
- `/purchases/new`
- `/purchases/o-202604-001`
- `/order-lines`
- `/customers`
- `/customers/customer-zhang-001`
- `/tasks`
- `/production-plan`
- `/production-plan/task-factory-001`

## Migration Results

- productionPlan no longer imports legacy `Order` / `OrderItem`.
- productionPlan no longer reads legacy orders input.
- productionPlan writes production feedback through current `OrderLine.productionInfo`.
- task timeline writes append to current `Purchase.timeline`.
- task timeline no longer mirrors updates into legacy `orders.timeline`.
- customer aggregation reads current `purchases + orderLines + afterSalesCases`.

## Historical References

Historical docs may still mention `/orders`, `Order`, `OrderItem`, `mockOrders`, or `updateOrderItem` when describing earlier phases. Those references are archival only and do not describe active runtime behavior.

## Rollback

If the old compatibility module is needed for investigation, use git history before the legacy removal PR. Do not recreate `/orders` in new code paths.
