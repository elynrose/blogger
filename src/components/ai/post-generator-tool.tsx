'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPost } from '@/app/admin/posts/new/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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

  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (state?.message === 'Success' && state.generatedPost) {
      toast({
          title: "Post generated!",
          description: "The AI has created a draft for your new post.",
      });
      setGeneratedTitle(state.generatedPost.title);
      setGeneratedContent(state.generatedPost.content);
    } else if (state?.message && state.message !== 'Success' && !state.errors) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: state.message,
        });
    }
  }, [state, toast]);

  const handleSavePost = async () => {
    if (!user || !firestore || !generatedTitle || !generatedContent) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Cannot save post. Make sure you are logged in and the post has a title and content.',
        });
        return;
    }

    setIsSaving(true);

    const postsCollection = collection(firestore, 'posts');

    addDocumentNonBlocking(postsCollection, {
        title: generatedTitle,
        content: generatedContent,
        authorId: user.uid,
        categoryId: 'general', // Placeholder category
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }).then(() => {
        toast({
            title: 'Post Saved!',
            description: 'Your new post has been saved successfully.',
        });
        router.push('/admin/posts');
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
                <CardTitle className="font-headline text-primary">Generated Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="generatedTitle" className="text-lg">Title</Label>
                    <Input id="generatedTitle" value={generatedTitle} onChange={(e) => setGeneratedTitle(e.target.value)} className="text-xl h-auto p-2 mt-2 font-bold" />
                </div>
                <div>
                    <Label htmlFor="generatedContent" className="text-lg">Content</Label>
                    <Textarea id="generatedContent" value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} className="text-base mt-2 min-h-[300px] leading-relaxed" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleSavePost} disabled={isSaving || isPending}>
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
