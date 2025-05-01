import { useAtomValue } from '@zedux/react'
import { Suspense, useState } from 'react'
import { simpleUnaryRequestAtom } from '../state/requests'

function Response({ text }: { text: string }) {
  const { data } = useAtomValue(simpleUnaryRequestAtom, [text])

  return <div>{data}</div>
}

export function SimpleUnaryRequest() {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-center text-2xl">Simple Unary Request</h2>
      <div className="flex gap-1">
        <input
          className="border border-neutral-200 rounded-sm p-0.5"
          onChange={event => setText(event.target.value)}
          placeholder="Enter name"
          value={text}
        />

        <Suspense fallback={<p>Loading...</p>}>
          <Response text={text} />
        </Suspense>
      </div>
    </div>
  )
}
