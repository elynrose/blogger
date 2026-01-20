import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CreditCard, FileText, Grip, Users } from 'lucide-react';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function AdminDashboard() {

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Admin Dashboard</h1>
        <SignOutButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Manage Posts
            </CardTitle>
            <CardDescription>Create, edit, and delete blog posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/posts">
              <Button>Go to Posts</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grip className="h-6 w-6" />
              Manage Categories
            </CardTitle>
            <CardDescription>Create, edit, and delete categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/categories">
              <Button>Go to Categories</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Manage Users
            </CardTitle>
            <CardDescription>View user profiles and registration details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button>Go to Users</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Manage Subscriptions
            </CardTitle>
            <CardDescription>Create plans and manage subscription access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/subscriptions">
              <Button>Go to Subscriptions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
