import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with default variant', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined();
  });

  it('should render with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button', { name: 'Outline' })).toBeDefined();
  });

  it('should render with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
  });

  it('should render with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: 'Ghost' })).toBeDefined();
  });

  it('should render with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeDefined();
  });

  it('should render with link variant', () => {
    render(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button', { name: 'Link' })).toBeDefined();
  });

  it('should render with different sizes', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button', { name: 'Small' })).toBeDefined();

    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button', { name: 'Large' })).toBeDefined();

    render(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button', { name: 'Icon' })).toBeDefined();
  });

  it('should forward ref', () => {
    let ref: HTMLButtonElement | null = null;
    render(
      <Button
        ref={el => {
          ref = el;
        }}
      >
        Ref Button
      </Button>
    );
    expect(ref).not.toBeNull();
  });

  it('should render as child when asChild is used', () => {
    render(
      <Button asChild>
        <span>Link Button</span>
      </Button>
    );
    expect(screen.getByText('Link Button')).toBeDefined();
  });
});
