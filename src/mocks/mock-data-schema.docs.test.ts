import { describe, expect, it } from 'vitest'
import mockDataSchemaDocs from '../../docs/frontend/mock-data-schema.md?raw'

const mockFileModules = import.meta.glob('./*.ts', {
  eager: true,
  import: 'default',
  query: '?raw'
})

const extractRuntimeMockFiles = () =>
  Object.keys(mockFileModules)
    .map((path) => path.replace('./', ''))
    .filter((file) => file !== 'index.ts' && !file.endsWith('.test.ts'))
    .sort()

const extractDocumentedMockFiles = () => {
  const mockFilesBlock = mockDataSchemaDocs.match(/## 15\. 当前 mock 文件建议[\s\S]*?```text\nsrc\/mocks\/\n([\s\S]*?)\n```/)

  expect(mockFilesBlock?.[1]).toBeTruthy()

  return mockFilesBlock![1]
    .split('\n')
    .map((line) => line.trim().replace(/\s+#.*$/, ''))
    .filter(Boolean)
    .sort()
}

describe('mock data schema documentation', () => {
  it('keeps the documented mock data files aligned with src/mocks', () => {
    expect(extractDocumentedMockFiles()).toEqual(extractRuntimeMockFiles())
  })
})
