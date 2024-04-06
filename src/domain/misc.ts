import _ from 'lodash';

export interface KV {
  key: string;
  value: string;
}

export interface Dictionary<T> {
  [key: string]: T;
}

export interface Clonable {
  clone(deep?: boolean): this;
}

export interface Comparable<T> {
  equals(rhs?: T | null): boolean;
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

export const setupDebugProp = (obj: object) => {
  if (window.debugTools == null) {
    window.debugTools = {};
  }

  Object.keys(obj).forEach(key => {
    window.debugTools[key] = (obj as any)[key];
  });
};

export const isActivated = (b: any): boolean => {
  if (_.isString(b)) {
    b = b.toLowerCase();

    if (b === '1' || b === 'on' || b === 'true' || b === 'enabled') return true;
    if (b === '0' || b === 'off' || b === 'false' || b === 'disabled') {
      return false;
    }
  }

  if (_.isNumber(b)) {
    if (b === 0 || Number.isNaN(b)) return false;

    return true;
  }

  return !!b;
};

export const camelCasify = (obj: any): any => {
  return transformObjectKeys(obj, _.camelCase);
};

export const lowerSnakeCasify = (obj: any): any => {
  return transformObjectKeys(obj, _.snakeCase);
};

export const transformObjectKeys = (obj: any, tr: (_: string) => string): any => {
  if (_.isArray(obj)) {
    return obj.map((v: any) => transformObjectKeys(v, tr));
  }

  if (_.isFunction(obj)) return obj;

  if (_.isObject(obj)) {
    return Object.entries(obj).reduce((acc: any, pair: [string, any]) => {
      const transformedKey = tr(pair[0]);
      const transformedValue = transformObjectKeys(pair[1], tr);

      return Object.assign(acc, {
        [transformedKey]: transformedValue,
      });
    }, {});
  }

  return obj;
};

export const isValidDate = (d: any): boolean => {
  return d instanceof Date && !isNaN(+d);
};

export const getIpWeight = (ip?: string | null): number => {
  if (!ip) return 0;

  // NOTE: this just converts IP octets to weighted sum
  return ip.split('.').reduce((acc, octet, idx) => {
    const octetNum = parseInt(octet);
    if (Number.isNaN(octetNum)) return acc;

    return acc + (octetNum << (8 * (3 - idx)));
  }, 0);
};

export const numberSep = (x: number | string, sep = ' '): string => {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);

  return parts.join('.');
};

export const isObject = (val: any): boolean => {
  return typeof val === 'object' && val !== null;
};

export const isClonable = (obj: any): obj is Clonable => {
  if (obj == null) return false;
  if (!isObject(obj) || !('clone' in obj)) return false;

  const cloneIsOk = obj.clone?.name.charAt != null && obj.clone instanceof Function;

  return cloneIsOk;
};

export const isComparable = <T>(obj: Partial<Comparable<T>>): obj is Comparable<T> => {
  if (obj == null) return false;

  const equalsIsOk =
    obj.equals?.name.charAt != null && obj.equals?.length >= 1 && obj.equals instanceof Function;

  return equalsIsOk;
};

export const clone = <T>(obj: T, deep?: boolean): T => {
  if (isClonable(obj)) return obj.clone(deep ?? true);

  return _.cloneDeep(obj);
};

export type CompareFn<T> = (lhs?: T | null, rhs?: T | null) => boolean;

export const equals = <T>(lhs?: T | null, rhs?: T | null, compareFn?: CompareFn<T>): boolean => {
  if (lhs != null && rhs == null) return false;
  if (lhs == null && rhs != null) return false;
  if (lhs == null && rhs == null) return true;

  if (lhs != null && rhs != null) {
    if (compareFn != null) return compareFn(lhs, rhs);
    if (isComparable(lhs)) return lhs.equals(rhs);
  }

  return _.isEqual(lhs, rhs);
};
