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
