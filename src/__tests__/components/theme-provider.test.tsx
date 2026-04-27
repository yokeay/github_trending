import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock next-themes before importing
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Must import after mock
import { ThemeProvider } from '@/components/theme-provider';

describe('ThemeProvider', () => {
  it('should render children', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test Content</div>
      </ThemeProvider>
    );
    expect(getByText('Test Content')).toBeDefined();
  });
});
