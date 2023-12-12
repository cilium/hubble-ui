export type ArrayCominationsForEach = (tuple: number[], idx: number, ntotal: number) => void;

export class ArrayCombinations {
  public tupleSizes: number[];
  private indices: number[];
  private stop: boolean;
  private ntuples: number;

  constructor(tupleSizes: number[]) {
    this.tupleSizes = tupleSizes;
    this.indices = Array(tupleSizes.length).fill(0);
    this.ntuples = tupleSizes.reduce((acc: number, ts: number) => {
      return acc * ts;
    }, 1);

    this.stop = this.ntuples === 0;
  }

  public next(): number[] | null {
    if (this.stop) return null;

    const current = this.indices.slice();
    this.advanceIndices();

    return current;
  }

  public asArray(): number[][] {
    const arr = [];

    while (true) {
      const indices = this.next();
      if (indices == null) break;

      arr.push(indices);
    }

    return arr;
  }

  public forEach(fn: ArrayCominationsForEach) {
    for (let idx = 0; idx < this.ntuples; ++idx) {
      const tuple = this.next();
      if (tuple == null) return;

      fn(tuple, idx, this.ntuples);
    }
  }

  private advanceIndices() {
    let idxToIncrement = this.indices.length - 1;
    let carry = 0;

    while (true) {
      if (idxToIncrement < 0) {
        if (carry === 1) {
          this.stop = true;
        }

        break;
      }

      const ts = this.tupleSizes[idxToIncrement];
      carry = Number(this.indices[idxToIncrement] + 1 >= ts);
      this.indices[idxToIncrement] = (this.indices[idxToIncrement] + 1) % ts;

      if (carry === 0) break;
      idxToIncrement -= 1;
    }
  }
}

export const arrays = (tupleSizes: number[]): ArrayCombinations => {
  return new ArrayCombinations(tupleSizes);
};
