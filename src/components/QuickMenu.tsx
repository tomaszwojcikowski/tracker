/**
 * QuickMenu Component
 *
 * Dropdown menu in the top app bar for quick access to:
 * - Theme selector
 * - App info
 * - Settings navigation
 */

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Palette, Info, Settings as SettingsIcon, X } from '../icons';
import { useTheme, type ThemeId, type ThemeInfo } from '../hooks';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickMenuProps {
  /** Callback to navigate to settings */
  onNavigateToSettings?: () => void;
}

export function QuickMenu({ onNavigateToSettings }: QuickMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentTheme, setTheme, themes } = useTheme();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowThemeSelector(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowThemeSelector(false);
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleThemeChange = (themeId: ThemeId) => {
    setTheme(themeId);
    // Keep menu open after theme change for easy comparison
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    onNavigateToSettings?.();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full hover:bg-sys-surfaceVariant/30 active:bg-sys-surfaceVariant/50 transition-colors flex items-center justify-center text-sys-onSurface"
        aria-label="Quick menu"
        aria-expanded={isOpen}
      >
        <MoreVertical size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-sys-surfaceHigh rounded-2xl shadow-lg border border-sys-outlineVariant overflow-hidden z-50"
          >
            {!showThemeSelector ? (
              <div className="py-2">
                {/* Theme Option */}
                <button
                  onClick={() => setShowThemeSelector(true)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-sys-surfaceVariant/30 transition-colors text-left"
                >
                  <Palette size={20} className="text-sys-onSurface" />
                  <div className="flex-1">
                    <div className="text-body-md text-sys-onSurface font-medium">Theme</div>
                    <div className="text-body-sm text-sys-onSurfaceVariant">
                      {themes.find((t: ThemeInfo) => t.id === currentTheme)?.name || 'Classic Dark'}
                    </div>
                  </div>
                </button>

                <div className="h-px bg-sys-outlineVariant my-1" />

                {/* App Info */}
                <div className="px-4 py-3 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Info size={20} className="text-sys-onSurface" />
                    <div className="text-body-md text-sys-onSurface font-medium">App Info</div>
                  </div>
                  <div className="text-body-sm text-sys-onSurfaceVariant space-y-1 ml-8">
                    <div>Version: 1.0.0</div>
                    <div>Build: Dec 2025</div>
                  </div>
                </div>

                <div className="h-px bg-sys-outlineVariant my-1" />

                {/* Settings Link */}
                <button
                  onClick={handleSettingsClick}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-sys-surfaceVariant/30 transition-colors text-left"
                >
                  <SettingsIcon size={20} className="text-sys-onSurface" />
                  <div className="text-body-md text-sys-onSurface font-medium">Settings</div>
                </button>
              </div>
            ) : (
              <div className="py-2">
                {/* Theme Selector Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-sys-outlineVariant">
                  <div className="flex items-center gap-3">
                    <Palette size={20} className="text-sys-onSurface" />
                    <div className="text-body-md text-sys-onSurface font-medium">Select Theme</div>
                  </div>
                  <button
                    onClick={() => setShowThemeSelector(false)}
                    className="h-8 w-8 rounded-full hover:bg-sys-surfaceVariant/30 transition-colors flex items-center justify-center"
                    aria-label="Back to menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Theme Options */}
                <div className="max-h-[400px] overflow-y-auto">
                  {themes.map((themeOption: ThemeInfo) => (
                    <button
                      key={themeOption.id}
                      onClick={() => handleThemeChange(themeOption.id)}
                      className={clsx(
                        "w-full px-4 py-3 flex items-center gap-3 transition-colors text-left",
                        currentTheme === themeOption.id
                          ? "bg-sys-primaryContainer text-sys-onPrimaryContainer"
                          : "hover:bg-sys-surfaceVariant/30 text-sys-onSurface"
                      )}
                    >
                      <div className="flex-1">
                        <div className="text-body-md font-medium">{themeOption.name}</div>
                        {themeOption.description && (
                          <div className={clsx(
                            "text-body-sm mt-0.5",
                            currentTheme === themeOption.id
                              ? "text-sys-onPrimaryContainer/70"
                              : "text-sys-onSurfaceVariant"
                          )}>
                            {themeOption.description}
                          </div>
                        )}
                      </div>
                      {currentTheme === themeOption.id && (
                        <div className="w-2 h-2 rounded-full bg-sys-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
