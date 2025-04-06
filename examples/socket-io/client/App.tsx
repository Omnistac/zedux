import { createEcosystem, Ecosystem, EcosystemProvider } from '@zedux/react'
import { useMemo } from 'react'
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
      <SimpleUnaryRequest />
    </EcosystemProvider>
  )
}

export default App
