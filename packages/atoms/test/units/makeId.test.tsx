import { atom, createEcosystem, Ecosystem, ZeduxNode } from '@zedux/atoms'

/**
 * unit test the Ecosystem's `makeId` function property since we replace it for
 * all integration tests due to its randomness
 */
describe('makeId', () => {
  test('.makeId() generates a random id using the prefix', () => {
    const ecosystem = new Ecosystem({})

    expect(ecosystem.makeId('atom', 'anything')).toMatch(/^anything$/)
    expect(ecosystem.makeId('signal')).toMatch(/^@signal\(\)-2$/)
  })

  test('custom ids', () => {
    const ecosystem = createEcosystem({
      makeId: function makeId(nodeType, context, suffix) {
        const prefix = nodeType === 'selector' ? '@@selector-' : ''

        const content =
          nodeType === 'component' && context === 'unknown'
            ? 'rc'
            : nodeType === 'listener'
            ? 'no'
            : nodeType === 'selector' && context === 'unknown'
            ? 'unnamed'
            : (context as ZeduxNode)?.id ?? context ?? ''

        const uniqueId =
          suffix === ''
            ? ''
            : suffix
            ? `-${suffix}`
            : `-${++this.idCounter}${Math.random().toString(36).slice(2, 8)}`

        return `${prefix}${content}${uniqueId}`
      },
    })

    expect(ecosystem.getNode(() => {}).id).toMatch(/^@@selector-unnamed-1/)
    expect(ecosystem.getNode(atom('1', 1)).id).toMatch(/^1$/)
    expect(ecosystem.makeId('component', 'Test', ':r1:')).toBe('Test-:r1:')
    expect(ecosystem.makeId('component', 'unknown', ':r1:')).toBe('rc-:r1:')
    expect(ecosystem.makeId('listener', '1')).toMatch(/^no-/)
  })
})
