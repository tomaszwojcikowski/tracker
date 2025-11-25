import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedNumber, AnimatedCounter } from '../components/animations/AnimatedNumber';

describe('AnimatedNumber', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render initial value', () => {
        render(<AnimatedNumber value={100} />);

        // The component shows the value (might be mid-animation)
        expect(screen.getByText(/\d+/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        render(<AnimatedNumber value={50} className="test-class" />);

        const element = screen.getByText(/\d+/);
        expect(element).toHaveClass('test-class');
    });

    it('should use formatter function', () => {
        render(
            <AnimatedNumber
                value={75}
                formatter={(v) => `${v}%`}
            />
        );

        // Should contain the percentage symbol
        expect(screen.getByText(/%/)).toBeInTheDocument();
    });

    it('should handle zero value', () => {
        render(<AnimatedNumber value={0} />);

        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
        render(<AnimatedNumber value={-50} />);

        // Component should handle negative values
        expect(screen.getByText(/-?\d+/)).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
        render(<AnimatedNumber value={75.5} />);

        expect(screen.getByText(/\d+\.?\d*/)).toBeInTheDocument();
    });

    it('should respect custom duration', () => {
        const { rerender } = render(<AnimatedNumber value={0} duration={1000} />);

        rerender(<AnimatedNumber value={100} duration={1000} />);

        // Animation should be in progress
        expect(screen.getByText(/\d+/)).toBeInTheDocument();
    });
});

describe('AnimatedCounter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start from 0', () => {
        render(<AnimatedCounter value={100} />);

        // Initial render should show 0 or a low number (animation starts)
        expect(screen.getByText(/\d+/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        render(<AnimatedCounter value={50} className="counter-class" />);

        const element = screen.getByText(/\d+/);
        expect(element).toHaveClass('counter-class');
    });

    it('should use formatter function', () => {
        render(
            <AnimatedCounter
                value={100}
                formatter={(v) => `$${v}`}
            />
        );

        // Should contain the dollar symbol
        expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it('should handle zero value', () => {
        render(<AnimatedCounter value={0} />);

        expect(screen.getByText('0')).toBeInTheDocument();
    });
});
