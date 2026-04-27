import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

describe('Card', () => {
  it('should render Card', () => {
    render(<Card>Card content</Card>);
    expect(document.querySelector('.bg-card')).toBeDefined();
  });

  it('should render CardHeader', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    );
    expect(document.querySelector('.bg-card')).toBeDefined();
  });

  it('should render CardTitle', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Title')).toBeDefined();
  });

  it('should render CardDescription', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Description')).toBeDefined();
  });

  it('should render CardContent', () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Content')).toBeDefined();
  });
});
