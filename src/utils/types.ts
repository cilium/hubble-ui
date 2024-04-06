export type MethodType<C, M extends keyof C> = C[M] extends Function ? C[M] : never;
export type Parameter<F, N> = N extends 0
  ? F extends (a: infer P, ...args: any) => any
    ? P
    : never
  : N extends 1
    ? F extends (a: any, b: infer P, ...args: any) => any
      ? P
      : never
    : N extends 2
      ? F extends (a: any, b: any, c: infer P, ...args: any) => any
        ? P
        : never
      : N extends 3
        ? F extends (a: any, b: any, c: any, d: infer P, ...args: any) => any
          ? P
          : never
        : N extends 4
          ? F extends (a: any, b: any, c: any, d: any, e: infer P, ...args: any) => any
            ? P
            : never
          : N extends 5
            ? F extends (a: any, b: any, c: any, d: any, e: any, f: infer P, ...args: any) => any
              ? P
              : never
            : N extends 6
              ? F extends (
                  a: any,
                  b: any,
                  c: any,
                  d: any,
                  e: any,
                  f: any,
                  g: infer P,
                  ...args: any
                ) => any
                ? P
                : never
              : never;

export type ParametersAfter<F, N> = N extends 0
  ? F extends (a: any, ...args: infer P) => any
    ? P
    : never
  : N extends 1
    ? F extends (a: any, b: any, ...args: infer P) => any
      ? P
      : never
    : N extends 2
      ? F extends (a: any, b: any, c: any, ...args: infer P) => any
        ? P
        : never
      : N extends 3
        ? F extends (a: any, b: any, c: any, d: any, ...args: infer P) => any
          ? P
          : never
        : N extends 4
          ? F extends (a: any, b: any, c: any, d: any, e: any, ...args: infer P) => any
            ? P
            : never
          : N extends 5
            ? F extends (a: any, b: any, c: any, d: any, e: any, f: any, ...args: infer P) => any
              ? P
              : never
            : N extends 6
              ? F extends (
                  a: any,
                  b: any,
                  c: any,
                  d: any,
                  e: any,
                  f: any,
                  g: any,
                  ...args: infer P
                ) => any
                ? P
                : never
              : never;

export class ExtensibleFunction extends Function {
  constructor(f: Function) {
    super();
    return Object.setPrototypeOf(f, new.target.prototype);
  }
}

export type Union<A, B> = {
  [K in keyof A | keyof B]: K extends keyof A ? A[K] : K extends keyof B ? B[K] : never;
};
