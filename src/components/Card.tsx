/**
 * Card Component
 *
 * Material Design 3 card component with multiple variants.
 * Provides consistent card styling and behavior across the app.
 */

import React from 'react';

export interface CardProps {
  /** Card variant: filled (most emphasized), elevated (floating), outlined (subtle) */
  variant?: 'filled' | 'elevated' | 'outlined';
  /** Additional CSS classes */
  className?: string;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Card content */
  children: React.ReactNode;
  /** Whether card is clickable/interactive */
  interactive?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

export interface CardHeaderProps {
  /** Header content (usually title) */
  children: React.ReactNode;
  /** Supporting text below title */
  subtitle?: React.ReactNode;
  /** Leading icon/avatar */
  leading?: React.ReactNode;
  /** Trailing action */
  trailing?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface CardContentProps {
  /** Content body */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface CardActionsProps {
  /** Action buttons/controls */
  children: React.ReactNode;
  /** Flex direction: row (default) or column */
  direction?: 'row' | 'column';
  /** Additional CSS classes */
  className?: string;
}

const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'textarea', 'select', 'summary']);
const INTERACTIVE_ROLES = new Set(['button', 'link', 'checkbox', 'switch', 'menuitem', 'tab']);

function isNestedInteractiveElement(target: HTMLElement, currentTarget: HTMLElement): boolean {
  let element: HTMLElement | null = target;

  while (element && element !== currentTarget) {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');

    if (
      INTERACTIVE_TAGS.has(tagName) ||
      (role !== null && INTERACTIVE_ROLES.has(role)) ||
      element.dataset.interactive === 'true'
    ) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

/**
 * Main Card component
 * @example
 * <Card variant="elevated">
 *   <CardHeader subtitle="Subtitle text">Card Title</CardHeader>
 *   <CardContent>Card content goes here</CardContent>
 *   <CardActions>
 *     <button>Action 1</button>
 *     <button>Action 2</button>
 *   </CardActions>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  className = '',
  onClick,
  children,
  interactive = false,
  ariaLabel,
}) => {
  const baseClasses = `card card-${variant}`;
  const interactiveClasses = interactive || onClick ? 'cursor-pointer' : '';
  const allClasses = `${baseClasses} ${interactiveClasses} ${className}`.trim();

  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return;

    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (target === currentTarget || !isNestedInteractiveElement(target, currentTarget)) {
      onClick();
    }
  };

  return (
    <div
      className={allClasses}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.target !== e.currentTarget) {
                return;
              }

              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

/**
 * Card header section with title and optional subtitle
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  subtitle,
  leading,
  trailing,
  className = '',
}) => {
  return (
    <div className={`card-header ${className}`.trim()}>
      {leading && <div className="card-header-leading">{leading}</div>}
      <div className="card-header-content">
        <div className="card-title">{children}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {trailing && <div className="card-header-trailing">{trailing}</div>}
    </div>
  );
};

/**
 * Card content/body section
 */
export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`card-content ${className}`.trim()}>{children}</div>;
};

/**
 * Card actions footer section with button group
 */
export const CardActions: React.FC<CardActionsProps> = ({
  children,
  direction = 'row',
  className = '',
}) => {
  const flexDir = direction === 'column' ? 'flex-col' : 'flex-row';
  return <div className={`card-actions ${flexDir} ${className}`.trim()}>{children}</div>;
};
