'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AffiliateLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function AffiliateLink({ href, children, className }: AffiliateLinkProps) {
  const handleClick = () => {
    console.log(`Affiliate link clicked: ${href}`);
    // In a real app, this would trigger an analytics event to a backend service.
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        'group my-6 block rounded-lg border-2 border-accent/50 bg-accent/10 p-4 font-medium text-foreground transition-all duration-300 hover:bg-accent/20 hover:border-accent hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/80 focus:ring-offset-2 focus:ring-offset-background',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-headline text-primary/90 group-hover:text-primary">{children}</span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </a>
  );
}
