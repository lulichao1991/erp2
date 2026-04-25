# Legacy /orders Removal Preparation

## 1. Purpose

This document tracks the preparation work for eventually hiding or deleting the legacy `/orders` module.

Current rule:

- `Purchase + OrderLine` is the current mainline.
- `/orders`, `/orders/new`, and `/orders/:orderId` remain compatibility routes.
- Do not delete legacy `/orders` files until the migration checkpoints below are complete.

## 2. Phase 8: Legacy Route Smoke Tests

Current legacy route smoke coverage lives in `src/app/router/router.smoke.test.tsx`.

### Keep Until Legacy Routes Are Removed

These tests protect the compatibility routes and should stay while `/orders` is still reachable:

- `/orders/o-202604-001`
  - expands and collapses legacy item blocks
  - renders engraving fields and uploaded engraving files
  - renders source product drawer from query params
  - renders business stage stepper
  - renders customer, delivery, finance, and role-specific legacy detail views
  - supports legacy order status advancement and suggested task creation
- `/orders/new`
  - renders legacy helper form controls and finance fields
- `/orders/o-202604-001?modal=product-picker&itemId=oi-ring-001`
  - renders legacy product picker compatibility
- `/orders/o-202604-001?drawer=source-product&itemId=oi-ring-001`
  - renders legacy source product drawer compatibility

### Keep As Mainline Guardrails

These tests are not legacy feature coverage. They confirm current pages do not link back to `/orders`:

- task list and task detail assert no `a[href^="/orders"]`
- production plan list and detail assert no `a[href^="/orders"]`
- product reference records assert links go to `/order-lines` and `/purchases/:purchaseId`

These should remain even after `/orders` deletion, updated only if route semantics change.

### Migrate Before Deletion

Before deleting `/orders`, the following legacy behaviors need current-mainline replacements or explicit retirement decisions:

- product picker compatibility on old order pages
- source product drawer query compatibility
- engraving file display and upload coverage
- role-specific legacy order detail views
- legacy order status advancement and suggested task creation

### Deletion Gate For Route Tests

The `/orders` route tests can be removed only when all are true:

- `/orders`, `/orders/new`, and `/orders/:orderId` are intentionally removed or redirected.
- current smoke tests cover equivalent Purchase + OrderLine behavior where the behavior is still needed.
- docs no longer list `/orders` as a reachable compatibility route.
- `npm test -- --reporter=default` passes after removing the legacy route tests.

## 3. Phase 9: productionPlan Fallback Migration Plan

Current productionPlan state:

- list and detail pages pass `tasks + purchases + orderLines + orders + products` into the adapter
- adapter resolves current `Purchase + OrderLine` first
- legacy `orders / order.items` remains fallback
- detail writes production feedback through `updateOrderLineProductionInfo` first, then falls back to `updateOrderItem`
- tests intentionally cover both current-first behavior and legacy fallback behavior

### Keep For Now

Keep these compatibility points until legacy `/orders` removal is explicitly approved:

- `orders?: Order[]` adapter inputs
- `Order / OrderItem` compatible detail fields used by productionPlan components
- legacy fallback tests that prove old `orders / order.items` still work
- `updateOrderItem` fallback in production plan detail

### Migration Steps

1. Add current-only productionPlan tests that pass no `orders` input and cover list, detail, file groups, timeline, and status actions.
2. Make productionPlan pages stop passing `appData.orders` once current-only coverage is strong enough.
3. Keep adapter fallback internally for one transition PR, but mark direct page-level `orders` input as deprecated.
4. Remove `updateOrderItem` fallback only after detail page tests prove `updateOrderLineProductionInfo` covers every reachable current task.
5. Remove adapter `Order / OrderItem` output compatibility only after productionPlan components stop accepting compatible legacy fields.

### Deletion Gate For productionPlan Fallback

Legacy productionPlan fallback can be removed only when all are true:

- every `factory_production` task in current mocks has `purchaseId` and `orderLineId`
- productionPlan list and detail work without `orders`
- status actions update `OrderLine.productionInfo` only
- current route smoke still asserts no links to `/orders`
- legacy fallback tests are either migrated to current-mainline tests or intentionally deleted with `/orders`

## 4. Phase 10: useAppData Legacy Orders API Replacement Plan

Current `useAppData` state:

- current state: `products`, `purchases`, `orderLines`, `tasks`
- legacy compatibility state: `orders`
- current helper APIs: `getPurchase`, `getOrderLine`, `updateOrderLineProductionInfo`, `updateTask`
- legacy APIs: `getOrder`, `getTasksByOrder`, `saveOrder`, `updateOrder`, `transitionOrderStatus`, `updateOrderItem`, `removeOrderItem`, `createTaskFromOrder`

### Current Call Sites

Legacy API usage is currently limited to:

- `src/pages/orders/*`
  - full legacy compatibility page flow
  - can be removed only with `/orders`
- `src/pages/productionPlan/*`
  - passes `appData.orders` as adapter fallback
  - uses `updateOrderItem` only after `updateOrderLineProductionInfo` fails
- `useAppData.updateTask`
  - updates current `tasks`
  - mirrors a timeline record into legacy `orders` for old route visibility

### Replacement Direction

Replace legacy APIs in this order:

1. Keep current-mainline reads on `purchases`, `orderLines`, and `tasks`.
2. Move any remaining productionPlan fallback reads behind adapter tests, then stop passing `appData.orders` from productionPlan pages.
3. Add current task timeline or order-line log support before removing the `updateTask` legacy order timeline mirror.
4. Remove `/orders` page call sites last, together with the legacy route deletion.
5. Only then remove `orders` state and legacy API fields from `AppDataContextValue`.

### API Removal Gate

Legacy `useAppData` orders APIs can be removed only when all are true:

- no page outside `src/pages/orders/*` reads `appData.orders`
- no current page calls `getOrder`, `saveOrder`, `updateOrder`, `transitionOrderStatus`, `updateOrderItem`, or `removeOrderItem`
- productionPlan no longer needs `orders` input or `updateOrderItem` fallback
- task updates have a current-mainline timeline/log destination
- `/orders` route tests have been removed or replaced by current-mainline tests
