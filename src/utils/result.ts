import { Option } from './option';

export class Result<T, E = Error> {
  public static success<T, E = Error>(d: T): Result<T, E> {
    return new Result(d, null as any as E);
  }

  public static error<E = Error, T = any>(err: E): Result<T, E> {
    return new Result(null as any as T, err);
  }

  private _data: T;
  private _err: E;

  constructor(data: T, err: E) {
    this._data = data;
    this._err = err;
  }

  public get isOk(): boolean {
    return this._err == null;
  }

  public get isErr(): boolean {
    return this._err != null;
  }

  public unwrap(): T {
    if (this.isErr) throw this._err;

    return this._data;
  }

  public option(): Option<T> {
    return this.isErr ? Option.none() : Option.some(this._data);
  }

  // NOTE: Careful, these methods are unsafe
  public map<TT>(fn: (d: T) => TT): Result<TT, E> {
    const d = this._err == null ? fn(this._data) : null;

    return new Result(d as any as TT, this._err);
  }

  public andThen<TT>(fn: (d: T) => Result<TT, E>): Result<TT, E> {
    return this._err == null ? fn(this._data) : (this as any as Result<TT, E>);
  }

  public mapErr<EE>(fn: (e: E) => EE): Result<T, EE> {
    const err = this._data == null ? fn(this._err) : null;

    return new Result(this._data, err as any as EE);
  }

  public ok(fn: (d: T) => void): this {
    if (this.isErr) return this;

    fn(this._data);
    return this;
  }

  public err(fn: (e: E) => void): this {
    if (!this.isErr) return this;

    fn(this._err);
    return this;
  }
}
