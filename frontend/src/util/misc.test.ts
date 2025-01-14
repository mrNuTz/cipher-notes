import {describe, it, expect} from 'vitest'
import {uuidV4WithoutCrypto} from './misc'
import {z} from 'zod'

describe('uuidV4WithoutCrypto', () => {
  it('should be a valid uuid', () => {
    const uuid = uuidV4WithoutCrypto()
    const schema = z.string().uuid()
    expect(schema.safeParse(uuid).success).toBe(true)
  })
})
