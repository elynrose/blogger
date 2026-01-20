'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CreditCard, FileText, Grip, MessageSquare, Users } from 'lucide-react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { useIsAdmin, useUser } from '@/firebase';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type StatItem = {
  postId: string;
  title: string;
  count: number;
};

export default function AdminDashboard() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { user } = useUser();
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [topLiked, setTopLiked] = useState<StatItem[]>([]);
  const [topCommented, setTopCommented] = useState<StatItem[]>([]);
  const [topViewed, setTopViewed] = useState<StatItem[]>([]);

  useEffect(() => {
    if (!user || isAdminLoading || !isAdmin) return;
    let isCancelled = false;

    const loadStats = async () => {
      setIsStatsLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/post-stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load stats');
        }
        if (!isCancelled) {
          setTopLiked(payload.topLiked || []);
          setTopCommented(payload.topCommented || []);
          setTopViewed(payload.topViewed || []);
        }
      } finally {
        if (!isCancelled) {
          setIsStatsLoading(false);
        }
      }
    };

    loadStats();
    return () => {
      isCancelled = true;
    };
  }, [user, isAdminLoading, isAdmin]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Admin Dashboard</h1>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Most Liked Posts</CardTitle>
            <CardDescription>Top 5 posts by likes.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isStatsLoading ? (
              <div className="text-sm text-muted-foreground">Loading stats...</div>
            ) : topLiked.length === 0 ? (
              <div className="text-sm text-muted-foreground">No likes yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topLiked}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#111827" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most Commented Posts</CardTitle>
            <CardDescription>Top 5 posts by comments.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isStatsLoading ? (
              <div className="text-sm text-muted-foreground">Loading stats...</div>
            ) : topCommented.length === 0 ? (
              <div className="text-sm text-muted-foreground">No comments yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCommented}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1f2937" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Posts</CardTitle>
            <CardDescription>Top 5 posts by views.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {isStatsLoading ? (
              <div className="text-sm text-muted-foreground">Loading stats...</div>
            ) : topViewed.length === 0 ? (
              <div className="text-sm text-muted-foreground">No views yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topViewed}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
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
              <MessageSquare className="h-6 w-6" />
              Moderate Comments
            </CardTitle>
            <CardDescription>Review and delete comments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/comments">
              <Button>Go to Comments</Button>
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
