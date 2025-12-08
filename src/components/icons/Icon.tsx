/**
 * Custom SVG Icon System
 *
 * Replaces Lucide icons with custom-designed SVG icons that match
 * the app's visual language: modern, rounded, cohesive.
 *
 * All icons use currentColor for fill/stroke, making them themeable.
 * Standard size is 24x24 with 2px stroke width.
 */

import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

const defaultProps: IconProps = {
  size: 24,
  strokeWidth: 2,
};

// Base wrapper for all icons
const IconBase: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 24,
  strokeWidth = 2,
  children,
  className = '',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

// ============================================================================
// NAVIGATION ICONS
// ============================================================================

export const ArrowLeft: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </IconBase>
);

export const ChevronLeft: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M15 18l-6-6 6-6" />
  </IconBase>
);

export const ChevronRight: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M9 18l6-6-6-6" />
  </IconBase>
);

export const ChevronUp: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M18 15l-6-6-6 6" />
  </IconBase>
);

export const ChevronDown: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M6 9l6 6 6-6" />
  </IconBase>
);

// ============================================================================
// ACTION ICONS
// ============================================================================

export const X: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </IconBase>
);

export const Plus: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
);

export const Minus: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M5 12h14" />
  </IconBase>
);

export const Check: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M20 6L9 17l-5-5" />
  </IconBase>
);

export const CheckCheck: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M18 6L9 17l-5-5" />
    <path d="M22 10l-9 9-2-2" />
  </IconBase>
);

export const CheckCircle: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </IconBase>
);

export const CheckSquare: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 12l2 2 4-4" />
  </IconBase>
);

export const Square: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
  </IconBase>
);

export const Search: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </IconBase>
);

export const RefreshCw: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </IconBase>
);

export const RotateCcw: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M3 2v6h6" />
    <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
    <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9" />
  </IconBase>
);

export const Maximize2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3l-7 7" />
    <path d="M3 21l7-7" />
  </IconBase>
);

export const Minimize2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M4 14h6v6" />
    <path d="M20 10h-6V4" />
    <path d="M14 10l7-7" />
    <path d="M3 21l7-7" />
  </IconBase>
);

export const Repeat: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </IconBase>
);

export const LogOut: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </IconBase>
);

// ============================================================================
// MEDIA ICONS
// ============================================================================

export const Play: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
  </IconBase>
);

export const PlayCircle: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
  </IconBase>
);

export const Pause: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
  </IconBase>
);

export const Volume2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </IconBase>
);

export const VolumeX: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M23 9l-6 6" />
    <path d="M17 9l6 6" />
  </IconBase>
);

// ============================================================================
// FITNESS ICONS
// ============================================================================

export const Dumbbell: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M6.5 6.5a2 2 0 0 0-3 0L2 8v8l1.5 1.5a2 2 0 0 0 3 0" />
    <path d="M17.5 6.5a2 2 0 0 1 3 0L22 8v8l-1.5 1.5a2 2 0 0 1-3 0" />
    <path d="M8 8v8" />
    <path d="M16 8v8" />
    <path d="M8 12h8" />
  </IconBase>
);

export const Activity: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </IconBase>
);

export const Zap: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none" />
  </IconBase>
);

export const Trophy: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 22V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v14" />
    <path d="M8 6h8a4 4 0 0 1-8 8" />
    <path d="M8 6a4 4 0 0 0 8 8" />
  </IconBase>
);

export const Target: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </IconBase>
);

export const TrendingUp: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M22 7l-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </IconBase>
);

export const BarChart2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="10" y="3" width="4" height="18" rx="1" />
    <rect x="18" y="8" width="4" height="13" rx="1" />
    <rect x="2" y="13" width="4" height="8" rx="1" />
  </IconBase>
);

// ============================================================================
// TIME ICONS
// ============================================================================

export const Timer: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2" />
    <path d="M5 3L2 6" />
    <path d="M22 6l-3-3" />
    <path d="M12 5V3" />
  </IconBase>
);

export const Clock: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </IconBase>
);

export const Calendar: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </IconBase>
);

export const History: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M3 3v5h5" />
    <path d="M3.51 9a9 9 0 1 0 2.13-5.36L3 6" />
    <path d="M12 8v4l2 2" />
  </IconBase>
);

// ============================================================================
// UI ICONS
// ============================================================================

export const Settings: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4m0 14v4m11-11h-4M5 12H1m17.36-5.64l-2.83 2.83M9.17 14.83l-2.83 2.83m11.32 0l-2.83-2.83M9.17 9.17L6.34 6.34" />
  </IconBase>
);

export const Settings2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </IconBase>
);

export const Info: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <circle cx="12" cy="8" r="0.5" fill="currentColor" />
  </IconBase>
);

export const AlertCircle: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
  </IconBase>
);

export const BookOpen: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </IconBase>
);

export const Cloud: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </IconBase>
);

export const Hand: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M18 11V6a2 2 0 0 0-4 0v5" />
    <path d="M14 10V4a2 2 0 0 0-4 0v6" />
    <path d="M10 10V6a2 2 0 0 0-4 0v8" />
    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </IconBase>
);

export const Loader2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props} className={`animate-spin ${props.className || ''}`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </IconBase>
);

// ============================================================================
// ADDITIONAL ICONS (from extended usage)
// ============================================================================

export const Flame: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor" stroke="none" />
  </IconBase>
);

export const Snowflake: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M12 2v20" />
    <path d="M8 4l4 4 4-4" />
    <path d="M8 20l4-4 4 4" />
    <path d="M2 12h20" />
    <path d="M4 8l4 4-4 4" />
    <path d="M20 8l-4 4 4 4" />
  </IconBase>
);

export const LayoutGrid: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </IconBase>
);

export const LayoutList: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="3" y="3" width="7" height="4" rx="1" />
    <rect x="3" y="10" width="7" height="4" rx="1" />
    <rect x="3" y="17" width="7" height="4" rx="1" />
    <rect x="14" y="4" width="7" height="2" rx="1" />
    <rect x="14" y="11" width="7" height="2" rx="1" />
    <rect x="14" y="18" width="7" height="2" rx="1" />
  </IconBase>
);

export const PlusCircle: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </IconBase>
);

export const CheckCircle2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </IconBase>
);

export const StickyNote: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
    <path d="M15 3v6h6" />
  </IconBase>
);

export const Palette: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
  </IconBase>
);

export const Eye: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

export const EyeOff: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </IconBase>
);

export const ChartLine: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M3 3v18h18" />
    <path d="M18 9l-5 5-4-4-3 3" />
  </IconBase>
);

export const Trash2: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </IconBase>
);

export const Edit: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconBase>
);

export const MoreVertical: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </IconBase>
);

export const Menu: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </IconBase>
);

export const Home: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </IconBase>
);

export const User: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);

export const Star: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </IconBase>
);

export const Heart: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </IconBase>
);

export const Award: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </IconBase>
);

export const Layers: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </IconBase>
);

export const CalendarDays: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </IconBase>
);

export const BarChart3: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="8" rx="1" />
    <rect x="12" y="6" width="3" height="12" rx="1" />
    <rect x="17" y="12" width="3" height="6" rx="1" />
  </IconBase>
);

export const MessageSquare: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </IconBase>
);

export const MessageCircle: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </IconBase>
);

export const FileText: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </IconBase>
);

export const ArrowDownCircle: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l4 4 4-4" />
    <path d="M12 8v8" />
  </IconBase>
);

export const Lock: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconBase>
);

export const Send: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22l-4-9-9-4z" />
  </IconBase>
);

export const Download: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconBase>
);

export const Upload: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconBase>
);

export const CloudOff: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M2 2l20 20" />
    <path d="M8.6 8.6A8 8 0 0 0 9 20h9a5 5 0 0 0 1.7-.3" />
    <path d="M22 15a5 5 0 0 0-5-5h-1.26a8 8 0 0 0-2.17-4.15" />
    <path d="M5 5a8 8 0 0 0 2.1 5.3" />
  </IconBase>
);

export const Wind: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </IconBase>
);

export const Filter: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </IconBase>
);

export const ArrowRightLeft: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M21 7H3" />
    <path d="M18 4l3 3-3 3" />
    <path d="M3 17h18" />
    <path d="M6 14l-3 3 3 3" />
  </IconBase>
);

export const ArrowRight: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </IconBase>
);

export const Copy: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </IconBase>
);

export const Share: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98" />
    <path d="M15.41 6.51l-6.82 3.98" />
  </IconBase>
);

export const ExternalLink: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </IconBase>
);

export const ClipboardList: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </IconBase>
);

export const Edit3: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </IconBase>
);

export const Save: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </IconBase>
);

export const XCircle: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
  </IconBase>
);

export const Gauge: React.FC<IconProps> = (props) => (
  <IconBase {...defaultProps} {...props}>
    <path d="M12 15V8" />
    <circle cx="12" cy="15" r="1" />
    <path d="M17.2 17.2A8 8 0 1 0 4.8 5" />
    <path d="M12 2v2" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </IconBase>
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// LucideIcon type compatibility
export type LucideIcon = React.FC<IconProps>;

// Default export with all icons
const Icons = {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart2,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Cloud,
  Dumbbell,
  Hand,
  History,
  Info,
  Loader2,
  LogOut,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  Repeat,
  RotateCcw,
  Search,
  Settings,
  Settings2,
  Square,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
  // Extended icons
  Flame,
  Snowflake,
  LayoutGrid,
  LayoutList,
  PlusCircle,
  CheckCircle2,
  StickyNote,
  Palette,
  Eye,
  EyeOff,
  ChartLine,
  Trash2,
  Edit,
  MoreVertical,
  Menu,
  Home,
  User,
  Star,
  Heart,
  Award,
  Layers,
  CalendarDays,
  BarChart3,
  MessageSquare,
  MessageCircle,
  FileText,
  ArrowDownCircle,
  Lock,
  Send,
  Download,
  Upload,
  CloudOff,
  Wind,
  Filter,
};

export default Icons;
