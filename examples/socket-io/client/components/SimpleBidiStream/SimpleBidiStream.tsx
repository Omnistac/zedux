import { atom, useAtomInstance, useAtomState, useAtomValue } from '@zedux/react'
import { Suspense } from 'react'
import { simpleBidiStreamAtom } from '@/client/state/streams'

// since the state is used in multiple components, creating a new atom is
// already simpler than lifting state up in React
const simpleBidiStreamTextAtom = atom('simpleBidiStreamText', '')

function Controls() {
  const [text, setText] = useAtomState(simpleBidiStreamTextAtom)
  const { emit } = useAtomInstance(simpleBidiStreamAtom).exports

  return (
    <div className="flex gap-1 items-center">
      <input
        className="border border-neutral-200 rounded-sm p-0.5"
        onChange={event => setText(event.target.value)}
        placeholder="Enter text"
        value={text}
      />

      <button onClick={() => emit(text)}>Send</button>
    </div>
  )
}

function Responses() {
  const messages = useAtomValue(simpleBidiStreamAtom, [])

  return (
    <div>
      <p>Messages:</p>
      <ul>
        {messages.map((message, index) => (
          // yes, each message should have an id. That's what the complex bidi
          // stream example's for
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  )
}

export function SimpleBidiStream() {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-center text-2xl">Simple Bidi Request</h2>
      <div className="flex gap-1 items-start">
        <Suspense fallback={<p>Loading...</p>}>
          <Controls />

          <Responses />
        </Suspense>
      </div>
    </div>
  )
}
