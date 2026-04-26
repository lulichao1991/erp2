import { describe, expect, it } from 'vitest'
import { canPerformAction, canViewField, canViewRoute, normalizeRole, roleOptions } from '@/services/access/roleCapabilities'

describe('roleCapabilities', () => {
  it('normalizes old local role values into current mock roles', () => {
    expect(normalizeRole('operations')).toBe('merchandiser')
    expect(normalizeRole('management')).toBe('manager')
    expect(normalizeRole('unknown')).toBe('admin')
  })

  it('keeps factory role away from customer and finance fields', () => {
    expect(roleOptions).toContain('factory')
    expect(canViewRoute('factory', '/factory')).toBe(true)
    expect(canViewRoute('factory', '/finance')).toBe(false)
    expect(canViewField('factory', 'customer_contact')).toBe(false)
    expect(canViewField('factory', 'purchase_finance')).toBe(false)
    expect(canPerformAction('factory', 'factory_return_submit')).toBe(true)
  })

  it('exposes role-specific workbench routes', () => {
    expect(canViewRoute('finance', '/finance')).toBe(true)
    expect(canPerformAction('finance', 'finance_confirm')).toBe(true)
    expect(canPerformAction('finance', 'production_dispatch')).toBe(false)
    expect(roleOptions).toContain('warehouse')
    expect(canViewRoute('warehouse', '/inventory')).toBe(true)
    expect(canViewRoute('warehouse', '/finance')).toBe(false)
    expect(canViewField('warehouse', 'inventory_item')).toBe(true)
    expect(canPerformAction('warehouse', 'inventory_manage')).toBe(true)
    expect(canViewRoute('designer', '/design-modeling')).toBe(true)
    expect(canViewRoute('modeler', '/design-modeling')).toBe(true)
    expect(canViewRoute('merchandiser', '/production-follow-up')).toBe(true)
    expect(canViewRoute('manager', '/management')).toBe(true)
  })
})
