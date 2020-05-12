import { useEffect, useState, useCallback } from 'react';
import { elapsedInWords } from '~/utils/time';

export function useWhenOccured(ms?: number | null, delayMs = 2500) {
  const [elapsedWords, setWords] = useState('');

  const setter = useCallback(() => {
    const since = new Date(ms ?? Date.now());
    const words = elapsedInWords(since);

    setWords(words);
  }, []);

  useEffect(() => {
    setter();
    const interval = setInterval(setter, delayMs);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return elapsedWords;
}
