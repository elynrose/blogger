'use client';

import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { AffiliateLink } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays } from 'lucide-react';
import { VideoEmbed } from '@/components/blog/video-embed';
import { AffiliateLink as AffiliateLinkComponent } from '@/components/blog/affiliate-link';
import { doc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

type PostDocument = {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    imageUrl?: string;
    videoUrl?: string;
    publishDate?: Timestamp;
    createdAt: Timestamp;
    affiliateLinks?: AffiliateLink[];
};

// This component replaces the old logic for rendering affiliate links.
const ParsedContent = ({ content, affiliateLinks }: { content: string; affiliateLinks?: AffiliateLink[] }) => {
    if (!content) return null;

    const contentParagraphs = content.split('\n\n').map((paragraph, pIndex) => {
        if (paragraph.trim()) {
            return <p key={`p-${pIndex}`} className="mb-6 leading-relaxed text-lg">{paragraph}</p>
        }
        return null;
    });

    return (
        <>
            {contentParagraphs}
            {affiliateLinks && affiliateLinks.length > 0 && (
                 <div className="space-y-4 my-8">
                    <h3 className="text-2xl font-headline font-bold">Recommended Tools</h3>
                    {affiliateLinks.map((link, index) => (
                        <AffiliateLinkComponent key={`link-${index}`} href={link.url}>
                            {link.text}
                        </AffiliateLinkComponent>
                    ))}
                </div>
            )}
        </>
    );
}

export default function PostPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

    const firestore = useFirestore();

    const postRef = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return doc(firestore, 'posts', slug);
    }, [firestore, slug]);

    const { data: post, isLoading: isPostLoading, error: postError } = useDoc<PostDocument>(postRef);

    useEffect(() => {
        if (post?.title) {
            document.title = `${post.title} | AISaaS Explorer`;
        }
    }, [post?.title]);

    if (isPostLoading) {
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

    if (!post || postError) {
        notFound();
    }
    
    const authorName = post.authorName || 'AISaaS Explorer';
    const date = post.publishDate ? post.publishDate.toDate() : post.createdAt.toDate();

    return (
        <article className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">{post.title}</h1>
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

        <div className="max-w-none text-foreground/90">
            <ParsedContent content={post.content} affiliateLinks={post.affiliateLinks} />
        </div>

        {post.videoUrl && (
            <section className="mt-12">
            <h2 className="text-3xl font-headline font-bold mb-4">Video Tutorial</h2>
            <VideoEmbed url={post.videoUrl} />
            </section>
        )}

        </article>
    );
}
