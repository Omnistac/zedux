import React from 'react'
import { Button, Wrapper, ZenText } from './styles'
import {
  api,
  atom,
  createActor,
  createMachine,
  createReducer,
  createStore,
  injectEffect,
  injectStore,
  states,
  when,
} from '@zedux/react'
import * as Zedux from '@zedux/react'
import * as Rx from 'rxjs'
import * as RxOperators from 'rxjs/operators'
;(window as any).Zedux = Zedux
;(window as any).Rx = Rx
;(window as any).RxOperators = RxOperators

const startRequest = createActor('startRequest')
const success = createActor<string, 'success'>('success')
const failure = createActor<Error, 'failure'>('failure')
const timer = createActor('timer')

const zenReducer = createReducer('')
  .reduce(startRequest, () => '')
  .reduce(success, (state, text) => text)

const [
  idle,
  requesting,
  delay,
  delay2,
  delay3,
  delay4,
  successState,
  failureState,
] = states(
  'idle',
  'requesting',
  'delay',
  'delay2',
  'delay3',
  'delay4',
  'success',
  'failure'
)

const requestMachine = createMachine(
  idle.on(startRequest, requesting),
  requesting.on(success, delay).on(failure, failureState),
  delay.on(timer, delay2),
  delay2.on(timer, delay3),
  delay3.on(timer, delay4),
  delay4.on(timer, successState),
  successState.on(startRequest, requesting),
  failureState.on(startRequest, requesting)
)

const zenAtom = atom('zen', () => {
  const store = injectStore(() =>
    createStore({ zen: zenReducer, requestState: requestMachine })
  )

  injectEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const { subscription } = when(store)
      .machine(state => state.requestState)
      .enters(requesting, async () => {
        try {
          const response = await fetch('https://api.github.com/zen')
          store.dispatch(success(await response.text()))
        } catch (err) {
          store.dispatch(failure(err))
        }
      })
      .enters(delay, () => {
        timeoutId = setTimeout(() => store.dispatch(timer()), 500)
      })
      .enters(delay2, () => {
        timeoutId = setTimeout(() => store.dispatch(timer()), 1500)
      })
      .enters(delay3, () => {
        timeoutId = setTimeout(() => store.dispatch(timer()), 1500)
      })
      .enters(delay4, () => {
        timeoutId = setTimeout(() => store.dispatch(timer()), 2500)
      })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  return api(store).setExports({
    fetchZen: () => {
      store.dispatch(startRequest())
    },
  })
})

export const ApisPlayground = () => {
  const zenInstance = zenAtom.useInstance()
  const { requestState, zen } = zenInstance.useValue()
  const { fetchZen } = zenInstance.api.exports

  return (
    <Wrapper>
      <h3>Zedux APIs Playground</h3>
      <div>
        <Button
          disabled={
            ![idle.type, successState.type, failureState.type].includes(
              requestState as any
            )
          }
          onClick={() => fetchZen()}
        >
          Fetch Some Zen
        </Button>
        <ZenText>
          {idle.is(requestState) ? (
            'none fetched yet :('
          ) : requesting.is(requestState) || delay.is(requestState) ? (
            'requesting...'
          ) : delay2.is(requestState) ? (
            'Wow it is taking a while...'
          ) : delay3.is(requestState) ? (
            "Lol jk it isn't taking this long"
          ) : delay4.is(requestState) ? (
            "Just wanted to say that it's a beautiful day! ;)"
          ) : successState.is(requestState) ? (
            <span>
              The Zen: <i>&quot;{zen}&quot;</i>
            </span>
          ) : (
            'Failed to fetch -_-'
          )}
        </ZenText>
      </div>
    </Wrapper>
  )
}
