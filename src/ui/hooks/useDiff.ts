import { useMemo } from 'react';
import * as mobx from 'mobx';
import { Diff } from '~/domain/diff';

type Callback<D> = (diff: D, r: mobx.IReactionPublic) => void;

export type Options = {
  initUnchanged?: boolean;
};

export const useDiff = <T>(
  value: T,
  cb: Callback<Diff<T>>,
  opts?: Options,
): mobx.IReactionDisposer => {
  const initValue = !!opts?.initUnchanged ? value : null;
  const diff = useMemo(() => Diff.new<T>(initValue), []);

  // NOTE: main goal here is to react on value update
  return mobx.autorun(r => {
    diff.step(value);
    diff.changed && mobx.runInAction(() => cb(diff, r));
  });
};
