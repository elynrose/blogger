'use client';

import { useActionState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (state?.message === 'Success' && state.generatedPost) {
      toast({
          title: "Post generated!",
          description: "The AI has created a draft for your new post.",
      });
      // Do not reset the form, user might want to refine the topic/summary
    } else if (state?.message && state.message !== 'Success' && !state.errors) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: state.message,
        });
    }
  }, [state, toast]);

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
                    <Input id="generatedTitle" defaultValue={state.generatedPost.title} className="text-xl h-auto p-2 mt-2 font-bold" />
                </div>
                <div>
                    <Label htmlFor="generatedContent" className="text-lg">Content</Label>
                    <Textarea id="generatedContent" defaultValue={state.generatedPost.content} className="text-base mt-2 min-h-[300px] leading-relaxed" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                {/* In a real app, this would save the post to the database */}
                <Button>Save Post</Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
