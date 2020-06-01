export type ChunksForEachCallback<D> = (
  chunk: D[],
  i: number,
  last: boolean,
) => void;

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

  forEach(cb: ChunksForEachCallback<D>) {
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
      const isLast = start + step + size > n;

      if (chunk.length < size) {
        const pad = Array(size - chunk.length).fill(undefined);
        chunk.splice(chunk.length, 0, ...pad);
      }

      cb(chunk, idx, isLast);

      idx += 1;
    }
  }
}

export const chunks = <D>(arr: D[], size: number, overlap = 0): Chunks<D> => {
  return new Chunks(arr, size, overlap);
};
