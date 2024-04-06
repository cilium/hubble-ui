import { Intent, StatusEntry } from '.';

export class StatusEntryBuilder {
  public statusEntry: StatusEntry;

  public static new(entry?: StatusEntry) {
    return new StatusEntryBuilder(entry);
  }

  constructor(entry?: StatusEntry) {
    this.statusEntry = entry ?? StatusEntry.empty();
  }

  public setIntent(int: Intent): this {
    this.statusEntry.intent = int;
    return this;
  }

  public setTitle(title?: string | null): this {
    this.statusEntry.title = title || '';
    return this;
  }

  public setDetails(details?: string | null): this {
    this.statusEntry.details = details;
    return this;
  }

  public setComponent(c?: string | null): this {
    this.statusEntry.component = c;
    return this;
  }

  public setPersistent(val: boolean): this {
    this.statusEntry.isPersistent = val;
    return this;
  }

  public setPending(p?: boolean | null): this {
    this.statusEntry.isPending = !!p;
    return this;
  }

  public setUnderlyingError(err?: Error | null): this {
    this.statusEntry.underlyingError = err;
    return this;
  }

  public setTime(d: Date): this {
    this.statusEntry.occuredAt = d;
    return this;
  }

  public setCardinality(c: number): this {
    this.statusEntry.cardinality = c;
    return this;
  }

  public setKeysToComplete(keys?: Set<string> | string[]): this {
    if (keys == null) {
      this.statusEntry.keysToComplete?.clear();
      return this;
    }

    this.statusEntry.keysToComplete = new Set();
    for (const key of keys) {
      this.statusEntry.keysToComplete.add(key);
    }

    return this;
  }

  public incCardinality(di = 1): this {
    this.statusEntry.cardinality += di;
    return this;
  }

  public setCardinalityPrefix(prefix?: string | null): this {
    this.statusEntry.cardinalityPrefix = prefix ?? undefined;
    return this;
  }

  public setKey(key?: string | null): this {
    this.statusEntry.key = key;
    return this;
  }

  public build(): StatusEntry {
    return this.statusEntry;
  }
}
