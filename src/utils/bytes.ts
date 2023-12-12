const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

export const toUint8Array = (d: string | Uint8Array): Uint8Array => {
  if (d instanceof Uint8Array) return d;

  return utf8Encoder.encode(d);
};

export const arrayBufferToString = (arr: ArrayBuffer): string => {
  return utf8Decoder.decode(arr);
};
