import { MachineStore } from '@zedux/machines'

export const getDoorMachine = () =>
  new MachineStore<
    'open' | 'opening' | 'closing' | 'closed',
    'buttonPress' | 'timeout',
    { timeoutId: null | { nestedId: null | number }; other?: string }
  >(
    'open',
    {
      open: { buttonPress: { name: 'closing' } },
      opening: { buttonPress: { name: 'closing' }, timeout: { name: 'open' } },
      closing: {
        buttonPress: { name: 'opening' },
        timeout: { name: 'closed' },
      },
      closed: { buttonPress: { name: 'opening' } },
    } as any,
    { timeoutId: null }
  )

export const getToggleMachine = () =>
  new MachineStore('a', {
    a: { toggle: { name: 'b' } },
    b: { toggle: { name: 'a' } },
  })
