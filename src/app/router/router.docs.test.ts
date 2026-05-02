import { describe, expect, it } from 'vitest'
import routerSource from './index.tsx?raw'
import routesDocs from '../../../docs/frontend/routes-and-pages.md?raw'

const extractRuntimeRoutes = () =>
  [...routerSource.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path !== '*')
    .sort()

const extractDocumentedRoutes = () => {
  const routesBlock = routesDocs.match(/当前主线必须保持可访问：\s*```text\n([\s\S]*?)\n```/)

  expect(routesBlock?.[1]).toBeTruthy()

  return routesBlock![1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort()
}

describe('router documentation', () => {
  it('keeps the routes-and-pages minimum route set aligned with runtime routes', () => {
    expect(extractDocumentedRoutes()).toEqual(extractRuntimeRoutes())
  })
})
