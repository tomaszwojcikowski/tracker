import React from 'react';
import { Timer } from './icons';

export type TimeBadgeSize = 'card' | 'compact';
export type TimeBadgeVariant = 'badge' | 'inline';

export interface TimeBadgeProps {
  seconds: number;
  size?: TimeBadgeSize;
  variant?: TimeBadgeVariant;
}

export function formatSecondsShort(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));

  if (safeSeconds >= 60 && safeSeconds % 60 === 0) return `${safeSeconds / 60}m`;
  if (safeSeconds < 100) return `${safeSeconds}s`;

  if (safeSeconds < 3600) {
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  const hours = Math.floor(safeSeconds / 3600);
  const remaining = safeSeconds % 3600;
  const minutes = Math.floor(remaining / 60);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${minutes}m`;
}

export const TimeBadge: React.FC<TimeBadgeProps> = ({ seconds, size = 'card', variant = 'badge' }) => {
  const iconSize = size === 'compact' ? 8 : 10;

  if (variant === 'inline') {
    return (
      <span>{formatSecondsShort(seconds)}</span>
    );
  }

  const baseClasses =
    size === 'compact'
      ? 'inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full flex-shrink-0'
      : 'inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full';

  return (
    <span
      className={`${baseClasses} bg-sys-primaryContainer text-sys-onPrimaryContainer border border-sys-primary/30`}
      aria-label={`Timed exercise: ${formatSecondsShort(seconds)}`}
    >
      <Timer size={iconSize} strokeWidth={3} />
      <span className={size === 'compact' ? 'text-[8px]' : undefined}>{formatSecondsShort(seconds)}</span>
    </span>
  );
};
