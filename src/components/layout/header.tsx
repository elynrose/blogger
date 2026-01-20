'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BrainCircuit, Search, UserCog, PenSquare, LogOut } from 'lucide-react';
import { useAuth, useUser, useUserRole, useIsAdmin } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const currentQuery = searchParams.get('q') ?? '';
    setSearchValue(currentQuery);
  }, [searchParams]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (!query) {
      router.push('/');
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', query);
    if (pathname !== '/') {
      router.push(`/?${params.toString()}`);
      return;
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <BrainCircuit className="h-7 w-7 text-primary" />
          <span className="text-xl font-headline font-bold">Polygeno</span>
        </Link>
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search posts..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-9 pl-9"
              aria-label="Search posts"
            />
          </div>
        </form>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="/recommendations" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Recommendations
          </Link>
          {!isRoleLoading && (role === 'writer' || role === 'editor' || isAdmin) && (
            <Link
              href={isAdmin ? "/admin/posts" : "/writer"}
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <PenSquare className="mr-1 h-4 w-4" />
              My Posts
            </Link>
          )}
          {user && !isAdminLoading && isAdmin && (
            <Link href="/admin" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <UserCog className="mr-1 h-4 w-4" />
              Admin
            </Link>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{(user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
