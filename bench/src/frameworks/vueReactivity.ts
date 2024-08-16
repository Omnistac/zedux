import { computed, ref, effect, ReactiveEffect } from "@vue/reactivity";
import { ReactiveFramework } from "../util/reactiveFramework";

let scheduled = [] as ReactiveEffect[];
let isBatching = false;
export const vueReactivityFramework: ReactiveFramework = {
  name: "Vue",
  signal: (initial) => {
    const data = ref(initial);
    return {
      read: () => data.value as any,
      write: (v) => (data.value = v as any),
    };
  },
  computed: (fn) => {
    const c = computed(fn);
    return {
      read: () => c.value,
    };
  },
  effect: function (fn) {
    let t = effect(() => fn(), {
      lazy: false,
      scheduler: (x) => {
        scheduled.push(t.effect);
      },
    });
  },
  withBatch: function (fn) {
    if (isBatching) {
      fn();
    }
    isBatching = true;
    fn();
    while (scheduled.length) {
      scheduled.pop()!.run();
    }
    isBatching = false;
  },
  withBuild: (fn) => fn(),
};
