import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import {
  buildOrderLineStatusPatch,
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus,
  getOrderLineLineStatusLabel,
  getOrderLineProductionStatus,
  getOrderLineTaskGroups
} from '@/services/orderLine/orderLineWorkflow'

describe('orderLineWorkflow', () => {
  it('uses current lineStatus before legacy status', () => {
    const line = {
      ...orderLinesMock[1],
      status: 'pending_shipment',
      lineStatus: 'pending_finance_confirmation'
    }

    expect(getOrderLineLineStatus(line)).toBe('pending_finance_confirmation')
    expect(getOrderLineLineStatusLabel(getOrderLineLineStatus(line))).toBe('待财务确认')
    expect(getOrderLineFinanceStatus(line)).toBe('pending')
  })

  it('derives production and factory workflow status from current fields', () => {
    const producingLine = orderLinesMock.find((line) => line.id === 'oi-ring-001')
    const returnedLine = orderLinesMock.find((line) => line.id === 'oi-pendant-001')

    expect(producingLine).toBeTruthy()
    expect(returnedLine).toBeTruthy()
    expect(getOrderLineProductionStatus(producingLine!)).toBe('in_production')
    expect(getOrderLineFactoryStatus(producingLine!)).toBe('in_production')
    expect(getOrderLineProductionStatus(returnedLine!)).toBe('completed')
    expect(getOrderLineFactoryStatus(returnedLine!)).toBe('returned')
  })

  it('builds OrderLine task groups from lineStatus', () => {
    const groups = getOrderLineTaskGroups(orderLinesMock)

    expect(groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'pending_design', label: '待设计', count: 1 }),
        expect.objectContaining({ value: 'pending_modeling', label: '待建模', count: 1 }),
        expect.objectContaining({ value: 'in_production', label: '生产中', count: 1 }),
        expect.objectContaining({ value: 'pending_finance_confirmation', label: '待财务确认', count: 1 })
      ])
    )
  })

  it('keeps legacy status synchronized for short-term page compatibility', () => {
    expect(buildOrderLineStatusPatch('ready_to_ship')).toEqual({
      lineStatus: 'ready_to_ship',
      status: 'pending_shipment'
    })
  })
})
