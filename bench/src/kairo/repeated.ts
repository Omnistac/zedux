import { Counter } from "../util/dependencyGraph";
import { ReactiveFramework } from "../util/reactiveFramework";

let size = 30;

/** repeated observers */
export function repeatedObservers(bridge: ReactiveFramework) {
  let head = bridge.signal(0);
  let current = bridge.computed(() => {
    let result = 0;
    for (let i = 0; i < size; i++) {
      // tbh I think it's meanigless to be this big...
      result += head.read();
    }
    return result;
  });

  let callCounter = new Counter();
  bridge.effect(() => {
    current.read();
    callCounter.count++;
  });

  return () => {
    bridge.withBatch(() => {
      head.write(1);
    });
    console.assert(current.read() === size);
    const atleast = 100;
    callCounter.count = 0;
    for (let i = 0; i < 100; i++) {
      bridge.withBatch(() => {
        head.write(i);
      });
      console.assert(current.read() === i * size);
    }
    console.assert(callCounter.count === atleast);
  };
}
