/**
 * MD3 Components Tests
 *
 * Tests for new Material Design 3 components:
 * - TextField
 * - Divider
 * - ProgressIndicator
 * - RippleEffect
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TextField from '../components/TextField';
import Divider from '../components/Divider';
import { LinearProgress, CircularProgress } from '../components/ProgressIndicator';
import { useRipple } from '../components/RippleEffect';

describe('TextField Component', () => {
    it('should render with label and placeholder', () => {
        render(
            <TextField
                label="Email"
                placeholder="Enter your email"
                value=""
                onChange={() => {}}
            />
        );

        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    it('should handle value changes', () => {
        const mockChange = vi.fn();
        const { rerender } = render(
            <TextField
                label="Name"
                value=""
                onChange={mockChange}
            />
        );

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'John' } });

        expect(mockChange).toHaveBeenCalledWith('John');
    });

    it('should show error state', () => {
        render(
            <TextField
                label="Password"
                value="123"
                onChange={() => {}}
                error={true}
                errorMessage="Password too short"
            />
        );

        expect(screen.getByText('Password too short')).toBeInTheDocument();
    });

    it('should show supporting text', () => {
        render(
            <TextField
                label="Name"
                value=""
                onChange={() => {}}
                supportingText="Enter your full name"
            />
        );

        expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
        render(
            <TextField
                label="Disabled"
                value="test"
                onChange={() => {}}
                disabled={true}
            />
        );

        const input = screen.getByRole('textbox');
        expect(input).toBeDisabled();
    });

    it('should support required indicator', () => {
        render(
            <TextField
                label="Required Field"
                value=""
                onChange={() => {}}
                required={true}
            />
        );

        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render both filled and outlined variants', () => {
        const { container: filledContainer } = render(
            <TextField
                label="Filled"
                value=""
                onChange={() => {}}
                variant="filled"
            />
        );

        const filledElement = filledContainer.querySelector('.text-field-filled');
        expect(filledElement).toBeInTheDocument();

        const { container: outlinedContainer } = render(
            <TextField
                label="Outlined"
                value=""
                onChange={() => {}}
                variant="outlined"
            />
        );

        const outlinedElement = outlinedContainer.querySelector('.text-field-outlined');
        expect(outlinedElement).toBeInTheDocument();
    });
});

describe('Divider Component', () => {
    it('should render full-width divider', () => {
        const { container } = render(<Divider variant="full-width" />);
        expect(container.querySelector('.divider-full-width')).toBeInTheDocument();
    });

    it('should render inset divider', () => {
        const { container } = render(<Divider variant="inset" />);
        expect(container.querySelector('.divider-inset')).toBeInTheDocument();
    });

    it('should render divider with label', () => {
        render(<Divider label="Section Break" />);
        expect(screen.getByText('Section Break')).toBeInTheDocument();
    });
});

describe('Linear Progress Component', () => {
    it('should render determinate progress', () => {
        const { container } = render(
            <LinearProgress value={50} variant="determinate" />
        );
        expect(container.querySelector('.linear-progress-determinate')).toBeInTheDocument();
    });

    it('should render indeterminate progress', () => {
        const { container } = render(
            <LinearProgress variant="indeterminate" />
        );
        expect(container.querySelector('.linear-progress-indeterminate')).toBeInTheDocument();
    });

    it('should display progress value', () => {
        render(<LinearProgress value={75} variant="determinate" />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should support color variants', () => {
        const { container } = render(
            <LinearProgress value={50} color="success" />
        );
        expect(container.querySelector('.linear-progress-success')).toBeInTheDocument();
    });
});

describe('Circular Progress Component', () => {
    it('should render determinate circular progress', () => {
        const { container } = render(
            <CircularProgress value={50} variant="determinate" />
        );
        expect(container.querySelector('.circular-progress-determinate')).toBeInTheDocument();
    });

    it('should render indeterminate circular progress', () => {
        const { container } = render(
            <CircularProgress variant="indeterminate" />
        );
        expect(container.querySelector('.circular-progress-indeterminate')).toBeInTheDocument();
    });

    it('should support custom size', () => {
        const { container } = render(
            <CircularProgress size={64} value={50} />
        );
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '64');
        expect(svg).toHaveAttribute('height', '64');
    });
});

describe('useRipple Hook', () => {
    it('should create ripple on click', () => {
        function TestComponent() {
            const { ripples, createRipple } = useRipple();
            return (
                <div onClick={createRipple}>
                    {ripples.map((ripple) => (
                        <div key={ripple.id} className="ripple-test" />
                    ))}
                </div>
            );
        }

        const { container } = render(<TestComponent />);
        const element = container.querySelector('div');

        fireEvent.click(element!);
        expect(container.querySelector('.ripple-test')).toBeInTheDocument();
    });
});
