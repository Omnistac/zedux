import { Counter } from "../util/dependencyGraph";
import { Computed, ReactiveFramework } from "./../util/reactiveFramework";
let len = 50;

/** deep propagation */
export function deepPropagation(bridge: ReactiveFramework) {
  let head = bridge.signal(0);
  let current = head as Computed<number>;
  for (let i = 0; i < len; i++) {
    let c = current;
    current = bridge.computed(() => {
      return c.read() + 1;
    });
  }
  let callCounter = new Counter();

  const stop = bridge.effect(() => {
    current.read();
    callCounter.count++;
  });

  const iter = 50;

  return () => {
    bridge.withBatch(() => {
      head.write(1);
    });
    const atleast = iter;
    callCounter.count = 0;
    for (let i = 0; i < iter; i++) {
      bridge.withBatch(() => {
        head.write(i);
      });
      console.assert(current.read() === len + i);
    }

    console.assert(callCounter.count === atleast);
  };
}
