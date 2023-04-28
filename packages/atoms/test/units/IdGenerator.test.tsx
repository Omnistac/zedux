import { IdGenerator } from '@zedux/atoms/classes/IdGenerator'

/**
 * unit test the IdGenerator's `generateId` method since we remove it for all
 * integration tests due to its randomness
 */
describe('IdGenerator', () => {
  test('.generateId() generates a random id using the prefix', () => {
    const generator = new IdGenerator()

    expect(generator.generateId('a')).toMatch(/^a-1[a-z0-9]{6}$/)
    expect(generator.generateId('bb')).toMatch(/^bb-2[a-z0-9]{6}$/)
  })
})
