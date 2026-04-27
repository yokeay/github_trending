import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

describe('Dialog', () => {
  it('should render Dialog', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  });
});
