'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserProfile = {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
  role?: string;
};

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const displayName = useMemo(() => {
    if (!profile) return '—';
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.username || profile.email || '—';
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
    setPhotoPreview(profile.profilePhotoUrl || '');
  }, [profile]);

  const canEdit = !!userRef && !!profile;

  const handleSave = () => {
    if (!userRef) return;
    setIsSaving(true);
    updateDocumentNonBlocking(userRef, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      updatedAt: serverTimestamp(),
    });
    toast({ title: 'Profile updated.' });
    setIsSaving(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 256 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Image too large',
        description: 'Please upload an image smaller than 256KB.',
      });
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!userRef) return;
    setIsSaving(true);
    updateDocumentNonBlocking(userRef, {
      profilePhotoUrl: photoPreview || null,
      updatedAt: serverTimestamp(),
    });
    toast({ title: 'Profile photo updated.' });
    setIsSaving(false);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Profile</h1>
        <SignOutButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          )}
          {!isLoading && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{displayName}</span>
              </div>
              <div className="grid gap-4 pt-2">
                <Label className="text-sm font-medium text-muted-foreground">Profile photo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={photoPreview || user?.photoURL || ''} alt={displayName} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoUpload} />
                    <Button variant="outline" onClick={handleSavePhoto} disabled={!canEdit || isSaving}>
                      Save Photo
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder={profile?.firstName || 'Enter first name'}
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder={profile?.lastName || 'Enter last name'}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Button onClick={handleSave} disabled={!canEdit || isSaving}>
                    Save
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{profile?.email || user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{profile?.role || 'reader'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs">{user?.uid || '—'}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
