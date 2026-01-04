/**
 * TextField Component
 *
 * Material Design 3 text field implementation with:
 * - Filled and outlined variants
 * - Proper labels and supporting text
 * - Error states with validation
 * - Focus and disabled states
 * - Touch-friendly sizing (48dp minimum height)
 */

import React, { forwardRef, useId } from 'react';
import { AlertCircle } from './icons';

export interface TextFieldProps {
    /** Text field value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Field label */
    label: string;
    /** Placeholder text */
    placeholder?: string;
    /** Supporting text below field */
    supportingText?: string;
    /** Error state */
    error?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    /** Input variant: 'filled' | 'outlined' */
    variant?: 'filled' | 'outlined';
    /** Field icon (left) */
    iconLeft?: React.ReactNode;
    /** Field icon (right) */
    iconRight?: React.ReactNode;
    /** Max length */
    maxLength?: number;
    /** Required field indicator */
    required?: boolean;
    /** Input mode for mobile keyboards */
    inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
    /** Blur handler */
    onBlur?: () => void;
    /** Focus handler */
    onFocus?: () => void;
    /** Keydown handler */
    onKeyDown?: (e: React.KeyboardEvent) => void;
    /** Auto-focus */
    autoFocus?: boolean;
    /** Aria label */
    ariaLabel?: string;
}

/**
 * MD3 TextField Component
 *
 * Specs:
 * - Height: 56dp (filled), 56dp (outlined)
 * - Corner radius: 4dp (extra small, filled) | 4dp (outlined)
 * - Container color: surface container high (filled) | transparent (outlined)
 * - Label color: on surface variant
 * - Supporting text: 12px, on surface variant
 * - Focus: highlight with primary color
 * - Error: error color for label, border, supporting text
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    (
        {
            value,
            onChange,
            label,
            placeholder,
            supportingText,
            error = false,
            errorMessage,
            disabled = false,
            type = 'text',
            variant = 'outlined',
            iconLeft,
            iconRight,
            maxLength,
            required = false,
            inputMode,
            onBlur,
            onFocus,
            onKeyDown,
            autoFocus = false,
            ariaLabel,
        },
        ref
    ) => {
        const id = useId();
        const labelId = `label-${id}`;
        const supportingId = `supporting-${id}`;
        const errorId = `error-${id}`;

        const containerClass = `
            text-field-container
            text-field-${variant}
            ${disabled ? 'text-field-disabled' : ''}
            ${error ? 'text-field-error' : ''}
            ${iconLeft ? 'text-field-icon-left' : ''}
            ${iconRight ? 'text-field-icon-right' : ''}
        `.trim();

        const inputClass = `
            text-field-input
            text-field-input-${variant}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'text-field-input-error' : ''}
        `.trim();

        return (
            <div className={containerClass}>
                {/* Label */}
                <label
                    htmlFor={id}
                    className={`
                        text-field-label
                        ${error ? 'text-field-label-error' : ''}
                        ${disabled ? 'text-field-label-disabled' : ''}
                    `.trim()}
                    id={labelId}
                >
                    {label}
                    {required && <span className="text-field-required">*</span>}
                </label>

                {/* Input container */}
                <div className="text-field-input-wrapper">
                    {/* Left icon */}
                    {iconLeft && (
                        <div className="text-field-icon text-field-icon-left-slot">
                            {iconLeft}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        id={id}
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        maxLength={maxLength}
                        inputMode={inputMode}
                        autoFocus={autoFocus}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        onKeyDown={onKeyDown}
                        aria-label={ariaLabel || label}
                        aria-describedby={
                            error ? errorId : supportingText ? supportingId : undefined
                        }
                        aria-invalid={error}
                        className={inputClass}
                    />

                    {/* Right icon */}
                    {iconRight && (
                        <div className="text-field-icon text-field-icon-right-slot">
                            {iconRight}
                        </div>
                    )}

                    {/* Error icon */}
                    {error && !iconRight && (
                        <div className="text-field-icon text-field-icon-right-slot text-sys-error">
                            <AlertCircle size={20} />
                        </div>
                    )}
                </div>

                {/* Supporting text or error message */}
                {(supportingText || errorMessage) && (
                    <div
                        className={`
                            text-field-supporting
                            ${error ? 'text-field-supporting-error' : ''}
                        `.trim()}
                        id={error ? errorId : supportingId}
                    >
                        {error ? errorMessage || supportingText : supportingText}
                    </div>
                )}

                {/* Character count (optional) */}
                {maxLength && (
                    <div className="text-field-counter">
                        {value.length} / {maxLength}
                    </div>
                )}
            </div>
        );
    }
);

TextField.displayName = 'TextField';

export default TextField;
