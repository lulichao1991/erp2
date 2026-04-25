# Legacy /orders Removal Preparation

## 1. Purpose

This document tracks the preparation work for eventually hiding or deleting the legacy `/orders` module.

Current rule:

- `Purchase + OrderLine` is the current mainline.
- `/orders`, `/orders/new`, and `/orders/:orderId` remain compatibility routes.
- visible legacy `/orders` pages should identify themselves as compatibility entries.
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

- list and detail pages now pass only `tasks + purchases + orderLines + products` into the adapter
- adapter resolves production plan rows and details only from current `Purchase + OrderLine + Product` data
- legacy `orders / order.items` read fallback has been removed from the productionPlan adapter
- detail writes production feedback through `updateOrderLineProductionInfo` only
- tests intentionally cover current-only behavior without legacy `orders` input
- route smoke confirms productionPlan list and detail do not link back to `/orders`

### Keep For Now

Keep these compatibility points until legacy `/orders` removal is explicitly approved:

- the legacy `/orders` routes, pages, mocks, types, and services
- `useAppData.orders/updateOrderItem` for old `/orders` pages
- the `OrderItem`-compatible detail shape used by productionPlan UI, currently built from current `OrderLine` data

### Migration Steps

Completed:

1. Added current-only productionPlan tests that pass no `orders` input.
2. Made productionPlan pages stop passing `appData.orders`.
3. Removed the productionPlan detail `updateOrderItem` write fallback.
4. Removed productionPlan adapter legacy `orders / order.items` read fallback.

Remaining:

1. Keep the old `/orders` compatibility pages and legacy `useAppData` APIs until route deletion is explicitly approved.
2. Remove adapter `OrderItem` output compatibility only after productionPlan components stop accepting compatible legacy-shaped fields.

### Deletion Gate For productionPlan Fallback

Legacy productionPlan fallback can be removed only when all are true:

- every `factory_production` task in current mocks has `purchaseId` and `orderLineId`
- productionPlan list and detail work without `orders`
- status actions update `OrderLine.productionInfo` only
- current route smoke still asserts no links to `/orders`
- legacy fallback tests are migrated to current-mainline tests or intentionally deleted with `/orders`

Current result: these gates are now satisfied for productionPlan read/write fallback. productionPlan remains current-only while legacy `/orders` itself stays reachable.

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
  - no longer passes `appData.orders`
  - writes production feedback only through `updateOrderLineProductionInfo`
- `useAppData.updateTask`
  - updates current `tasks`
  - appends task timeline records to current `Purchase.timeline`
  - no longer mirrors current task updates into legacy `orders.timeline`

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
- productionPlan pages no longer pass `orders` input and no longer use `updateOrderItem` fallback
- task updates have a current-mainline timeline/log destination
- `/orders` route tests have been removed or replaced by current-mainline tests

## 4.1 Task Timeline Dependency Audit

Current task page state:

- `src/pages/tasks/*` reads current `tasks`, `purchases`, and `orderLines`.
- task list and detail do not read `appData.orders`.
- task pages do not call `updateOrderItem`.
- task detail filters current `Purchase.timeline` by `relatedTaskId` and `relatedOrderLineId`.
- task detail links to `/order-lines` and `/purchases/:purchaseId`, not `/orders`.

Resolved migration:

- `useAppData.updateTask` now updates current `tasks` and appends records to current `Purchase.timeline`.
- current task updates no longer write to legacy `orders.timeline`.

Remaining compatibility:

1. Keep `createTaskFromOrder` for legacy `/orders` compatibility until the old route is retired.
2. Keep `useAppData.orders` and `updateOrderItem` APIs until `/orders` compatibility is removed in a later approved PR.

## 5. Phase 12: Deletion Decision Checklist

Do not delete legacy `/orders` until this checklist is complete.

### Ready To Hide From Users

Legacy `/orders` can be hidden or redirected when:

- no current navigation links to `/orders`
- all current workflows use `/order-lines`, `/purchases/new`, `/purchases/:purchaseId`, `/products`, or `/customers`
- productionPlan, task, product reference, customer center, and dashboard smoke tests assert no `/orders` links
- route docs describe `/orders` only as compatibility or removal candidate

Before that hide/delete decision, legacy `/orders` pages should remain reachable but clearly labeled as compatibility entry points.

### Ready To Delete Route Files

`src/pages/orders/*` can be deleted only when:

- `/orders`, `/orders/new`, and `/orders/:orderId` are removed from the router or replaced by explicit redirects
- all `/orders` route smoke tests are removed or migrated to current-mainline tests
- there is no product picker, source product drawer, engraving upload, role view, finance view, or status action behavior that still exists only on legacy pages

### Ready To Delete Legacy Types, Mocks, And Services

`src/types/order.ts`, `src/mocks/orders.ts`, and `src/services/order/*` can be deleted only when:

- no production code imports `Order`, `OrderItem`, or `SourceProductSnapshot`
- no current tests import `mockOrders`
- productionPlan no longer imports `Order / OrderItem`
- `useAppData` no longer exposes `orders` or legacy orders APIs
- `src/mocks/index.ts` no longer exports `mockOrders`

### Current Decision

Current decision: **do not delete legacy `/orders` yet**.

Reason:

- compatibility routes are still intentionally reachable
- route smoke tests still protect old demo behavior
- `useAppData.orders` and legacy order APIs still support old `/orders` compatibility pages
- `src/pages/orders/*`, `src/components/business/order/*`, `src/services/order/*`, `src/mocks/orders.ts`, and `src/types/order.ts` are still retained as the compatibility boundary

Next safe implementation step:

1. keep legacy route tests until the route itself is hidden or redirected
2. audit remaining legacy imports outside `src/pages/orders/*` and compatibility tests
3. remove `useAppData.orders` only after old `/orders` route deletion is approved

## 6. Final Guardrails After productionPlan Read Fallback Removal

Current remaining legacy orders references are expected only in these compatibility zones:

- `/orders`, `/orders/new`, and `/orders/:orderId` router entries
- `src/pages/orders/*`
- `src/components/business/order/*`
- `src/services/order/*`
- `src/mocks/orders.ts`
- `src/types/order.ts`
- `useAppData.orders`, `useAppData.updateOrderItem`, and old `/orders` helper APIs
- route smoke tests that explicitly protect legacy `/orders` compatibility

Current workflow guardrails:

- productionPlan views are generated from `tasks + purchases + orderLines + products`
- task timeline writes go to current `Purchase.timeline`
- current workflow routes must not link to `/orders`
- legacy `/orders/o-202604-001` must remain reachable until a later approved deletion PR
