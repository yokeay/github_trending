import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('should render input element', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('input')).toBeDefined();
  });

  it('should accept and apply className', () => {
    render(<Input className="custom-class" />);
    const input = document.querySelector('input');
    expect(input?.className).toContain('custom-class');
  });

  it('should accept placeholder', () => {
    render(<Input placeholder="Search..." />);
    const input = document.querySelector('input');
    expect(input?.getAttribute('placeholder')).toBe('Search...');
  });

  it('should forward ref to input element', () => {
    let ref: HTMLInputElement | null = null;
    render(
      <Input
        ref={el => {
          ref = el;
        }}
      />
    );
    expect(ref).not.toBeNull();
  });
});
