export interface KV {
  key: string;
  value: string;
}

export interface Dictionary<T> {
  [key: string]: T;
}

export type ResolveType<T> = T extends PromiseLike<infer U> ? U : T;

export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

export enum StateChange {
  Unknown = 'unknown',
  Added = 'added',
  Modified = 'modified',
  Deleted = 'deleted',
  Exists = 'exists',
}

export const tooSmall = (num: number): boolean => {
  return Math.abs(num) <= Number.EPSILON;
};
