import { IdGenerator } from '@zedux/react/classes/IdGenerator'

/**
 * unit test the IdGenerator's `generateId` method since we remove it for all
 * integration tests due to its randomness
 */
describe('IdGenerator', () => {
  test('.generateId() generates a random id using the prefix', () => {
    const generator = new IdGenerator()

    expect(generator.generateId('a')).toMatch(/^a-1[a-zA-Z0-9]{12}$/)
    expect(generator.generateId('bb')).toMatch(/^bb-2[a-zA-Z0-9]{12}$/)
  })
})
