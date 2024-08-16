import { Counter } from "./../util/dependencyGraph";
import { Computed, ReactiveFramework } from "../util/reactiveFramework";

let width = 10;

export function triangle(bridge: ReactiveFramework) {
  let head = bridge.signal(0);
  let current = head as Computed<number>;
  let list: Computed<number>[] = [];
  for (let i = 0; i < width; i++) {
    let c = current;
    list.push(current);
    current = bridge.computed(() => {
      return c.read() + 1;
    });
  }
  let sum = bridge.computed(() => {
    return list.map((x) => x.read()).reduce((a, b) => a + b, 0);
  });

  let callCounter = new Counter();
  bridge.effect(() => {
    sum.read();
    callCounter.count++;
  });

  return () => {
    const constant = count(width);
    bridge.withBatch(() => {
      head.write(1);
    });
    console.assert(sum.read() === constant);
    const atleast = 100;
    callCounter.count = 0;
    for (let i = 0; i < 100; i++) {
      bridge.withBatch(() => {
        head.write(i);
      });
      console.assert(sum.read() === constant - width + i * width);
    }
    console.assert(callCounter.count === atleast);
  };
}

function count(number: Number) {
  return new Array(number)
    .fill(0)
    .map((_, i) => i + 1)
    .reduce((x, y) => x + y, 0);
}
