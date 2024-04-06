import { useCallback, useState } from 'react';

export type Indicators<I> = Map<keyof I, number>;
export type EmitFn<I> = (_?: I) => void;
export type SingleIndicator = { value?: number };

export type UseIndicator<I, T = any> = {
  emit: EmitFn<keyof I>;
  indicators: Indicators<I>;
  data?: T | null;
  setData: (d?: T | null) => void;
  narrow: (k: keyof I) => SingleIndicator;
};

// NOTE: Indicator is a way to pass "trigger" events from parent to child
export const useIndicator = <I extends {}, T = any>(
  indicatorsTemplate: I,
  dataInit?: T | null,
  ringLimit?: number,
): UseIndicator<I, T> => {
  const limit = ringLimit ?? Number.MAX_SAFE_INTEGER;
  const [data, setData] = useState(dataInit);

  const [indicators, setIndicators] = useState(() => {
    const m = new Map<keyof I, number>();

    Object.keys(indicatorsTemplate).forEach(key => {
      m.set(key as keyof I, 1);
    });

    return m;
  });

  const emit = useCallback((k?: keyof I) => {
    setIndicators(indicators => {
      if (k == null) {
        indicators.forEach((v, k) => {
          indicators.set(k, (v + 1) % limit);
        });
      } else {
        const current = indicators.get(k) ?? 0;
        indicators.set(k, (current + 1) % limit);
      }

      return new Map(indicators);
    });
  }, []);

  const narrow = (k: keyof I): SingleIndicator => {
    return { value: indicators.get(k) };
  };

  return {
    emit,
    indicators: new Map(),
    data,
    setData,
    narrow,
  };
};

export const useSingleIndicator = (init?: number, ringLimit?: number) => {
  const [value, setValue] = useState(init ?? 0);
  const limit = ringLimit ?? Number.MAX_SAFE_INTEGER;

  const emit = useCallback(() => {
    setValue((value + 1) & limit);
  }, [value, limit]);

  return { value, emit };
};
