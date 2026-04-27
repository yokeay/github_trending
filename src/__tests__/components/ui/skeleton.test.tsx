import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('should render skeleton div', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(<Skeleton className="h-16 w-full" />);
    const div = container.querySelector('.animate-pulse');
    expect(div?.className).toContain('h-16');
  });
});
