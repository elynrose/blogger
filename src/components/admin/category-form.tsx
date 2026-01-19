'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategoryFormProps {
  category: Category | null;
  onFinished: () => void;
}

export function CategoryForm({ category, onFinished }: CategoryFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !name) {
      toast({ variant: 'destructive', title: 'Name is required.' });
      return;
    }
    setIsSaving(true);

    if (category) {
      const categoryRef = doc(firestore, 'categories', category.id);
      updateDocumentNonBlocking(categoryRef, {
        name,
        description,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Category updated!' });
    } else {
      const categoriesCollection = collection(firestore, 'categories');
      addDocumentNonBlocking(categoriesCollection, {
        name,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Category created!' });
    }

    onFinished();
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          {category ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
