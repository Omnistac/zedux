import { Counter } from "../util/dependencyGraph";
import { ReactiveFramework } from "../util/reactiveFramework";

/** worst case. */
export function unstable(bridge: ReactiveFramework) {
  let head = bridge.signal(0);
  const double = bridge.computed(() => head.read() * 2);
  const inverse = bridge.computed(() => -head.read());
  let current = bridge.computed(() => {
    let result = 0;
    for (let i = 0; i < 20; i++) {
      result += head.read() % 2 ? double.read() : inverse.read();
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
    console.assert(current.read() === 40);
    const atleast = 100;
    callCounter.count = 0;
    for (let i = 0; i < 100; i++) {
      bridge.withBatch(() => {
        head.write(i);
      });
      // console.assert(current.read() === i % 2 ? i * 2 * 10 : i * -10);
    }
    console.assert(callCounter.count === atleast);
  };
}
