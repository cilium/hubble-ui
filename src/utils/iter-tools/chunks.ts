export type ChunksForEachCallback<D> = (chunk: D[], i: number, ntotal: number) => void;

export type ChunksMapCallback<D, R> = (chunk: D[], i: number, ntotal: number) => R;

export class Chunks<D> {
  private arr: Array<D>;
  private chunkSize: number;
  private overlap: number;

  private iter = 0;

  constructor(arr: Array<D>, chunkSize: number, overlap: number) {
    this.arr = arr;
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  public forEach(cb: ChunksForEachCallback<D>) {
    const overlap = this.overlap;
    const size = this.chunkSize;
    const arr = this.arr;

    const n = arr.length;
    const step = size - overlap;

    if (size <= 0 || overlap < 0 || n === 0) return;

    if (step === 0) {
      throw new Error(`
        chunks: failed to run with overlap === size (${overlap} === ${size})
      `);
    }

    for (let [start, idx] = [0, 0]; start + size <= n; start += step) {
      const chunk = arr.slice(start, start + size);
      const ntotal = ((n - overlap) / (size - overlap)) | 0;

      if (chunk.length < size) break;

      cb(chunk, idx, ntotal);
      idx += 1;
    }
  }

  public map<R>(cb: ChunksMapCallback<D, R>): R[] {
    const collected: R[] = [];

    this.forEach((chunk, idx, ntotal) => {
      const result = cb(chunk, idx, ntotal);
      collected.push(result);
    });

    return collected;
  }
}

export const chunks = <D>(arr: D[], size: number, overlap = 0): Chunks<D> => {
  return new Chunks(arr, size, overlap);
};
