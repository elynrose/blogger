'use client';

import { useState } from 'react';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const user = credentials.user;
      let role = 'reader';
      if (firestore && user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          role = (userSnapshot.data()?.role as string) || 'reader';
        }
      }
      toast({ title: 'Login successful!' });
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/writer');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(
        userDocRef,
        {
          id: user.uid,
          email: user.email,
          username: user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`,
          firstName: '',
          lastName: '',
          role: 'writer',
          blocked: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: 'Sign up successful!',
        description:
          'You can now sign in. Admin rights must be granted manually in the Firebase console.',
      });
      setIsLogin(true);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const credentials = await signInWithPopup(auth, provider);
      const user = credentials.user;

      if (firestore && user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (!userSnapshot.exists()) {
          setDocumentNonBlocking(
            userDocRef,
            {
              id: user.uid,
              email: user.email,
              username: user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              profilePhotoUrl: user.photoURL || '',
              role: 'writer',
              blocked: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      toast({ title: 'Login successful!' });
      let role = 'reader';
      if (firestore && user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          role = (userSnapshot.data()?.role as string) || 'reader';
        }
      }
      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/writer');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="container mx-auto flex h-full items-center justify-center py-24">
      <Card className="w-full max-w-sm">
        <form onSubmit={isLogin ? handleLogin : handleSignUp}>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isLogin ? 'Login' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Enter your credentials to access your account.'
                : 'Create a new account. Admin access must be granted manually.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Sign in' : 'Sign up'}
            </Button>
            <Button
              className="w-full"
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              Continue with Google
            </Button>
            <Button
              variant="link"
              type="button"
              onClick={toggleForm}
              disabled={isLoading}
            >
              {isLogin
                ? 'Need an account? Sign up'
                : 'Already have an account? Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
