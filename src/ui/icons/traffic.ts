import { Verdict } from '~/domain/hubble';

const successWholeIconUrl = '/icons/misc/success-green-whole';
const successPartIconUrl = '/icons/misc/success-partial';
const failedIconUrl = '/icons/misc/failed';

export const iconByVerdicts = (
  v: Set<Verdict> | undefined | null,
  isDarkTheme: boolean = false,
): string => {
  const basePath =
    v == null
      ? successWholeIconUrl
      : v.has(Verdict.Dropped) && v.size === 1
        ? failedIconUrl
        : v.has(Verdict.Forwarded) && v.size === 1
          ? successWholeIconUrl
          : v.has(Verdict.Dropped) && v.has(Verdict.Forwarded)
            ? successPartIconUrl
            : successWholeIconUrl;

  return isDarkTheme ? `${basePath}-dark.svg` : `${basePath}.svg`;
};
