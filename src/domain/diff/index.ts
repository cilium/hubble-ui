import _ from 'lodash';
import { equals, clone, CompareFn } from '~/domain/misc';

export interface IDiff<T> {
  changed: boolean;
  // before: T | null | undefined;
  // after: T | null | undefined;

  invert: () => this;
}

// NOTE: diff accepts lhs to support diffing between null and Self
export interface Diffable<Self, D extends IDiff<Self>> {
  diff: (rhs?: Self | null) => D;
}

type DiffType<T> = T extends Diffable<T, infer U> ? U : never;

// NOTE: well, for now it's not actually a diff, this class can just say if
// NOTE: values before and after are different
export class Diff<T> implements IDiff<T> {
  private _changed?: boolean;
  private _diff?: DiffType<T> | null;
  private _compareFn?: CompareFn<T>;

  public before: T | null | undefined;
  public after: T | null | undefined;

  public static isDiffable<T, U extends IDiff<T>>(
    obj?: Partial<Diffable<T, U>> | null,
  ): obj is Diffable<T, U> {
    if (obj == null || obj.diff == null) return false;

    // NOTE: you cannot check if `diff.name === 'diff'` because in production
    // NOTE: build diff function changes its name ><
    return obj.diff instanceof Function && obj.diff.name.charAt != null && obj.diff.length >= 1;
  }

  public static new<T>(init?: T | null): Diff<T> {
    const ch = new Diff<T>();
    ch.after = clone(init);

    return ch;
  }

  public get changed(): boolean {
    if (this._changed != null) return this._changed;

    this._changed = this.computeChanged();
    return !!this._changed;
  }

  public get diff(): DiffType<T> | null {
    if (this._diff != null) return this._diff;

    this._diff = this.computeDiff();
    return this._diff;
  }

  public replace(rhs: Diff<T>): this {
    this.before = clone(rhs.before);
    this.after = clone(rhs.after);
    this._changed = rhs._changed;
    this._diff = rhs._diff;

    return this;
  }

  public setAfter(after: T | null | undefined): this {
    this.after = clone(after);
    this.dropCached();

    return this;
  }

  public step(nextAfter: T | null | undefined): this {
    this.before = clone(this.after);
    this.after = clone(nextAfter);
    this.dropCached();

    return this;
  }

  public clone(): Diff<T> {
    const ch = new Diff<T>();

    ch._changed = this._changed;
    ch.before = clone(this.before);
    ch.after = clone(this.after);

    return ch;
  }

  public invert(): this {
    [this.before, this.after] = [this.after, this.before];
    this.dropCached();
    return this;
  }

  public setUnchanged(): this {
    this.dropCached();
    this._changed = false;
    this.before = this.after;

    return this;
  }

  public setComparator(fn?: Diff<T>['_compareFn']): this {
    this._compareFn = fn;
    return this;
  }

  private computeChanged(): boolean {
    const [before, after] = [this.before, this.after];

    return !equals(before, after, this._compareFn);
  }

  private computeDiff(): DiffType<T> | null {
    const [before, after] = [this.before, this.after];

    if (before != null && after != null && Diff.isDiffable<T, DiffType<T>>(before)) {
      return before.diff(after);
    } else if (before == null && after != null && Diff.isDiffable<T, DiffType<T>>(after)) {
      return after.diff(null).invert();
    } else if (before != null && after == null && Diff.isDiffable<T, DiffType<T>>(before)) {
      return before.diff(null);
    }

    return null;
  }

  private dropCached() {
    this._changed = void 0;
    this._diff = void 0;
  }
}
