/**
 * SideRail Component
 *
 * Desktop side navigation rail (Phase 3 mockup feature).
 * Displays on screens >= 900px width, replaces bottom navigation.
 */

import { Dumbbell, BookOpen, History, Settings } from '../icons';

interface SideRailProps {
  activeTab: 'train' | 'library' | 'history' | 'profile';
  onTabChange: (tab: 'train' | 'library' | 'history' | 'profile') => void;
  programName?: string;
}

export function SideRail({ activeTab, onTabChange, programName }: SideRailProps) {
  return (
    <aside className="side-rail">
      {/* Brand header */}
      <div className="side-rail-header">
        <div className="brand-mark">
          <Dumbbell className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-title-sm font-bold text-sys-onSurface truncate">
            Tracker
          </div>
          <div className="text-label-xs text-sys-onSurfaceVar uppercase tracking-wider">
            Workout App
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="side-rail-nav" aria-label="Main navigation">
        <button
          onClick={() => onTabChange('train')}
          className={`side-rail-nav-item ${activeTab === 'train' ? 'active' : ''}`}
          aria-label="Train"
          aria-current={activeTab === 'train' ? 'page' : undefined}
        >
          <Dumbbell className="w-6 h-6" />
          <span>Train</span>
        </button>

        <button
          onClick={() => onTabChange('library')}
          className={`side-rail-nav-item ${activeTab === 'library' ? 'active' : ''}`}
          aria-label="Library"
          aria-current={activeTab === 'library' ? 'page' : undefined}
        >
          <BookOpen className="w-6 h-6" />
          <span>Library</span>
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`side-rail-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          aria-label="History"
          aria-current={activeTab === 'history' ? 'page' : undefined}
        >
          <History className="w-6 h-6" />
          <span>History</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`side-rail-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          aria-label="Settings"
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <Settings className="w-6 h-6" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Program info (optional) */}
      {programName && (
        <div className="mt-auto pt-6 border-t border-sys-outlineVariant">
          <div className="text-label-xs text-sys-onSurfaceVar uppercase tracking-wider mb-1">
            Active Program
          </div>
          <div className="text-body-sm font-semibold text-sys-onSurface truncate">
            {programName}
          </div>
        </div>
      )}
    </aside>
  );
}
