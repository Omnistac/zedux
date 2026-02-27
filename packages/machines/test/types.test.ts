import { atom, StateOf } from '@zedux/atoms'
import {
  ContextOf,
  EventNamesOf,
  injectMachineSignal,
  MachineSignal,
  MachineStateShape,
  StateNamesOf,
} from '@zedux/machines'
import { expectTypeOf } from 'expect-type'
import { ecosystem } from '../../react/test/utils/ecosystem'

// -- Test fixtures --

const toggleAtom = atom('toggle', () =>
  injectMachineSignal(
    state => [state('on').on('toggle', 'off'), state('off').on('toggle', 'on')],
    { count: 0 }
  )
)

type ToggleContext = { count: number }

describe('machine type helpers', () => {
  afterEach(() => {
    ecosystem.reset()
  })

  test('ContextOf extracts context type from MachineSignal', () => {
    type WithContext = MachineSignal<'a' | 'b', 'next', { count: number }>
    type NoContext = MachineSignal<'a', 'next'>
    type UndefinedContext = MachineSignal<'a', 'next', undefined>

    expectTypeOf<ContextOf<WithContext>>().toEqualTypeOf<{ count: number }>()
    expectTypeOf<ContextOf<NoContext>>().toEqualTypeOf<undefined>()
    expectTypeOf<ContextOf<UndefinedContext>>().toEqualTypeOf<undefined>()
  })

  test('ContextOf works with inferred signal from injectMachineSignal', () => {
    const instance = ecosystem.getInstance(toggleAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'on' | 'off',
      'toggle',
      ToggleContext
    >

    expectTypeOf<ContextOf<typeof signal>>().toEqualTypeOf<ToggleContext>()
  })

  test('EventNamesOf extracts event name union from MachineSignal', () => {
    type MultiEvent = MachineSignal<'a' | 'b', 'up' | 'down' | 'reset'>
    type SingleEvent = MachineSignal<'a' | 'b', 'toggle'>

    expectTypeOf<EventNamesOf<MultiEvent>>().toEqualTypeOf<
      'up' | 'down' | 'reset'
    >()
    expectTypeOf<EventNamesOf<SingleEvent>>().toEqualTypeOf<'toggle'>()
  })

  test('EventNamesOf works with inferred signal from injectMachineSignal', () => {
    const instance = ecosystem.getInstance(toggleAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'on' | 'off',
      'toggle',
      ToggleContext
    >

    expectTypeOf<EventNamesOf<typeof signal>>().toEqualTypeOf<'toggle'>()
  })

  test('StateNamesOf extracts state name union from MachineSignal', () => {
    type MultiState = MachineSignal<'idle' | 'loading' | 'error' | 'success'>
    type SingleState = MachineSignal<'only'>

    expectTypeOf<StateNamesOf<MultiState>>().toEqualTypeOf<
      'idle' | 'loading' | 'error' | 'success'
    >()
    expectTypeOf<StateNamesOf<SingleState>>().toEqualTypeOf<'only'>()
  })

  test('StateNamesOf works with inferred signal from injectMachineSignal', () => {
    const instance = ecosystem.getInstance(toggleAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'on' | 'off',
      'toggle',
      ToggleContext
    >

    expectTypeOf<StateNamesOf<typeof signal>>().toEqualTypeOf<'on' | 'off'>()
  })

  test('StateOf from @zedux/atoms extracts full state shape from MachineSignal', () => {
    type WithContext = MachineSignal<'a' | 'b', 'next', { count: number }>
    type NoContext = MachineSignal<'a' | 'b', 'next'>

    expectTypeOf<StateOf<WithContext>>().toEqualTypeOf<
      MachineStateShape<'a' | 'b', { count: number }>
    >()

    expectTypeOf<StateOf<NoContext>>().toEqualTypeOf<
      MachineStateShape<'a' | 'b', undefined>
    >()
  })

  test('StateOf resolves to an object with value and context', () => {
    type Sig = MachineSignal<'idle' | 'running', 'start' | 'stop', { progress: number }>
    type State = StateOf<Sig>

    expectTypeOf<State>().toHaveProperty('value')
    expectTypeOf<State['value']>().toEqualTypeOf<'idle' | 'running'>()

    expectTypeOf<State>().toHaveProperty('context')
    expectTypeOf<State['context']>().toEqualTypeOf<{ progress: number }>()
  })

  test('StateOf works with inferred signal from injectMachineSignal', () => {
    const instance = ecosystem.getInstance(toggleAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'on' | 'off',
      'toggle',
      ToggleContext
    >

    expectTypeOf<StateOf<typeof signal>>().toEqualTypeOf<
      MachineStateShape<'on' | 'off', ToggleContext>
    >()
  })

  test('all helpers work together on the same signal type', () => {
    type Sig = MachineSignal<
      'idle' | 'loading' | 'done',
      'start' | 'finish' | 'reset',
      { data: string[]; error: string | null }
    >

    type Ctx = ContextOf<Sig>
    type Events = EventNamesOf<Sig>
    type Names = StateNamesOf<Sig>
    type State = StateOf<Sig>

    expectTypeOf<Ctx>().toEqualTypeOf<{ data: string[]; error: string | null }>()
    expectTypeOf<Events>().toEqualTypeOf<'start' | 'finish' | 'reset'>()
    expectTypeOf<Names>().toEqualTypeOf<'idle' | 'loading' | 'done'>()
    expectTypeOf<State>().toEqualTypeOf<
      MachineStateShape<'idle' | 'loading' | 'done', { data: string[]; error: string | null }>
    >()

    // State's value matches StateNamesOf
    expectTypeOf<State['value']>().toEqualTypeOf<Names>()

    // State's context matches ContextOf
    expectTypeOf<State['context']>().toEqualTypeOf<Ctx>()
  })

  test('helpers work with generic MachineSignal (no type params)', () => {
    type Generic = MachineSignal

    expectTypeOf<ContextOf<Generic>>().toEqualTypeOf<undefined>()
    expectTypeOf<EventNamesOf<Generic>>().toBeString()
    expectTypeOf<StateNamesOf<Generic>>().toBeString()
    expectTypeOf<StateOf<Generic>>().toEqualTypeOf<
      MachineStateShape<string, undefined>
    >()
  })

  test('MachineSignal method return types are properly typed', () => {
    type Sig = MachineSignal<'a' | 'b', 'toggle', { count: number }>

    expectTypeOf<Sig['getContext']>().returns.toEqualTypeOf<{ count: number }>()
    expectTypeOf<Sig['getValue']>().returns.toEqualTypeOf<'a' | 'b'>()
    expectTypeOf<Sig['is']>().parameter(0).toEqualTypeOf<'a' | 'b'>()
    expectTypeOf<Sig['is']>().returns.toBeBoolean()
    expectTypeOf<Sig['send']>().parameter(0).toEqualTypeOf<
      'toggle' | Partial<Record<'toggle', undefined>>
    >()
  })

  test('MachineStateShape has correct structure', () => {
    type Shape = MachineStateShape<'x' | 'y', { label: string }>

    expectTypeOf<Shape>().toHaveProperty('value')
    expectTypeOf<Shape>().toHaveProperty('context')
    expectTypeOf<Shape['value']>().toEqualTypeOf<'x' | 'y'>()
    expectTypeOf<Shape['context']>().toEqualTypeOf<{ label: string }>()
  })

  test('MachineStateShape defaults', () => {
    type DefaultShape = MachineStateShape

    expectTypeOf<DefaultShape['value']>().toBeString()
    expectTypeOf<DefaultShape['context']>().toEqualTypeOf<undefined>()
  })
})
