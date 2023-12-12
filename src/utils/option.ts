export class Option<T> {
  public static some<T>(d: T): Option<T> {
    return new Option(d, false);
  }

  public static none<T = any>(): Option<T> {
    return new Option<T>(null as any, true);
  }

  public static fromNullable<T>(d: T): Option<NonNullable<T>> {
    return d == null ? Option.none() : Option.some(d);
  }

  private _data: T;
  private _isNone: boolean;

  constructor(data: T, isNone = false) {
    this._data = data;
    this._isNone = isNone;
  }

  public get isSome(): boolean {
    return !this._isNone;
  }

  public get isNone(): boolean {
    return this._isNone;
  }

  public unwrap(): T {
    if (this.isNone) throw new Error('None option was unwrapped');

    return this._data;
  }

  public unwrapOrDefault(def: T): T {
    return this.isSome ? this._data : def;
  }

  public unwrapOr<TT>(or: TT): T | TT {
    return this.isSome ? this._data : or;
  }

  // NOTE: Careful, these methods are unsafe
  public map<TT>(fn: (d: T) => TT): Option<TT> {
    const d = !this.isNone ? fn(this._data) : null;

    return new Option(d as any as TT, this._isNone);
  }

  public andThen<TT>(fn: (d: T) => Option<TT>): Option<TT> {
    return !this._isNone ? fn(this._data) : (this as any as Option<TT>);
  }

  public some(fn: (d: T) => void): this {
    if (this.isNone) return this;

    fn(this._data);
    return this;
  }

  public none(fn: () => void): this {
    if (!this.isNone) return this;

    fn();
    return this;
  }

  public any(fn: (d: T | undefined, isSome: boolean) => void): this {
    fn(this._data, this.isSome);
    return this;
  }
}
