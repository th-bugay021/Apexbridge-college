import { useEffect, useMemo, useRef, useState } from 'react';

function parseFormattedNumber(value) {
  const text = String(value ?? '');
  const match = text.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0].replaceAll(',', ''));
  if (!Number.isFinite(number)) return null;
  return {
    number,
    prefix: text.slice(0, match.index),
    suffix: text.slice(match.index + match[0].length),
    decimals: (match[0].split('.')[1] || '').length,
  };
}

function formatValue(parts, value) {
  const number = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: parts.decimals,
    maximumFractionDigits: parts.decimals,
  }).format(value);
  return `${parts.prefix}${number}${parts.suffix}`;
}

export default function CountUp({ value, duration = 1000 }) {
  const parts = useMemo(() => parseFormattedNumber(value), [value]);
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const currentValueRef = useRef(reducedMotion ? (parts?.number ?? 0) : 0);
  const frameRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(() => (
    parts && !reducedMotion && duration > 0 ? formatValue(parts, 0) : value
  ));

  useEffect(() => {
    if (!parts) return undefined;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const target = parts.number;
    if (motionPreference.matches || duration <= 0) {
      currentValueRef.current = target;
      return undefined;
    }

    const startValue = currentValueRef.current;
    let startTime = null;
    const animate = (time) => {
      if (startTime === null) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);
      const current = startValue + ((target - startValue) * easedProgress);
      currentValueRef.current = current;
      setDisplayValue(formatValue(parts, current));

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
        currentValueRef.current = target;
        setDisplayValue(value);
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [duration, parts, value]);

  const shownValue = reducedMotion || duration <= 0 ? value : displayValue;
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{shownValue}</span>;
}
