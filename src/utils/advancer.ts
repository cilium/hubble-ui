type Op<T> = (a: T, b: T) => T;

const defaultAdder: Op<any> = (a: any, b: any) => {
  return (a as number) + (b as number);
};

const defaultSubtractor: Op<any> = (a: any, b: any) => {
  return (a as number) - (b as number);
};

export class Advancer<Key, Step> {
  private data: Map<Key, Step> = new Map();
  private step: Step;
  private initialValue: Step;

  private inc: Op<Step> = defaultAdder;
  private dec: Op<Step> = defaultSubtractor;

  public static new<K, S>(step: S, iv: S): Advancer<K, S> {
    return new Advancer(step, iv);
  }

  constructor(step: Step, iv: Step, inc?: Op<Step>) {
    this.step = step;
    this.initialValue = iv;
    this.inc = inc ?? this.inc;
  }

  public advance(key: Key): Step {
    const current = this.data.get(key) ?? this.initialValue;
    this.data.set(key, this.inc(current, this.step));

    return current;
  }

  public rewind(key: Key): Step {
    const current = this.data.get(key) ?? this.initialValue;
    const prev = this.dec(current, this.step);

    this.data.set(key, prev);
    return prev;
  }

  public setAdder(adder: Op<Step>): this {
    this.inc = adder;
    return this;
  }

  public setSubtractor(sub: Op<Step>): this {
    this.dec = sub;
    return this;
  }
}
