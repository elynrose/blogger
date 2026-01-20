'use client';

import { useDoc, useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking, useMemoFirebase, useCollection, useIsAdmin, useUserRole, useUser } from '@/firebase';
import { doc, serverTimestamp, collection, Timestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader, ArrowLeft, Calendar as CalendarIcon, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { buildExcerpt } from '@/lib/content';
import { slugify } from '@/lib/slug';

type AffiliateLink = { text: string; url: string; };

const parseTags = (value: string) =>
    value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const postId = Array.isArray(id) ? id[0] : id;

    const firestore = useFirestore();
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
    const { role, isLoading: isRoleLoading } = useUserRole();
    const { user } = useUser();
    const { toast } = useToast();

    const canManageAll = isAdmin || role === 'editor';
    const canWrite = canManageAll || role === 'writer';

    const postRef = useMemoFirebase(() => {
        if (!firestore || !postId || !canWrite) return null;
        return doc(firestore, 'posts', postId);
    }, [firestore, postId, canWrite]);

    const { data: post, isLoading: isPostLoading } = useDoc(postRef);

    const privateContentRef = useMemoFirebase(() => {
        if (!firestore || !postId || !canWrite) return null;
        return doc(firestore, 'posts', postId, 'private', 'content');
    }, [firestore, postId, canWrite]);
    const { data: privateContent } = useDoc<{ content?: string }>(privateContentRef);
    
    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore || !canWrite) return null;
        return collection(firestore, 'categories');
    }, [firestore, canWrite]);
    const { data: categories, isLoading: areCategoriesLoading } = useCollection(categoriesQuery);


    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [categoryId, setCategoryId] = useState('');
    const [publishDate, setPublishDate] = useState<Date | undefined>();
    const [videoUrl, setVideoUrl] = useState('');
    const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
    const [tagsInput, setTagsInput] = useState('');
    const [staffPick, setStaffPick] = useState(false);
    const [subscriptionRequired, setSubscriptionRequired] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (post) {
            setTitle(post.title);
            setContent(privateContent?.content ?? post.content ?? '');
            setImageUrl(post.imageUrl || '');
            setStatus(post.status || 'draft');
            setCategoryId(post.categoryId || '');
            setPublishDate(post.publishDate ? (post.publishDate as Timestamp).toDate() : undefined);
            setVideoUrl(post.videoUrl || '');
            setAffiliateLinks(post.affiliateLinks || []);
            setTagsInput(post.tags ? post.tags.join(', ') : '');
            setStaffPick(!!post.staffPick);
            setSubscriptionRequired(!!post.subscriptionRequired);
        }
    }, [post, privateContent]);
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 256 * 1024) { // 256KB limit
                toast({
                    variant: 'destructive',
                    title: 'Image too large',
                    description: 'Please upload an image smaller than 256KB.',
                });
                e.target.value = ''; // Reset file input
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdatePost = () => {
        if (!postRef) return;
        setIsSaving(true);
        
        const excerpt = buildExcerpt(content, 160);
        const slug = slugify(title);

        updateDocumentNonBlocking(postRef, {
            title,
            slug,
            imageUrl,
            status,
            categoryId,
            publishDate: publishDate ? Timestamp.fromDate(publishDate) : null,
            videoUrl,
            affiliateLinks,
            tags: parseTags(tagsInput),
            staffPick,
            subscriptionRequired,
            excerpt,
            updatedAt: serverTimestamp(),
        });

        if (privateContentRef) {
            setDocumentNonBlocking(privateContentRef, {
                content,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }

        toast({ title: 'Post updated!', description: 'Your changes have been saved.' });
        setIsSaving(false);
        router.push('/admin/posts');
    };
    
    const handleAffiliateLinkChange = (index: number, field: 'text' | 'url', value: string) => {
        const newLinks = [...affiliateLinks];
        newLinks[index][field] = value;
        setAffiliateLinks(newLinks);
    };

    const addAffiliateLink = () => {
        setAffiliateLinks([...affiliateLinks, { text: '', url: '' }]);
    };

    const removeAffiliateLink = (index: number) => {
        setAffiliateLinks(affiliateLinks.filter((_, i) => i !== index));
    };


    if (!isAdminLoading && !isRoleLoading && !canWrite) {
        return null;
    }

    if (isAdminLoading || isRoleLoading || isPostLoading || areCategoriesLoading) {
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

    if (role === 'writer' && post && user?.uid !== post.authorId) {
        return (
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
                <Card className="text-center py-12">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You do not have permission to edit this post.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (role === 'writer' && post && post.status === 'published') {
        return (
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
                <Card className="text-center py-12">
                    <CardHeader>
                        <CardTitle>Read Only</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Writers cannot edit published posts. Please contact an editor.</p>
                    </CardContent>
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
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="title" className="font-semibold">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="status" className="font-semibold">Status</Label>
                            <Select
                                onValueChange={(value: 'draft' | 'published') => setStatus(value)}
                                value={status}
                                disabled={!canManageAll}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="category" className="font-semibold">Category</Label>
                            <Select onValueChange={setCategoryId} value={categoryId}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories?.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="staffPick"
                            checked={staffPick}
                            onCheckedChange={(checked) => setStaffPick(checked === true)}
                            disabled={!canManageAll}
                        />
                        <Label htmlFor="staffPick" className="font-semibold">
                            Staff Pick
                        </Label>
                    </div>
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="subscriptionRequired"
                            checked={subscriptionRequired}
                            onCheckedChange={(checked) => setSubscriptionRequired(checked === true)}
                        />
                        <Label htmlFor="subscriptionRequired" className="font-semibold">
                            Subscription Required
                        </Label>
                    </div>

                     <div>
                        <Label htmlFor="publishDate" className="font-semibold block mb-1">Publish Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !publishDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {publishDate ? format(publishDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={publishDate}
                                onSelect={setPublishDate}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div>
                        <Label htmlFor="imageUpload" className="font-semibold">Featured Image</Label>
                        <Input
                            id="imageUpload"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageUpload}
                            className="mt-1"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            Upload a new image to replace the current one (max 256KB).
                        </p>
                        {imageUrl && (
                            <div className="mt-4 relative aspect-video w-full border rounded-lg overflow-hidden">
                                <Image src={imageUrl} alt="Featured image preview" fill className="object-cover" />
                            </div>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="content" className="font-semibold">Content</Label>
                        <RichTextEditor value={content} onChange={setContent} className="mt-1" />
                    </div>

                    <div>
                        <Label htmlFor="videoUrl" className="font-semibold">Video Embed URL</Label>
                        <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="e.g., https://www.youtube.com/watch?v=..." className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="tags" className="font-semibold">Tags</Label>
                        <Input
                            id="tags"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="e.g., ai, saas, automation"
                            className="mt-1"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            Separate tags with commas.
                        </p>
                    </div>

                    <div>
                        <Label className="font-semibold">Affiliate Links</Label>
                         <div className="space-y-4 mt-2">
                            {affiliateLinks.map((link, index) => (
                                <div key={index} className="flex gap-2 items-center p-2 border rounded-md">
                                    <div className="flex-grow space-y-2">
                                        <Input
                                            placeholder="Link Text"
                                            value={link.text}
                                            onChange={(e) => handleAffiliateLinkChange(index, 'text', e.target.value)}
                                        />
                                        <Input
                                            placeholder="https://example.com/affiliate"
                                            value={link.url}
                                            onChange={(e) => handleAffiliateLinkChange(index, 'url', e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeAffiliateLink(index)}>
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addAffiliateLink}>Add Affiliate Link</Button>
                        </div>
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

    