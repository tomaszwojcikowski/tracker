/**
 * StatusPill Component
 *
 * Displays workout day status with appropriate styling.
 * Part of Phase 2 mockup implementation.
 */

import React from 'react';

interface StatusPillProps {
  status: 'completed' | 'up-next' | 'not-started';
  className?: string;
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'up-next':
        return 'Up next';
      case 'not-started':
        return 'Not started';
    }
  };

  const statusClass = `status-pill-${status}`;

  return (
    <span className={`status-pill ${statusClass} ${className}`}>
      {getStatusText()}
    </span>
  );
}
