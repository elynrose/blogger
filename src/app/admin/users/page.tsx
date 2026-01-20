'use client';

import { useMemo, useState } from 'react';
import { collection, doc, orderBy, query, Timestamp, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useIsAdmin,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserDialog } from '@/components/admin/user-dialog';
import { DeleteUserDialog } from '@/components/admin/delete-user-dialog';
import type { UserProfile as UserFormProfile } from '@/components/admin/user-form';
import { useToast } from '@/hooks/use-toast';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type UserProfile = UserFormProfile & {
  createdAt?: Timestamp;
};

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdmin]);

  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const isLoading = isAdminLoading || isUsersLoading;

  const mappedUsers = useMemo(() => {
    if (!users) return null;
    return users.map(user => {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      const createdAtLabel = user.createdAt ? format(user.createdAt.toDate(), 'MMM d, yyyy') : '—';
      return {
        ...user,
        fullName: fullName || '—',
        createdAtLabel,
        roleLabel: user.role ?? 'reader',
      };
    });
  }, [users]);

  const growthData = useMemo(() => {
    if (!users) return [];
    const bucket = new Map<string, number>();
    users.forEach(user => {
      if (!user.createdAt) return;
      const key = format(user.createdAt.toDate(), 'yyyy-MM');
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    });

    const keys = Array.from(bucket.keys()).sort();
    let total = 0;
    return keys.map(key => {
      const [year, month] = key.split('-');
      const label = format(new Date(Number(year), Number(month) - 1, 1), 'MMM yyyy');
      const newUsers = bucket.get(key) ?? 0;
      total += newUsers;
      return {
        period: label,
        newUsers,
        totalUsers: total,
      };
    });
  }, [users]);

  if (isAdminLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-headline text-primary">Manage Users</h1>
        </div>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center text-sm text-muted-foreground">
            Loading stats...
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDelete = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleToggleBlock = (user: UserProfile) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.id);
    updateDocumentNonBlocking(userRef, {
      blocked: !user.blocked,
      updatedAt: serverTimestamp(),
    });
    toast({ title: user.blocked ? 'User unblocked.' : 'User blocked.' });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Manage Users</h1>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setDialogOpen(true);
          }}
        >
          New User
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {growthData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No user growth data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell />
                </TableRow>
              ))}
              {!isLoading && mappedUsers?.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.email || '—'}</TableCell>
                  <TableCell>{user.username || '—'}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.createdAtLabel}</TableCell>
                  <TableCell className="capitalize">{user.roleLabel}</TableCell>
                  <TableCell>
                    <Badge variant={user.blocked ? 'destructive' : 'secondary'}>
                      {user.blocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleBlock(user)}>
                          {user.blocked ? 'Unblock' : 'Block'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDelete(user)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!isLoading && (!mappedUsers || mappedUsers.length === 0) && (
        <div className="text-center text-muted-foreground mt-8">
          <p>No users found.</p>
        </div>
      )}

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={selectedUser} />
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
