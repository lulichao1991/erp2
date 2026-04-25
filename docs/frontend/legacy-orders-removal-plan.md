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
