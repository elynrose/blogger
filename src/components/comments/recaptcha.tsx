'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; }) => number;
      reset: (widgetId?: number) => void;
      ready: (fn: () => void) => void;
    };
  }
}

type RecaptchaProps = {
  onVerify: (token: string) => void;
  onExpire: () => void;
};

export function Recaptcha({ onVerify, onExpire }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey || !containerRef.current) return;

    const renderWidget = () => {
      if (!containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha?.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'expired-callback': onExpire,
      }) ?? null;
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[src*="www.google.com/recaptcha/api.js"]');
    if (existingScript) {
      window.grecaptcha?.ready(renderWidget);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => window.grecaptcha?.ready(renderWidget);
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current !== null) {
        window.grecaptcha?.reset(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, onExpire]);

  return <div ref={containerRef} />;
}
