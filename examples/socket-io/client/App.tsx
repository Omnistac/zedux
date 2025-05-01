import { createEcosystem, Ecosystem, EcosystemProvider } from '@zedux/react'
import { useMemo } from 'react'
import { SimpleBidiStream } from './components/SimpleBidiStream/SimpleBidiStream'
import { SimpleUnaryRequest } from './components/SimpleUnaryRequest'

function App() {
  const ecosystem = useMemo(() => {
    const newEcosystem = createEcosystem()

    // NOTE: atoms can be preloaded here via `newEcosystem.getNode(myAtom)`

    return newEcosystem
  }, [])

  // attach the ecosystem to the window for debugging
  if (import.meta.env.DEV) {
    ;(globalThis as unknown as { ecosystem: Ecosystem }).ecosystem = ecosystem
  }

  return (
    <EcosystemProvider ecosystem={ecosystem}>
      <div className="flex flex-col gap-6 p-2">
        <SimpleUnaryRequest />
        <SimpleBidiStream />
      </div>
    </EcosystemProvider>
  )
}

export default App
