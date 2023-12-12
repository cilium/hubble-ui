export type Fn<A extends unknown[]> = (...args: A) => void;

export const once = <A extends unknown[]>(fn: Fn<A>): Fn<A> => {
  let isCalled = false;

  return (...args: A) => {
    if (isCalled) return;
    isCalled = true;

    fn(...args);
  };
};
