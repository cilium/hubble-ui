import { MutableRefObject as MutRef } from 'react';
import { useLocalObservable } from 'mobx-react';

export const unionRef = <T>(...refs: MutRef<T>[]): MutRef<T> => {
  return useLocalObservable(() => {
    return {
      _current: null as T,

      get current() {
        return this._current;
      },

      set current(e: T) {
        refs.forEach(ref => {
          ref.current = e;
        });

        this._current = e;
      },
    };
  });
};

export const observableRef = <T>(init: T): MutRef<T> => {
  return useLocalObservable(() => {
    return {
      _current: init,

      get current() {
        return this._current;
      },

      set current(e: T) {
        this._current = e;
      },
    };
  });
};

export const reactionRef = <T>(init: T, cb?: (v: T) => void): MutRef<T> => {
  let _current = init;

  return {
    get current() {
      return _current;
    },

    set current(e: T) {
      _current = e;
      cb?.(_current);
    },
  };
};
