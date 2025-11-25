import { MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY } from '../constants';

/**
 * Time Formatting Utilities
 */

/**
 * Format a timestamp as relative time (e.g., "5 mins ago", "2 hours ago")
 * @param {string} isoTimestamp - ISO timestamp string
 * @returns {string|null} Formatted relative time or null if invalid
 */
export const formatRelativeTime = (isoTimestamp) => {
    if (!isoTimestamp) return null;
    
    const syncDate = new Date(isoTimestamp);
    
    // Validate date object
    if (isNaN(syncDate.getTime())) {
        console.warn('Invalid timestamp provided to formatRelativeTime:', isoTimestamp);
        return null;
    }
    
    const now = new Date();
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
    const diffHours = Math.floor(diffMs / MS_PER_HOUR);
    const diffDays = Math.floor(diffMs / MS_PER_DAY);
    
    if (diffMins < 1) {
        return 'just now';
    } else if (diffMins < 60) {
        return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
};

/**
 * Format seconds as MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};
