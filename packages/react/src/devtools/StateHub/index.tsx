import { AtomInstanceType, EcosystemProvider, useEcosystem } from '@zedux/react'
import React, { useEffect } from 'react'
import { render } from 'react-dom'
import { stateHub } from './atoms/stateHub'
import { Header } from './components/Header'
import { Main } from './components/Main'
import { Position } from './components/Position'
import { Sidebar } from './components/Sidebar'
import { Theme } from './components/Theme'
import { getStateHubEcosystem } from './stateHubEcosystem'

const App = () => {
  return (
    <EcosystemProvider ecosystem={getStateHubEcosystem()}>
      <Theme>
        <Position>
          <Sidebar />
          <Header />
          <Main />
        </Position>
      </Theme>
    </EcosystemProvider>
  )
}

/**
 * Get the stateHub settings atom instance. You can use this instance to open or
 * close the StateHub and configure its state programmatically in your app. You
 * should also use this to manually register the StateHub plugin in your
 * ecosystem if you configure the ecosystem onReady
 *
 * This atom instance lives in the StateHub ecosystem, so don't pass the
 * instance to any hooks, injectors, or AtomGetters in your own ecosystem.
 *
 * In prod this will return undefined so check that it exists before using:
 *
 * ```ts
 * import { getStateHub } from '@zedux/react/devtools'
 *
 * getStateHub()?.exports.setRoute('Dashboard')
 * ```
 */
export const getStateHub = (): AtomInstanceType<typeof stateHub> | undefined =>
  getStateHubEcosystem().getInstance(stateHub)

/**
 * The StateHub component. The actual StateHub lives in its own React app.
 * Unmounting this component won't unmount the StateHub. It is only created once
 * - rendering multiple StateHubs in your app(s) will have no effect.
 *
 * The StateHub ecosystem registers its plugin in all ecosystems when it loads.
 * This means you can render the <StateHub /> as the very first thing in an
 * <EcosystemProvider> to make it capture everything that happens in the
 * ecosystem.
 *
 * Caveat! The StateHub plugin can't capture everything if you load atoms in
 * your ecosystem before passing it to <EcosystemProvider> or in
 * <EcosystemProvider>'s onReady prop. In these cases, you need to register the
 * StateHub plugin manually. You can trigger this by getting the stateHub
 * settings atom instance:
 *
 * ```ts
 * import { getStateHub } from '@zedux/react/devtools'
 *
 * const stateHubSettingsInstance = getStateHub() // registers StateHub plugin
 * // then preload your atoms here
 * ```
 */
export const StateHub = ({ defaultIsOpen }: { defaultIsOpen?: boolean }) => {
  const parentEcosystem = useEcosystem()

  // create the ecosystem during render (:O) if it hasn't been created yet
  const ecosystem = getStateHubEcosystem()

  useEffect(() => {
    if (document.querySelector('[data-zedux="StateHub"]')) return

    const stateHubInstance = ecosystem.getInstance(stateHub)

    if (stateHubInstance.store.getState().ecosystemId === 'global') {
      // make the StateHub open by default to the parent ecosystem
      stateHubInstance.store.setState(state => ({
        ...state,
        ecosystemId: parentEcosystem.ecosystemId,
        isOpen: stateHubInstance.exports.wereSettingsSaved
          ? state.isOpen
          : !!defaultIsOpen,
      }))
    }

    const host = document.createElement('div')
    host.dataset.zedux = 'StateHub'
    document.body.insertBefore(host, document.body.firstElementChild)
    const root = host.attachShadow({ mode: 'open' })

    render(<App />, root)
  }, [])

  return null
}
