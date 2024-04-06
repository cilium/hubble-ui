import * as React from 'react';
import _ from 'lodash';

export type MutationObserverHookOptions = {
  elem?: string | Element;
  ref?: React.RefObject<Element | null>;
  options?: MutationObserverInit & { all?: boolean };
};

export type MutationObserverHookCallback = (m: MutationRecord[], ob: MutationObserver) => void;

export const useMutationObserver = (
  opts: MutationObserverHookOptions,
  cb: MutationObserverHookCallback,
  deps = [],
) => {
  React.useLayoutEffect(() => {
    const ob = useRawMutationObserver(opts, cb);

    return () => ob?.disconnect();
  }, deps);
};

export const useRawMutationObserver = (
  opts: MutationObserverHookOptions,
  cb: MutationObserverHookCallback,
): MutationObserver | null => {
  const ob = new MutationObserver(cb);

  const target = getTargetElemFromOptions(opts);
  if (target == null) return null;

  const options = getMutationObserverInitFromOptions(opts.options);
  ob.observe(target, options);

  return ob;
};

const getTargetElemFromOptions = (opts: MutationObserverHookOptions): Node | null => {
  const target = _.isString(opts.elem)
    ? document.querySelector(opts.elem)
    : _.isElement(opts.elem)
      ? opts.elem
      : opts.ref != null
        ? opts.ref.current
        : null;

  return target || null;
};

const getMutationObserverInitFromOptions = (
  _opts: MutationObserverHookOptions['options'],
): MutationObserverInit => {
  const opts = _opts ? _opts : { all: true };

  const base = !!opts.all
    ? {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      }
    : {};

  return { ...base, ...opts };
};
