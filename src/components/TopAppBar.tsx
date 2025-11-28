/**
 * TopAppBar Component
 *
 * A sticky header bar with optional back button, title, and subtitle.
 */

import { ArrowLeft } from 'lucide-react';

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export function TopAppBar({
  title,
  subtitle,
  onBack,
  showBack = false,
}: TopAppBarProps) {
  return (
    <div className="bg-sys-black sticky top-0 z-40 safe-pt border-b border-white/10">
      <div className="h-16 flex items-center px-5 gap-4">
        {showBack ? (
          <button
            onClick={onBack}
            className="h-10 w-10 -ml-1 text-sys-onSurface rounded-xl hover:bg-sys-surfaceHigh transition-colors flex items-center justify-center active:scale-90"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        ) : null}

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-sys-onSurface tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-sys-onSurfaceVar font-semibold mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
