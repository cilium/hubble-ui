import _ from 'lodash';

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

export interface Clonable {
  clone(deep?: boolean): this;
}

export interface Comparable<T> {
  equals(rhs?: T | null): boolean;
}

export const tooSmall = (num: number): boolean => {
  return Math.abs(num) <= Number.EPSILON;
};

export const setupDebugProp = (obj: object) => {
  if (window.debugTools == null) {
    window.debugTools = {};
  }

  Object.keys(obj).forEach(key => {
    window.debugTools[key] = (obj as any)[key];
  });
};

export const isValidDate = (d: any): boolean => {
  return d instanceof Date && !isNaN(d as any);
};

export const isClonable = (obj: Partial<Clonable>): obj is Clonable => {
  if (obj == null) return false;

  const cloneIsOk =
    obj.clone?.name.charAt != null && obj.clone instanceof Function;

  return cloneIsOk;
};

export const isComparable = <T>(
  obj: Partial<Comparable<T>>,
): obj is Comparable<T> => {
  if (obj == null) return false;

  const equalsIsOk =
    obj.equals?.name.charAt != null &&
    obj.equals?.length >= 1 &&
    obj.equals instanceof Function;

  return equalsIsOk;
};

export const clone = <T>(obj: T, deep?: boolean): T => {
  if (isClonable(obj)) return obj.clone(deep ?? true);

  return _.cloneDeep(obj);
};

export type CompareFn<T> = (lhs?: T | null, rhs?: T | null) => boolean;

export const equals = <T>(
  lhs?: T | null,
  rhs?: T | null,
  compareFn?: CompareFn<T>,
): boolean => {
  if (lhs != null && rhs == null) return false;
  if (lhs == null && rhs != null) return false;
  if (lhs == null && rhs == null) return true;

  if (lhs != null && rhs != null) {
    if (compareFn != null) return compareFn(lhs, rhs);
    if (isComparable(lhs)) return lhs.equals(rhs);
  }

  return _.isEqual(lhs, rhs);
};

export const numberSep = (x: number | string, sep = ' '): string => {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);

  return parts.join('.');
};
