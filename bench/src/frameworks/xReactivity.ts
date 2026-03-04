import { ReactiveFramework } from "../util/reactiveFramework";
import {
  batch,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
} from "solid-js";

export const xReactivityFramework: ReactiveFramework = {
  name: "x-reactivity",
  signal: (initialValue) => {
    const [getter, setter] = createSignal(initialValue);
    return {
      write: (v) => setter(v),
      read: () => getter(),
    };
  },
  computed: (fn) => {
    const memo = createMemo(fn);
    return {
      read: () => memo(),
    };
  },
  effect: (fn) => createEffect(fn),
  withBatch: (fn) => {
    batch(fn);
  },
  withBuild: (fn) => createRoot(fn),
};
