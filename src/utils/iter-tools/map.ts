// NOTE: use this wrapper to avoid multiple Map traverses:
// NOTE: 1)  [...map.entries()] 2) .map() on previously obtained array
export class MapUtils<K, V> {
  private _map: Map<K, V>;

  public static new<K, V>(m: Map<K, V>): MapUtils<K, V> {
    return new MapUtils(m);
  }

  public static pickFirst<K, V>(m: Map<K, V>): V | null | undefined {
    for (const key of m.keys()) {
      return m.get(key);
    }

    return null;
  }

  constructor(map: Map<K, V>) {
    this._map = map;
  }

  public map<T>(fn: (k: K, v: V) => T): T[] {
    const values: T[] = [];

    this._map.forEach((v, k) => {
      values.push(fn(k, v));
    });

    return values;
  }

  public mapKeys<T>(fn: (k: K) => T): T[] {
    const values: T[] = [];

    this._map.forEach((_, k) => {
      values.push(fn(k));
    });

    return values;
  }

  public mapValues<T>(fn: (v: V) => T): T[] {
    const values: T[] = [];

    this._map.forEach(v => {
      values.push(fn(v));
    });

    return values;
  }
}
