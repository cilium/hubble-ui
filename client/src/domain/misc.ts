export interface KV {
  key: string;
  value: string;
}

export interface Dictionary<T> {
  [key: string]: T;
}

export type ResolveType<T> = T extends PromiseLike<infer U> ? U : T;
