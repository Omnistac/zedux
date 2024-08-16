import { Counter } from "../util/dependencyGraph";
import { Computed, ReactiveFramework } from "../util/reactiveFramework";

let width = 5;

export function diamond(bridge: ReactiveFramework) {
  let head = bridge.signal(0);
  let current: Computed<number>[] = [];
  for (let i = 0; i < width; i++) {
    current.push(
      bridge.computed(() => {
        return head.read() + 1;
      })
    );
  }
  let sum = bridge.computed(() => {
    return current.map((x) => x.read()).reduce((a, b) => a + b, 0);
  });
  let callCounter = new Counter();
  bridge.effect(() => {
    sum.read();
    callCounter.count++;
  });

  return () => {
    bridge.withBatch(() => {
      head.write(1);
    });
    console.assert(sum.read() === 2 * width);
    const atleast = 500;
    callCounter.count = 0;
    for (let i = 0; i < 500; i++) {
      bridge.withBatch(() => {
        head.write(i);
      });
      console.assert(sum.read() === (i + 1) * width);
    }
    console.assert(callCounter.count === atleast);
  };
}
