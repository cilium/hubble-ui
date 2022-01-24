import { TCPFlags } from '~/domain/hubble';

export const toString = (flags: TCPFlags | null): string => {
  const arr = toArray(flags);

  return arr.map(f => f.toLocaleUpperCase()).join(' ');
};

export const toArray = (flags: TCPFlags | null): Array<keyof TCPFlags> => {
  if (flags == null) return [];

  const enabled = Object.keys(flags).filter(f => !!flags[f as keyof TCPFlags]);

  return enabled.sort() as Array<keyof TCPFlags>;
};
