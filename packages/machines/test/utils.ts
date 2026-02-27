import { createEcosystem } from '@zedux/atoms'
import { MachineSignal } from '@zedux/machines'

const ecosystem = createEcosystem({ id: 'machines-test' })

export const getDoorMachine = () =>
  new MachineSignal<
    'open' | 'opening' | 'closing' | 'closed',
    'buttonPress' | 'timeout',
    { timeoutId: null | { nestedId: null | number }; other?: string }
  >(
    ecosystem,
    ecosystem.makeId('signal'),
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
  new MachineSignal(
    ecosystem,
    ecosystem.makeId('signal'),
    'a',
    {
      a: { toggle: { name: 'b' } },
      b: { toggle: { name: 'a' } },
    }
  )
