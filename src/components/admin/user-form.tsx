'use client';

import { useEffect, useState } from 'react';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

export type UserProfile = {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  blocked?: boolean;
  role?: 'reader' | 'writer' | 'editor';
};

interface UserFormProps {
  user: UserProfile | null;
  onFinished: () => void;
}

export function UserForm({ user, onFinished }: UserFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [role, setRole] = useState<'reader' | 'writer' | 'editor'>('writer');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? '');
      setUsername(user.username ?? '');
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setBlocked(!!user.blocked);
      setRole(user.role ?? 'writer');
    } else {
      setEmail('');
      setUsername('');
      setFirstName('');
      setLastName('');
      setBlocked(false);
      setRole('writer');
    }
  }, [user]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore) return;

    setIsSaving(true);

    if (user) {
      const userRef = doc(firestore, 'users', user.id);
      updateDocumentNonBlocking(userRef, {
        email,
        username,
        firstName,
        lastName,
        blocked,
        role,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'User updated.' });
    } else {
      const usersCollection = collection(firestore, 'users');
      addDocumentNonBlocking(
        usersCollection,
        {
          email,
          username,
          firstName,
          lastName,
          blocked,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      toast({ title: 'User profile created.' });
    }

    onFinished();
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="username" className="text-right">
          Username
        </Label>
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="firstName" className="text-right">
          First name
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="lastName" className="text-right">
          Last name
        </Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="blocked" className="text-right">
          Blocked
        </Label>
        <div className="col-span-3 flex items-center gap-3">
          <Switch
            id="blocked"
            checked={blocked}
            onCheckedChange={(value) => setBlocked(value)}
          />
          <span className="text-sm text-muted-foreground">
            {blocked ? 'User is blocked' : 'User is active'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="role" className="text-right">
          Role
        </Label>
        <div className="col-span-3">
          <Select value={role} onValueChange={(value: 'reader' | 'writer' | 'editor') => setRole(value)}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reader">Reader</SelectItem>
              <SelectItem value="writer">Writer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          {user ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
