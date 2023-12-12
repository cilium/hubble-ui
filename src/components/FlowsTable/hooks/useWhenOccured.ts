import { useEffect, useState, useCallback } from 'react';
import { elapsedInWords } from '~/utils/time';
import { Ticker } from '~/utils/ticker';

import { TickerEvents } from '../general';

export function useWhenOccured(ticker?: Ticker<TickerEvents>, ms?: number | null) {
  const [elapsedWords, setWords] = useState('');

  const setter = useCallback(() => {
    const since = new Date(ms ?? Date.now());
    const words = elapsedInWords(since);

    setWords(words);
  }, []);

  useEffect(() => {
    setter();
    ticker?.on(TickerEvents.TimestampUpdate, setter);

    return () => {
      ticker?.off(TickerEvents.TimestampUpdate, setter);
    };
  }, [ticker]);

  return elapsedWords;
}
