import { Selector } from '../types'
import { assertAreFunctions } from '../utils/errors'
import { createMemoizedSelector } from '../utils/memoize'

/**
  A factory for creating ZeduxSelector objects

  @template State The state shape consumed by this selector
  @template Derivation The derivation of the input state that this selector produces

  @param inputSelectors The input selectors
  @param calculator The calculator function that will receive as input
    the result of all the input selectors and return the derived
    state. This calculator function can contain heavy computations that
    will only be performed again when absolutely necessary.

  @returns A memoized Selector
*/
export const createSelector: {
  <State = any, Derivation = any>(
    calculator: (state: State) => Derivation
  ): Selector<State, Derivation>

  <State = any, Derivation = any, Input = any>(
    inputSelector: Selector<State, Input>,
    calculator: (input: Input) => Derivation
  ): Selector<State, Derivation>

  <State = any, Derivation = any, Input1 = any, Input2 = any>(
    inputSelector1: Selector<State, Input1>,
    inputSelector2: Selector<State, Input2>,
    calculator: (input1: Input1, input2: Input2) => Derivation
  ): Selector<State, Derivation>

  <State = any, Derivation = any, Input1 = any, Input2 = any, Input3 = any>(
    inputSelector1: Selector<State, Input1>,
    inputSelector2: Selector<State, Input2>,
    inputSelector3: Selector<State, Input3>,
    calculator: (input1: Input1, input2: Input2, input3: Input3) => Derivation
  ): Selector<State, Derivation>

  <
    State = any,
    Derivation = any,
    Input1 = any,
    Input2 = any,
    Input3 = any,
    Input4 = any
  >(
    inputSelector1: Selector<State, Input1>,
    inputSelector2: Selector<State, Input2>,
    inputSelector3: Selector<State, Input3>,
    inputSelector4: Selector<State, Input4>,
    calculator: (
      input1: Input1,
      input2: Input2,
      input3: Input3,
      input4: Input4
    ) => Derivation
  ): Selector<State, Derivation>

  <
    State = any,
    Derivation = any,
    Input1 = any,
    Input2 = any,
    Input3 = any,
    Input4 = any,
    Input5 = any
  >(
    inputSelector1: Selector<State, Input1>,
    inputSelector2: Selector<State, Input2>,
    inputSelector3: Selector<State, Input3>,
    inputSelector4: Selector<State, Input4>,
    inputSelector5: Selector<State, Input5>,
    calculator: (
      input1: Input1,
      input2: Input2,
      input3: Input3,
      input4: Input4,
      input5: Input5
    ) => Derivation
  ): Selector<State, Derivation>

  <
    State = any,
    Derivation = any,
    Input1 = any,
    Input2 = any,
    Input3 = any,
    Input4 = any,
    Input5 = any,
    Input6 = any
  >(
    inputSelector1: Selector<State, Input1>,
    inputSelector2: Selector<State, Input2>,
    inputSelector3: Selector<State, Input3>,
    inputSelector4: Selector<State, Input4>,
    inputSelector5: Selector<State, Input5>,
    inputSelector6: Selector<State, Input5>,
    calculator: (
      input1: Input1,
      input2: Input2,
      input3: Input3,
      input4: Input4,
      input5: Input5,
      input6: Input6
    ) => Derivation
  ): Selector<State, Derivation>
} = (...args: any[]) => {
  assertAreFunctions(args, 'select()')

  const calculator = args[args.length - 1]
  const dependencies = args.slice(0, -1)

  return createMemoizedSelector(calculator, dependencies)
}
