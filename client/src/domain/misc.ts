export interface KV {
  key: string;
  value: string;
}

export interface Dictionary<T> {
  [key: string]: T;
}
