'use client';

import { getYouTubeEmbedUrl } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Video } from 'lucide-react';

type VideoEmbedProps = {
  url: string;
};

export function VideoEmbed({ url }: VideoEmbedProps) {
  const embedUrl = getYouTubeEmbedUrl(url);

  if (!embedUrl) {
    return (
        <Alert variant="destructive">
            <Video className="h-4 w-4" />
            <AlertTitle>Invalid Video URL</AlertTitle>
            <AlertDescription>
                The provided video URL could not be processed.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg border">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
  );
}
