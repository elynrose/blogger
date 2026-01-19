'use client';

import { useDoc, useFirestore, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const postId = Array.isArray(id) ? id[0] : id;

    const firestore = useFirestore();
    const { toast } = useToast();

    const postRef = useMemoFirebase(() => {
        if (!firestore || !postId) return null;
        return doc(firestore, 'posts', postId);
    }, [firestore, postId]);

    const { data: post, isLoading: isPostLoading } = useDoc(postRef);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (post) {
            setTitle(post.title);
            setContent(post.content);
            setImageUrl(post.imageUrl || '');
        }
    }, [post]);

    const handleUpdatePost = () => {
        if (!postRef) return;
        setIsSaving(true);
        
        updateDocumentNonBlocking(postRef, {
            title,
            content,
            imageUrl,
            updatedAt: serverTimestamp(),
        });

        toast({ title: 'Post updated!', description: 'Your changes have been saved.' });
        setIsSaving(false);
        router.push('/admin/posts');
    };

    if (isPostLoading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
                <Skeleton className="h-10 w-36" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <Link href="/admin/posts" passHref>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Posts
                        </Button>
                    </Link>
                </div>
                <Card className="text-center py-12">
                    <CardHeader>
                        <CardTitle>Post Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The post you are looking for does not exist or has been deleted.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <Link href="/admin/posts" passHref>
                    <Button variant="ghost">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Posts
                    </Button>
                </Link>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Post</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title" className="font-semibold">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="imageUrl" className="font-semibold">Featured Image URL</Label>
                        <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="content" className="font-semibold">Content (Markdown)</Label>
                        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={15} className="mt-1" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleUpdatePost} disabled={isSaving}>
                        {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
