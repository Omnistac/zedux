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
    <div className="flex gap-1">
      <input
        onChange={event => setText(event.target.value)}
        placeholder="Enter name"
        value={text}
      />

      <Suspense fallback={<div className="text-3xl">Loading...</div>}>
        <Response text={text} />
      </Suspense>
    </div>
  )
}
