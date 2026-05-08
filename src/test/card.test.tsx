/**
 * Card Component Tests
 *
 * Comprehensive tests for Material Design 3 Card component variants and sub-components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardContent, CardActions } from '../components/Card';

describe('Card Component', () => {
  describe('Card - Main Component', () => {
    it('renders with default variant (elevated)', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('card', 'card-elevated');
    });

    it('renders filled variant', () => {
      const { container } = render(<Card variant="filled">Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('card-filled');
    });

    it('renders outlined variant', () => {
      const { container } = render(<Card variant="outlined">Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('card-outlined');
    });

    it('renders children content', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('custom-class');
    });

    it('handles interactive cards with onClick', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      if (card) {
        fireEvent.click(card);
        expect(handleClick).toHaveBeenCalled();
      }
    });

    it('has proper keyboard support for interactive cards', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Content</Card>);
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveAttribute('tabindex', '0');

      if (card) {
        fireEvent.keyDown(card, { key: 'Enter' });
        fireEvent.keyDown(card, { key: ' ' });
      }

      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('does not trigger card action when nested controls are clicked or activated by keyboard', () => {
      const handleCardClick = vi.fn();
      const handleButtonClick = vi.fn();

      render(
        <Card onClick={handleCardClick}>
          <button onClick={handleButtonClick}>Nested action</button>
        </Card>
      );

      const button = screen.getByText('Nested action');

      fireEvent.click(button);
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleButtonClick).toHaveBeenCalledTimes(1);
      expect(handleCardClick).not.toHaveBeenCalled();
    });

    it('does not trigger card action when nested links are clicked', () => {
      const handleCardClick = vi.fn();

      render(
        <Card onClick={handleCardClick}>
          <a href="#details">Details</a>
        </Card>
      );

      fireEvent.click(screen.getByRole('link', { name: 'Details' }));

      expect(handleCardClick).not.toHaveBeenCalled();
    });

    it('sets aria-label when provided', () => {
      const { container } = render(<Card ariaLabel="Important card">Content</Card>);
      const card = container.querySelector('[aria-label="Important card"]');
      expect(card).toBeInTheDocument();
    });

    it('supports interactive prop', () => {
      const { container } = render(
        <Card interactive onClick={vi.fn()}>
          Content
        </Card>
      );
      const card = container.querySelector('.card');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('CardHeader - Header Section', () => {
    it('renders header title', () => {
      render(
        <Card>
          <CardHeader>Card Title</CardHeader>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders header with subtitle', () => {
      render(
        <Card>
          <CardHeader subtitle="This is subtitle">Card Title</CardHeader>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('This is subtitle')).toBeInTheDocument();
    });

    it('applies proper CSS classes to title and subtitle', () => {
      const { container } = render(
        <Card>
          <CardHeader subtitle="Subtitle">Title</CardHeader>
        </Card>
      );

      const title = container.querySelector('.card-title');
      const subtitle = container.querySelector('.card-subtitle');

      expect(title).toHaveTextContent('Title');
      expect(subtitle).toHaveTextContent('Subtitle');
    });

    it('renders with leading element', () => {
      const { container } = render(
        <Card>
          <CardHeader leading={<div data-testid="leading">Leading</div>}>Title</CardHeader>
        </Card>
      );

      const leading = screen.getByTestId('leading');
      expect(leading).toBeInTheDocument();
      expect(container.querySelector('.card-header-leading')).toContainElement(leading);
    });

    it('renders with trailing element', () => {
      const { container } = render(
        <Card>
          <CardHeader trailing={<div data-testid="trailing">Trailing</div>}>Title</CardHeader>
        </Card>
      );

      const trailing = screen.getByTestId('trailing');
      expect(trailing).toBeInTheDocument();
      expect(container.querySelector('.card-header-trailing')).toContainElement(trailing);
    });

    it('applies custom className to header', () => {
      const { container } = render(
        <Card>
          <CardHeader className="custom-header">Title</CardHeader>
        </Card>
      );

      const header = container.querySelector('.card-header');
      expect(header).toHaveClass('custom-header');
    });

    it('renders all header parts together', () => {
      const { container } = render(
        <Card>
          <CardHeader
            leading={<span>Icon</span>}
            subtitle="Subtitle"
            trailing={<button>Action</button>}
          >
            Title
          </CardHeader>
        </Card>
      );

      expect(container.querySelector('.card-header-leading')).toBeInTheDocument();
      expect(container.querySelector('.card-title')).toBeInTheDocument();
      expect(container.querySelector('.card-subtitle')).toBeInTheDocument();
      expect(container.querySelector('.card-header-trailing')).toBeInTheDocument();
    });
  });

  describe('CardContent - Content Section', () => {
    it('renders content text', () => {
      render(
        <Card>
          <CardContent>Content Text</CardContent>
        </Card>
      );
      expect(screen.getByText('Content Text')).toBeInTheDocument();
    });

    it('renders complex content with multiple children', () => {
      render(
        <Card>
          <CardContent>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });

    it('applies custom className to content', () => {
      const { container } = render(
        <Card>
          <CardContent className="custom-content">Content</CardContent>
        </Card>
      );

      const content = container.querySelector('.card-content');
      expect(content).toHaveClass('custom-content');
    });

    it('applies card-content class', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );

      const content = container.querySelector('.card-content');
      expect(content).toHaveClass('card-content');
    });
  });

  describe('CardActions - Actions Section', () => {
    it('renders action buttons', () => {
      const { container } = render(
        <Card>
          <CardActions>
            <button>Button 1</button>
            <button>Button 2</button>
          </CardActions>
        </Card>
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });

    it('renders with default row direction', () => {
      const { container } = render(
        <Card>
          <CardActions>
            <button>Action</button>
          </CardActions>
        </Card>
      );

      const actions = container.querySelector('.card-actions');
      expect(actions).toHaveClass('flex-row');
    });

    it('renders with column direction', () => {
      const { container } = render(
        <Card>
          <CardActions direction="column">
            <button>Action 1</button>
            <button>Action 2</button>
          </CardActions>
        </Card>
      );

      const actions = container.querySelector('.card-actions');
      expect(actions).toHaveClass('flex-col');
    });

    it('applies custom className to actions', () => {
      const { container } = render(
        <Card>
          <CardActions className="custom-actions">
            <button>Action</button>
          </CardActions>
        </Card>
      );

      const actions = container.querySelector('.card-actions');
      expect(actions).toHaveClass('custom-actions');
    });

    it('handles button clicks in actions', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <Card>
          <CardActions>
            <button onClick={handleClick}>Action</button>
          </CardActions>
        </Card>
      );

      const button = container.querySelector('button');
      if (button) {
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Full Card Composition', () => {
    it('renders complete card with all sections', () => {
      const { container } = render(
        <Card variant="elevated">
          <CardHeader subtitle="Subtitle">Title</CardHeader>
          <CardContent>Content goes here</CardContent>
          <CardActions>
            <button>Cancel</button>
            <button>Confirm</button>
          </CardActions>
        </Card>
      );

      expect(container.querySelector('.card-header')).toBeInTheDocument();
      expect(container.querySelector('.card-content')).toBeInTheDocument();
      expect(container.querySelector('.card-actions')).toBeInTheDocument();
    });

    it('renders card with all variants and full content', () => {
      const variants: Array<'filled' | 'elevated' | 'outlined'> = [
        'filled',
        'elevated',
        'outlined',
      ];

      variants.forEach((variant) => {
        const { container } = render(
          <Card variant={variant} ariaLabel={`${variant} card`}>
            <CardHeader>Header</CardHeader>
            <CardContent>Content</CardContent>
            <CardActions>
              <button>Action</button>
            </CardActions>
          </Card>
        );

        const card = container.querySelector('.card');
        expect(card).toHaveClass(`card-${variant}`);
      });
    });

    it('interactive card with full content and actions', () => {
      const handleCardClick = vi.fn();
      const handleButtonClick = vi.fn();

      const { container } = render(
        <Card onClick={handleCardClick} variant="filled" interactive>
          <CardHeader>Interactive Card</CardHeader>
          <CardContent>Content</CardContent>
          <CardActions>
            <button onClick={handleButtonClick}>Action</button>
          </CardActions>
        </Card>
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      if (button) {
        fireEvent.click(button);
        expect(handleButtonClick).toHaveBeenCalledTimes(1);
      }
      expect(handleCardClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('interactive card has proper role and tabindex', () => {
      const { container } = render(<Card onClick={vi.fn()}>Content</Card>);
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('non-interactive card does not have button role', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('.card');
      expect(card).not.toHaveAttribute('role', 'button');
    });

    it('card with aria-label is properly labeled', () => {
      const { container } = render(<Card ariaLabel="Dialog card">Content</Card>);
      const card = container.querySelector('[aria-label="Dialog card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies all base card classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('.card');
      expect(card?.className).toMatch(/card card-elevated/);
    });

    it('combines multiple classNames properly', () => {
      const { container } = render(
        <Card variant="filled" className="custom-1 custom-2">
          Content
        </Card>
      );
      const card = container.querySelector('.card');
      expect(card).toHaveClass('card', 'card-filled', 'custom-1', 'custom-2');
    });
  });
});
