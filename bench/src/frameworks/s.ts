import { ReactiveFramework } from "../util/reactiveFramework";
import S from "s-js";

export const sFramework: ReactiveFramework = {
  name: "s-js",
  signal: (initial) => {
    const data = S.value(initial);
    return {
      read: () => data(),
      write: (v) => data(v),
    };
  },
  computed: (fn) => {
    const computed = S(fn);
    return {
      read: () => computed(),
    };
  },
  effect: (fn) => S(fn),
  withBatch: (fn) => S.freeze(fn),
  withBuild: (fn) => S.root(fn),
};
