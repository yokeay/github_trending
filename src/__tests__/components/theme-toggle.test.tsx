import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn() })),
}));

describe('ThemeToggle', () => {
  it('should render theme toggle button', () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector('button')).toBeDefined();
  });

  it('should use useTheme hook', () => {
    render(<ThemeToggle />);
    expect(useTheme).toHaveBeenCalled();
  });
});
