import { useState, useEffect } from 'react';
import { formatDuration } from './timeFormat.js';

/**
 * React hook that continuously calculates the live duration for an active trade
 * on the client side without triggering any backend database writes or polling.
 * Updates smoothly every 1000ms.
 */
export function useLiveDuration(openedAt?: number | null): {
  durationSeconds: number;
  formattedDuration: string;
} {
  const calculate = () => {
    if (!openedAt || isNaN(Number(openedAt)) || Number(openedAt) <= 0) {
      return { durationSeconds: 0, formattedDuration: 'TIMESTAMP UNAVAILABLE' };
    }
    const diffSec = Math.max(0, Math.floor((Date.now() - Number(openedAt)) / 1000));
    return {
      durationSeconds: diffSec,
      formattedDuration: formatDuration(diffSec),
    };
  };

  const [duration, setDuration] = useState(calculate);

  useEffect(() => {
    if (!openedAt || isNaN(Number(openedAt)) || Number(openedAt) <= 0) {
      setDuration({ durationSeconds: 0, formattedDuration: 'TIMESTAMP UNAVAILABLE' });
      return;
    }

    // Set immediate calculation
    setDuration(calculate());

    // Schedule 1-second live clock tick
    const interval = setInterval(() => {
      setDuration(calculate());
    }, 1000);

    return () => clearInterval(interval);
  }, [openedAt]);

  return duration;
}
