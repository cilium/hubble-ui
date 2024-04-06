export { TimerId } from './common';

export { Option } from './option';
export { Result } from './result';

export * as crypto from './crypto';
export * as history from './history';
export * as fn from './fn';

export const sleep = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

export const applyPrefix = (path: string, prefix?: string): string => {
  if (prefix == null) return path;

  const maybeSlash = prefix.endsWith('/') ? '' : '/';
  const rest = path.startsWith('/') ? path.slice(1) : path;

  return `${prefix}${maybeSlash}${rest}`;
};

// NOTE: Optimize + consolidate with other similar functions
export const applyThemePrefix = (path: string, prefix?: string): string => {
  if (prefix == '') return path;

  // const startSubstr = '/icons/logos/'
  const startSubstr = path.slice(0, 13);
  const endSubstr = path.slice(13);

  return `${startSubstr}${prefix}${endSubstr}`;
};
