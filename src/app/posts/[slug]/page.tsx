'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, useCollection, useDoc, useFirestore, useMemoFirebase, useUser, useUserRole } from '@/firebase';
import type { AffiliateLink } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Heart, MessageSquare } from 'lucide-react';
import { VideoEmbed } from '@/components/blog/video-embed';
import { collection, doc, increment, limit, orderBy, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Recaptcha } from '@/components/comments/recaptcha';
import { getYouTubeEmbedUrl } from '@/lib/utils';

type PostDocument = {
    id: string;
    title: string;
    slug?: string;
    excerpt?: string;
    authorId: string;
    authorName: string;
    authorPhotoUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    publishDate?: Timestamp;
    createdAt: Timestamp;
    affiliateLinks?: AffiliateLink[];
    categoryId?: string;
    subscriptionRequired?: boolean;
};

// This component replaces the old logic for rendering affiliate links.
const ParsedContent = ({
    content,
    affiliateLinks,
    videoUrl,
}: {
    content: string;
    affiliateLinks?: AffiliateLink[];
    videoUrl?: string;
}) => {
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

    const renderVideo = (url: string) => {
        const embedUrl = getYouTubeEmbedUrl(url);
        if (!embedUrl) return '';
        const src = escapeHtml(embedUrl);
        return `
          <div class="my-8 w-full overflow-hidden rounded-lg border border-border shadow-sm">
            <div class="relative w-full pt-[56.25%]">
              <iframe
                src="${src}"
                class="absolute left-0 top-0 h-full w-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        `;
    };

    const links = affiliateLinks ?? [];
    const tokenRegex = /\{\{affiliate(\d+)\}\}/g;
    const seen = new Set<number>();
    let videoReplaced = false;
    const html = toHtml(content)
        .replace(/\{\{video\}\}/g, () => {
            if (!videoUrl || videoReplaced) return '';
            videoReplaced = true;
            return renderVideo(videoUrl);
        })
        .replace(tokenRegex, (_match, indexStr) => {
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

    const slugQuery = useMemoFirebase(() => {
        if (!firestore || !hasSlug) return null;
        return query(collection(firestore, 'posts'), where('slug', '==', slug), limit(1));
    }, [firestore, hasSlug, slug]);

    const { data: slugMatches, isLoading: isSlugLoading } = useCollection<PostDocument>(slugQuery);
    const resolvedPostId = slugMatches?.[0]?.id || (hasSlug ? slug : null);

    const postDocRef = useMemoFirebase(() => {
        if (!firestore || !resolvedPostId) return null;
        return doc(firestore, 'posts', resolvedPostId);
    }, [firestore, resolvedPostId]);

    const { data: post, isLoading: isPostLoading, error: postError } = useDoc<PostDocument>(postDocRef);
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<{
        subscriptionStatus?: string;
        subscriptionActive?: boolean;
        firstName?: string;
        lastName?: string;
        username?: string;
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
    const [commentBody, setCommentBody] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const likesQuery = useMemoFirebase(() => {
        if (!firestore || !post?.id) return null;
        return collection(firestore, 'posts', post.id, 'likes');
    }, [firestore, post?.id]);
    const { data: likes } = useCollection<{ createdAt?: Timestamp }>(likesQuery);
    const likeCount = likes?.length ?? 0;
    const hasLiked = !!user && !!likes?.some((like) => like.id === user.uid);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore || !post?.id) return null;
        return query(
            collection(firestore, 'posts', post.id, 'comments'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, post?.id]);
    const { data: comments } = useCollection<{
        userId: string;
        userName: string;
        body: string;
        createdAt?: Timestamp;
    }>(commentsQuery);

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

    const isAwaitingSnapshot = !!postDocRef && !post && !postError;
    const isLoading = !hasSlug || isSlugLoading || isPostLoading || isAwaitingSnapshot;

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

    const handleToggleLike = () => {
        if (!firestore || !post?.id || !user) {
            toast({ variant: 'destructive', title: 'Sign in to like posts.' });
            return;
        }
        const likeRef = doc(firestore, 'posts', post.id, 'likes', user.uid);
        if (hasLiked) {
            deleteDocumentNonBlocking(likeRef);
            return;
        }
        setDocumentNonBlocking(likeRef, {
            createdAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleAddComment = async () => {
        if (!firestore || !post?.id || !user) {
            toast({ variant: 'destructive', title: 'Sign in to comment.' });
            return;
        }
        const trimmed = commentBody.trim();
        if (!trimmed) {
            toast({ variant: 'destructive', title: 'Comment cannot be empty.' });
            return;
        }
        if (!captchaToken) {
            toast({ variant: 'destructive', title: 'Please complete the captcha.' });
            return;
        }
        try {
            const response = await fetch('/api/captcha/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: captchaToken }),
            });
            const payload = await response.json();
            if (!response.ok || !payload?.success) {
                throw new Error(payload?.error || 'Captcha verification failed');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Captcha failed', description: error?.message });
            return;
        }
        const displayName =
            (userProfile?.firstName || userProfile?.lastName || userProfile?.username)
                ? `${userProfile?.firstName || ''} ${userProfile?.lastName || userProfile?.username || ''}`.trim()
                : user.email?.split('@')[0] || 'Reader';

        addDocumentNonBlocking(collection(firestore, 'posts', post.id, 'comments'), {
            userId: user.uid,
            userName: displayName,
            body: trimmed,
            postId: post.id,
            postTitle: post.title,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        setCommentBody('');
        setCaptchaToken(null);
    };

    const handleDeleteComment = (commentId: string) => {
        if (!firestore || !post?.id) return;
        const commentRef = doc(firestore, 'posts', post.id, 'comments', commentId);
        deleteDocumentNonBlocking(commentRef);
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
                        <AvatarImage src={post.authorPhotoUrl || 'https://picsum.photos/seed/' + post.authorId + '/100/100'} alt={authorName} data-ai-hint="person portrait" />
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
                <ParsedContent content={fullContent} affiliateLinks={post.affiliateLinks} videoUrl={post.videoUrl} />
            </div>
        )}

        {post.videoUrl && canViewFullContent && !fullContent.includes('{{video}}') && (
            <section className="mt-12">
            <h2 className="text-3xl font-headline font-bold mb-4">Video Tutorial</h2>
            <VideoEmbed url={post.videoUrl} />
            </section>
        )}

        <section className="mt-12 border-t border-foreground/10 pt-8">
            <div className="flex flex-wrap items-center gap-4">
                <Button
                    variant={hasLiked ? 'default' : 'outline'}
                    onClick={handleToggleLike}
                    disabled={!user}
                >
                    <Heart className="mr-2 h-4 w-4" />
                    {hasLiked ? 'Liked' : 'Like'}
                </Button>
                <span className="text-sm text-muted-foreground">{likeCount} likes</span>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {comments?.length ?? 0} comments
                </span>
            </div>

            <div className="mt-6 space-y-4">
                {user ? (
                    <div className="space-y-2">
                        <textarea
                            className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            rows={3}
                            placeholder="Write a comment..."
                            value={commentBody}
                            onChange={(event) => setCommentBody(event.target.value)}
                        />
                        <Recaptcha onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
                        <Button onClick={handleAddComment}>Post Comment</Button>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        <Link href="/login" className="text-primary underline">
                            Sign in
                        </Link>{' '}
                        to join the discussion.
                    </p>
                )}

                <div className="space-y-4">
                    {comments?.map((comment) => {
                        const canDelete = canManageAll || (user && comment.userId === user.uid);
                        return (
                            <div key={comment.id} className="rounded-lg border border-foreground/10 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{comment.userName}</p>
                                        {comment.createdAt && (
                                            <p className="text-xs text-muted-foreground">
                                                {comment.createdAt.toDate().toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteComment(comment.id)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                    {comment.body}
                                </p>
                            </div>
                        );
                    })}
                    {comments && comments.length === 0 && (
                        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>
                    )}
                </div>
            </div>
        </section>

        </article>
    );
}
