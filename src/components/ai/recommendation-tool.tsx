'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { getRecommendations } from '@/app/recommendations/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Get Recommendations
        </>
      )}
    </Button>
  );
}

export function RecommendationTool() {
  const [state, formAction, isPending] = useActionState(getRecommendations, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message === 'Success') {
      if (state.recommendations && state.recommendations.length > 0) {
        toast({
            title: "Here are your recommendations!",
            description: "The AI has suggested some products for your topic.",
        });
        formRef.current?.reset();
      } else {
        toast({
            variant: "default",
            title: "No specific recommendations found.",
            description: "The AI couldn't find specific products. Try a different topic.",
        });
      }
    } else if (state?.message && state.message !== 'Success' && !state.errors) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: state.message,
        });
    }
  }, [state, toast]);

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Bot className="h-6 w-6 text-primary" />
          <span>Blog Post Topic</span>
        </CardTitle>
        <CardDescription>
          For example: &quot;Using AI for project management&quot; or &quot;Best AI video editors&quot;.
        </CardDescription>
      </CardHeader>
      <form ref={formRef} action={formAction}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                id="topic"
                name="topic"
                placeholder="Enter your blog post topic here"
                required
                minLength={10}
                className="text-base"
                disabled={isPending}
              />
               {state?.errors?.topic && (
                 <p className="text-sm font-medium text-destructive">{state.errors.topic[0]}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <SubmitButton />
        </CardFooter>
      </form>
      
      {isPending && (
         <div className="p-6 pt-0 border-t">
            <h3 className="font-bold font-headline mb-4 mt-4">Generating Suggestions...</h3>
            <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-2/3" />
            </div>
         </div>
      )}

      {state?.recommendations && state.recommendations.length > 0 && !isPending && (
        <div className="p-6 pt-0 border-t">
            <h3 className="font-bold font-headline mb-4 mt-4 text-primary">Suggested Products:</h3>
            <ul className="list-disc list-inside space-y-2 text-foreground/90">
                {state.recommendations.map((rec, index) => (
                    <li key={index} className="transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2" style={{animationDelay: `${index * 100}ms`}}>
                        {rec}
                    </li>
                ))}
            </ul>
        </div>
      )}
    </Card>
  );
}
