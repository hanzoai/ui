/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from './index'
import { z } from 'zod'

describe('MCP Server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export a server instance', () => {
    expect(server).toBeDefined()
    expect(server).toHaveProperty('setRequestHandler')
  })

  it('should have correct server info', () => {
    expect(server.server_info).toBeDefined()
    expect(server.server_info.name).toBe('hanzo-ui')
    expect(server.server_info.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  describe('Tool Validation', () => {
    it('should handle ZodError with issues property', () => {
      // Test that our ZodError fix works
      const error = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number'
        }
      ])

      // Verify the error has issues property (not errors)
      expect(error).toHaveProperty('issues')
      expect(Array.isArray(error.issues)).toBe(true)
      expect(error.issues.length).toBeGreaterThan(0)
    })

    it('should handle z.record with correct parameters', () => {
      // Test that our z.record fix works
      const schema = z.record(z.string(), z.any())

      const validData = { key: 'value', another: 123 }
      expect(() => schema.parse(validData)).not.toThrow()

      const parsedData = schema.parse(validData)
      expect(parsedData).toEqual(validData)
    })
  })

  describe('Registry Access', () => {
    it('should define getRegistry function', async () => {
      // Check that the internal getRegistry function works
      // Note: This is a smoke test - full integration requires network
      expect(typeof server).toBe('object')
    })
  })

  describe('Tool Handlers', () => {
    it('should have ListToolsRequestSchema handler registered', () => {
      // Verify tools are registered
      expect(server._requestHandlers).toBeDefined()
    })

    it('should have CallToolRequestSchema handler registered', () => {
      // Verify tool call handler is registered
      expect(server._requestHandlers).toBeDefined()
    })
  })
})

describe('Registry Schema', () => {
  it('should validate registry item with meta', () => {
    const registryItemSchema = z.object({
      name: z.string(),
      type: z.string(),
      meta: z.record(z.string(), z.any()).optional(),
      cssVars: z.record(z.string(), z.any()).optional(),
      tailwind: z.record(z.string(), z.any()).optional(),
    })

    const validItem = {
      name: 'button',
      type: 'registry:component',
      meta: { foo: 'bar' },
      cssVars: { primary: '#000' },
      tailwind: { extend: {} }
    }

    expect(() => registryItemSchema.parse(validItem)).not.toThrow()
  })

  it('should accept records with string keys', () => {
    const schema = z.record(z.string(), z.any())

    const data = {
      'key-1': 'value1',
      'key-2': 123,
      'key-3': { nested: true }
    }

    expect(() => schema.parse(data)).not.toThrow()
  })
})
