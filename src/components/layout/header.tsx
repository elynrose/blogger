'use client';

import Link from 'next/link';
import { BrainCircuit, UserCog } from 'lucide-react';
import { useUser } from '@/firebase';

export function Header() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <BrainCircuit className="h-7 w-7 text-primary" />
          <span className="text-xl font-headline font-bold">AISaaS Explorer</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="/recommendations" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Recommendations
          </Link>
          {user && (
             <Link href="/admin" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <UserCog className="mr-1 h-4 w-4" />
                Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
