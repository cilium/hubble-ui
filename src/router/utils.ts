export const TRAILING_SLASH_RE = /\/+$/g;
export const LEADING_DOUBLE_SLASH_RE = /^(\/\/)\/*/g;
export const LEADING_SLASH_RE = /^\/*/g;

export const extractPathname = (urlOrPath: string, pathBase: string = ''): string => {
  const safePath = urlOrPath.replace(LEADING_DOUBLE_SLASH_RE, '/');

  try {
    const pathname = new URL(safePath, 'http://localhost' + pathBase).pathname;
    return pathname.replace(TRAILING_SLASH_RE, '') || '/';
  } catch (_e) {}

  try {
    const pathname = new URL(safePath).pathname;
    return pathname.replace(TRAILING_SLASH_RE, '') || '/';
  } catch (_e) {}

  return '/';
};

export const ltrimSlashes = (str: string): string => {
  return str.replace(LEADING_SLASH_RE, '');
};
