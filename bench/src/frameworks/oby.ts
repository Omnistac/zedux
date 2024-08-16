import { ReactiveFramework } from "../util/reactiveFramework";
import $ from "oby";

export const obyFramework: ReactiveFramework = {
  name: "Oby",
  signal: (initialValue) => {
    const observable = $(initialValue);
    return {
      write: (v) => observable(v),
      read: () => observable(),
    };
  },
  computed: (fn) => {
    const memo = $.memo(fn);
    return {
      read: () => memo(),
    };
  },
  effect: (fn) => $.effect(fn),
  withBatch: (fn) => {
    fn();
    $.tick();
  },
  withBuild: (fn) => $.root(fn),
};
