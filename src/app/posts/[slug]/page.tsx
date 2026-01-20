'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useFirestore, useMemoFirebase, useUser, useUserRole } from '@/firebase';
import type { AffiliateLink } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays } from 'lucide-react';
import { VideoEmbed } from '@/components/blog/video-embed';
import { doc, increment, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

type PostDocument = {
    id: string;
    title: string;
    excerpt?: string;
    authorId: string;
    authorName: string;
    imageUrl?: string;
    videoUrl?: string;
    publishDate?: Timestamp;
    createdAt: Timestamp;
    affiliateLinks?: AffiliateLink[];
    categoryId?: string;
    subscriptionRequired?: boolean;
};

// This component replaces the old logic for rendering affiliate links.
const ParsedContent = ({ content, affiliateLinks }: { content: string; affiliateLinks?: AffiliateLink[] }) => {
    if (!content) return null;

    const escapeHtml = (value: string) =>
        value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    const toHtml = (raw: string) => {
        const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
        if (looksLikeHtml) return raw;
        return raw
            .split('\n\n')
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join('');
    };

    const renderAffiliateLink = (link: AffiliateLink) => {
        const label = escapeHtml(link.text || link.url);
        const href = escapeHtml(link.url);
        return `
          <a href="${href}" target="_blank" rel="noopener noreferrer"
            class="group my-6 block rounded-lg border-2 border-accent/50 bg-accent/10 p-4 font-medium text-foreground transition-all duration-300 hover:bg-accent/20 hover:border-accent hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2 focus:ring-offset-background">
            <div class="flex items-center justify-between">
              <span class="font-headline text-primary/90 group-hover:text-primary">${label}</span>
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:translate-x-1">
                <span>&rarr;</span>
              </div>
            </div>
          </a>
        `;
    };

    const links = affiliateLinks ?? [];
    const tokenRegex = /\{\{affiliate(\d+)\}\}/g;
    const seen = new Set<number>();
    const html = toHtml(content).replace(tokenRegex, (_match, indexStr) => {
        const linkIndex = Number(indexStr) - 1;
        if (seen.has(linkIndex)) return '';
        seen.add(linkIndex);
        const link = links[linkIndex];
        if (!link?.url) return '';
        return renderAffiliateLink(link);
    });

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function PostPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const hasSlug = typeof slug === 'string' && slug.length > 0;

    const firestore = useFirestore();
    const { user } = useUser();
    const { role } = useUserRole();

    const postRef = useMemoFirebase(() => {
        if (!firestore || !hasSlug) return null;
        return doc(firestore, 'posts', slug);
    }, [firestore, hasSlug, slug]);

    const { data: post, isLoading: isPostLoading, error: postError } = useDoc<PostDocument>(postRef);
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<{
        subscriptionStatus?: string;
        subscriptionActive?: boolean;
    }>(userProfileRef, { preventGlobalError: true });
    const categoryRef = useMemoFirebase(() => {
        if (!firestore || !post?.categoryId) return null;
        return doc(firestore, 'categories', post.categoryId);
    }, [firestore, post?.categoryId]);
    const { data: category } = useDoc<{ name?: string }>(categoryRef);
    const hasLoggedViewRef = useRef(false);
    const { toast } = useToast();

    const subscriptionStatus = userProfile?.subscriptionStatus ?? '';
    const isSubscribed = !!userProfile?.subscriptionActive || subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const isAuthor = !!user && !!post && user.uid === post.authorId;
    const canManageAll = role === 'admin' || role === 'editor';
    const canViewFullContent = !!post && (!post.subscriptionRequired || isSubscribed || isAuthor || canManageAll);
    const previewText = (post?.excerpt || '').substring(0, 240);

    const privateContentRef = useMemoFirebase(() => {
        if (!firestore || !post?.id) return null;
        if (post.subscriptionRequired && !canViewFullContent) return null;
        return doc(firestore, 'posts', post.id, 'private', 'content');
    }, [firestore, post?.id, post?.subscriptionRequired, canViewFullContent]);
    const { data: privateContent, isLoading: isPrivateContentLoading } = useDoc<{ content?: string }>(privateContentRef);
    const fullContent = privateContent?.content || '';

    useEffect(() => {
        if (post?.title) {
            document.title = `${post.title} | Polygeno`;
        }
    }, [post?.title]);

    useEffect(() => {
        const logView = async () => {
            if (!firestore || !post?.id || hasLoggedViewRef.current) return;
            hasLoggedViewRef.current = true;

            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                if (!ipResponse.ok) return;
                const ipData = await ipResponse.json();
                const ipAddress = ipData?.ip;
                if (!ipAddress) return;

                const encoder = new TextEncoder();
                const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(ipAddress));
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const ipHash = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

                const statsRef = doc(firestore, 'post_views', post.id);
                const ipRef = doc(firestore, 'post_views', post.id, 'ips', ipHash);

                await runTransaction(firestore, async (transaction) => {
                    const ipSnap = await transaction.get(ipRef);
                    if (ipSnap.exists()) {
                        transaction.update(statsRef, {
                            totalViews: increment(1),
                            updatedAt: serverTimestamp(),
                        });
                        transaction.update(ipRef, { lastSeenAt: serverTimestamp() });
                        return;
                    }

                    transaction.set(ipRef, {
                        createdAt: serverTimestamp(),
                        lastSeenAt: serverTimestamp(),
                    });
                    transaction.set(
                        statsRef,
                        {
                            totalViews: increment(1),
                            uniqueViews: increment(1),
                            updatedAt: serverTimestamp(),
                        },
                        { merge: true }
                    );
                });
            } catch (error) {
                console.warn('View tracking failed.', error);
            }
        };

        logView();
    }, [firestore, post?.id]);

    const isAwaitingSnapshot = !!postRef && !post && !postError;
    const isLoading = !hasSlug || isPostLoading || isAwaitingSnapshot;

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
                <article>
                    <header className="mb-8">
                        <Skeleton className="h-12 w-3/4 mb-4" />
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </header>
                    <Skeleton className="h-96 w-full rounded-lg mb-8" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                    </div>
                </article>
            </div>
        )
    }

    if (hasSlug && !isLoading && (postError || !post)) {
        notFound();
    }
    
    const authorName = post.authorName || 'Polygeno';
    const date = post.publishDate ? post.publishDate.toDate() : post.createdAt.toDate();
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleShare = async () => {
        if (!post) return;
        const shareData = {
            title: post.title,
            text: post.title,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: 'Link copied to clipboard.' });
        } catch (error) {
            console.warn('Share failed.', error);
            toast({ variant: 'destructive', title: 'Unable to share this post.' });
        }
    };

    return (
        <article className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{post.title}</h1>
                        {post.subscriptionRequired && (
                            <Badge variant="outline" className="text-xs uppercase tracking-wide">
                                Subscribers
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                        {/* No author image in user doc */}
                        <AvatarImage src={'https://picsum.photos/seed/' + post.authorId + '/100/100'} alt={authorName} data-ai-hint="person portrait" />
                        <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{authorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        <span>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    </div>
                    {category?.name && post.categoryId && (
                        <p className="mt-3 text-sm font-medium text-muted-foreground">
                            Category:{' '}
                            <Link
                                href={`/categories/${encodeURIComponent(post.categoryId)}`}
                                className="text-foreground hover:text-primary transition-colors"
                            >
                                {category.name}
                            </Link>
                        </p>
                    )}
                </div>
                <Button type="button" variant="outline" onClick={handleShare} className="shrink-0">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
            </div>
        </header>
        
        {post.imageUrl && (
            <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden mb-8 shadow-lg">
                <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="technology"
                />
            </div>
        )}

        {post.subscriptionRequired && !canViewFullContent && (
            <div className="rounded-lg border border-foreground/10 bg-muted/40 p-6 mb-8">
                <h2 className="text-2xl font-headline font-bold text-primary mb-2">Subscriber-only content</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    This article is available to subscribers. Unlock the full post by subscribing.
                </p>
                <Link href="/subscribe">
                    <Button>View Subscription Plans</Button>
                </Link>
            </div>
        )}

        {post.subscriptionRequired && !canViewFullContent ? (
            <div className="max-w-none text-foreground/90">
                {previewText && <p className="text-muted-foreground">{previewText}...</p>}
                {!previewText && <p className="text-muted-foreground">Subscribe to read the full article.</p>}
            </div>
        ) : isPrivateContentLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
            </div>
        ) : (
            <div className="max-w-none text-foreground/90">
                <ParsedContent content={fullContent} affiliateLinks={post.affiliateLinks} />
            </div>
        )}

        {post.videoUrl && canViewFullContent && (
            <section className="mt-12">
            <h2 className="text-3xl font-headline font-bold mb-4">Video Tutorial</h2>
            <VideoEmbed url={post.videoUrl} />
            </section>
        )}

        </article>
    );
}
