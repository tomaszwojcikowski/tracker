import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLink } from '../components/SkipLink';

describe('SkipLink', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders with default props', () => {
        render(<SkipLink />);
        
        const link = screen.getByRole('link', { name: /skip to main content/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '#main-content');
    });

    it('renders with custom targetId', () => {
        render(<SkipLink targetId="custom-content" />);
        
        const link = screen.getByRole('link', { name: /skip to main content/i });
        expect(link).toHaveAttribute('href', '#custom-content');
    });

    it('renders with custom label', () => {
        render(<SkipLink label="Skip navigation" />);
        
        const link = screen.getByRole('link', { name: /skip navigation/i });
        expect(link).toBeInTheDocument();
    });

    it('has the skip-link class for styling', () => {
        render(<SkipLink />);
        
        const link = screen.getByRole('link', { name: /skip to main content/i });
        expect(link).toHaveClass('skip-link');
    });

    it('focuses target element on click', () => {
        // Create a mock target element
        const targetElement = document.createElement('main');
        targetElement.id = 'main-content';
        document.body.appendChild(targetElement);
        
        // Mock the focus method
        const focusSpy = vi.spyOn(targetElement, 'focus');
        
        render(<SkipLink targetId="main-content" />);
        
        const link = screen.getByRole('link', { name: /skip to main content/i });
        fireEvent.click(link);
        
        expect(focusSpy).toHaveBeenCalled();
        expect(targetElement).toHaveAttribute('tabindex', '-1');
        
        // Cleanup
        document.body.removeChild(targetElement);
    });

    it('does nothing if target element does not exist', () => {
        render(<SkipLink targetId="non-existent" />);
        
        const link = screen.getByRole('link', { name: /skip to main content/i });
        
        // Should not throw when clicking
        expect(() => fireEvent.click(link)).not.toThrow();
    });
});
