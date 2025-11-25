/**
 * HTML Sanitization Utilities
 *
 * Uses DOMPurify to prevent XSS attacks when rendering user-generated
 * or AI-generated content with dangerouslySetInnerHTML.
 */
import DOMPurify from 'dompurify';

/**
 * DOMPurify configuration type for allowed tags and attributes
 */
interface PurifyConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ADD_ATTR: string[];
  ALLOWED_URI_REGEXP: RegExp;
}

// Configure DOMPurify with allowed tags and attributes for markdown rendering
const PURIFY_CONFIG: PurifyConfig = {
  ALLOWED_TAGS: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'ul',
    'ol',
    'li',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'code',
    'pre',
    'blockquote',
    'a',
    'span',
    'div',
  ],
  ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
  // Force links to open in new tab with security attributes
  ADD_ATTR: ['target', 'rel'],
  // Disallow data: and javascript: URIs
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Configure link safety
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const sanitized = DOMPurify.sanitize(html, PURIFY_CONFIG);

  // Remove the hook after use to avoid memory leaks
  DOMPurify.removeHook('afterSanitizeAttributes');

  return sanitized;
}

export default sanitizeHtml;
