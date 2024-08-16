import { ReactiveFramework } from "../util/reactiveFramework";

export function mux(bridge: ReactiveFramework) {
  let heads = new Array(100).fill(null).map((_) => bridge.signal(0));
  const mux = bridge.computed(() => {
    return Object.fromEntries(heads.map((h) => h.read()).entries());
  });
  const splited = heads
    .map((_, index) => bridge.computed(() => mux.read()[index]))
    .map((x) => bridge.computed(() => x.read() + 1));

  splited.forEach((x) => {
    bridge.effect(() => x.read());
  });
  return () => {
    for (let i = 0; i < 10; i++) {
      bridge.withBatch(() => {
        heads[i].write(i);
      });
      console.assert(splited[i].read() === i + 1);
    }
    for (let i = 0; i < 10; i++) {
      bridge.withBatch(() => {
        heads[i].write(i * 2);
      });
      console.assert(splited[i].read() === i * 2 + 1);
    }
  };
}
