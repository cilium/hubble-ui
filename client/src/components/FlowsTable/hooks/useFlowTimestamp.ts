import { useEffect, useState } from 'react';
import { Flow } from '~/domain/flows';

export function useFlowTimestamp(ms?: number | null, delayMs = 2500) {
  const [timestamp, setTimestamp] = useState(
    Flow.formatRelativeTimestamp(new Date(ms ?? Date.now())),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Flow.formatRelativeTimestamp(new Date(ms ?? Date.now())));
    }, delayMs);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return timestamp;
}
