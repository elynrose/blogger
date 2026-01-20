'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPost } from '@/app/admin/posts/new/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader, Sparkles, Calendar as CalendarIcon, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase, useDoc, useUserRole } from '@/firebase';
import { collection, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type AffiliateLink = { text: string; url: string; };

const parseTags = (value: string) =>
  value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Post
        </>
      )}
    </Button>
  );
}

export function PostGeneratorTool() {
  const [state, formAction, isPending] = useActionState(createPost, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { role, isLoading: isRoleLoading } = useUserRole();

  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc(useMemoFirebase(() => (user && firestore ? doc(firestore, 'users', user.uid) : null), [firestore, user]));

  const canManageAll = role === 'editor' || role === 'admin';
  const canWrite = canManageAll || role === 'writer';

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !canWrite) return null;
    return collection(firestore, 'categories');
  }, [firestore, canWrite]);
  const { data: categories, isLoading: areCategoriesLoading } = useCollection(categoriesQuery);

  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [categoryId, setCategoryId] = useState('');
  const [publishDate, setPublishDate] = useState<Date | undefined>();
  const [videoUrl, setVideoUrl] = useState('');
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (state?.message === 'Success' && state.generatedPost) {
      toast({
          title: "Post generated!",
          description: "The AI has created a draft for your new post.",
      });
      setGeneratedTitle(state.generatedPost.title);
      setGeneratedContent(state.generatedPost.content);
      setImageUrl('');
    } else if (state?.message && state.message !== 'Success' && !state.errors) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: state.message,
        });
    }
  }, [state, toast]);

  useEffect(() => {
    if (role === 'writer') {
      setStatus('draft');
    }
  }, [role]);

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

  const handleSavePost = async () => {
    if (!canWrite) {
        toast({ variant: 'destructive', title: 'Only writers and editors can create posts.' });
        return;
    }
    if (!user || !firestore || !generatedTitle || !generatedContent || isUserProfileLoading || isRoleLoading) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Cannot save post. Make sure you are logged in, the post has content, and user profile is loaded.',
        });
        return;
    }
     if (!categoryId) {
      toast({ variant: 'destructive', title: 'Category is required.' });
      return;
    }

    setIsSaving(true);

    const postsCollection = collection(firestore, 'posts');
    const authorName = (userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || userProfile.username}`.trim() : user?.email) || 'Polygeno';

    const tags = parseTags(tagsInput);

    addDocumentNonBlocking(postsCollection, {
        title: generatedTitle,
        content: generatedContent,
        imageUrl: imageUrl,
        authorId: user.uid,
        authorName: authorName,
        status,
        categoryId,
        publishDate: publishDate ? Timestamp.fromDate(publishDate) : null,
        videoUrl,
        affiliateLinks,
        tags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }).then(() => {
        toast({
            title: 'Post Saved!',
            description: 'Your new post has been saved successfully.',
        });
        const destination = role === 'admin' ? '/admin/posts' : '/writer/posts';
        router.push(destination);
    }).catch((e) => {
        console.error('Save Post Error:', e);
        toast({
            variant: 'destructive',
            title: 'Failed to save post',
            description: e.message || 'An unexpected error occurred.',
        });
    }).finally(() => {
        setIsSaving(false);
    });
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


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Bot className="h-6 w-6 text-primary" />
            <span>AI Post Generator</span>
          </CardTitle>
          <CardDescription>
            Provide a topic and a brief summary, and the AI will write a blog post for you.
          </CardDescription>
          {!isRoleLoading && !canWrite && (
            <p className="text-sm text-destructive">
              Your account does not have permission to create posts.
            </p>
          )}
        </CardHeader>
        <form ref={formRef} action={formAction}>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="e.g., 'Getting Started with Generative AI'"
                required
                minLength={10}
                className="text-base"
                disabled={isPending}
              />
              {state?.errors?.topic && (
                <p className="text-sm font-medium text-destructive">{state.errors.topic[0]}</p>
              )}
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="summary">Summary / Outline</Label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="e.g., 'An introduction to what generative AI is, key concepts, and a look at popular tools like Midjourney and Copy.ai.'"
                required
                minLength={20}
                className="text-base min-h-[100px]"
                disabled={isPending}
              />
              {state?.errors?.summary && (
                <p className="text-sm font-medium text-destructive">{state.errors.summary[0]}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Post...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <br/>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      )}

      {state?.generatedPost && !isPending && (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-primary">Generated Post Details</CardTitle>
                 <CardDescription>Review and edit the generated content, then add details before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="generatedTitle" className="font-semibold">Title</Label>
                    <Input id="generatedTitle" value={generatedTitle} onChange={(e) => setGeneratedTitle(e.target.value)} className="text-xl h-auto p-2 mt-1 font-bold" />
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
                                {areCategoriesLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : 
                                categories?.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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
                        className="text-base mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload an image from your computer (max 256KB).
                    </p>
                    {imageUrl && (
                        <div className="mt-4 relative aspect-video w-full max-w-lg mx-auto border rounded-lg overflow-hidden">
                            <Image src={imageUrl} alt="Featured image preview" fill className="object-cover" />
                        </div>
                    )}
                </div>

                <div>
                    <Label htmlFor="generatedContent" className="font-semibold">Content</Label>
                    <Textarea id="generatedContent" value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} className="text-base mt-1 min-h-[300px] leading-relaxed" />
                </div>
                 <div>
                    <Label htmlFor="videoUrl" className="font-semibold">Video Embed URL</Label>
                    <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="e.g., https://www.youtube.com/watch?v=..." className="mt-1" />
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
            <CardFooter className="flex justify-end">
                <Button onClick={handleSavePost} disabled={isSaving || isPending || isUserProfileLoading}>
                  {isSaving ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Post'
                  )}
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}

    
