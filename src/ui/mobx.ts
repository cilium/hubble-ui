export const schedulers = {
  debounce: (ms: number) => {
    let callTimer: number;

    return (fn: Function) => {
      clearTimeout(callTimer);
      callTimer = setTimeout(fn, ms);
    };
  },
};
