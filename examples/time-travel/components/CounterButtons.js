import React from 'react'


export default function CounterButtons({
  increment,
  decrement
}) {
  return (
    <section>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </section>
  )
}
