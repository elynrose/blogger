'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CategoryForm } from './category-form';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
          <DialogDescription>
            {category ? 'Update the details for this category.' : 'Add a new category for your posts.'}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm category={category} onFinished={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
