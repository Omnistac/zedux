import { createMachine, createActor, states } from '@zedux/core/index'

const advance = createActor('advance')
const advance2 = createActor('advance2')
const doNothing = createActor('doNothing')
const [a, b, c] = states('a', 'b', 'c')

const cycleMachine = createMachine(
  a.on(advance, b),
  b.on(advance, c),
  c.on(advance, a)
)

describe('machines', () => {
  test('the first state is the initial state of the machine', () => {
    const machine = createMachine(a, b)

    expect(machine(undefined, advance())).toBe(a.type)
  })

  test('transitions to a valid next state', () => {
    expect(cycleMachine(a.type, advance())).toBe(b.type)
    expect(cycleMachine(b.type, advance())).toBe(c.type)
    expect(cycleMachine(c.type, advance())).toBe(a.type)
  })

  test('does not transition on irrelevant actions', () => {
    expect(cycleMachine(undefined, doNothing())).toBe(a.type)
    expect(cycleMachine(a.type, doNothing())).toBe(a.type)
  })

  test('the same state can be passed multiple times', () => {
    const machine = createMachine(a.on(advance, b), a.on(advance2, c))

    expect(machine(a.type, advance())).toBe(b.type)
    expect(machine(a.type, advance2())).toBe(c.type)
  })

  test('raw objects can be passed', () => {
    const machine = createMachine(
      { type: 'a', transitions: { [advance.type]: 'b' } },
      { type: 'b', transitions: { [advance.type]: 'c' } }
    )

    expect(machine('a', advance())).toBe('b')
    expect(machine('b', advance())).toBe('c')
  })
})
