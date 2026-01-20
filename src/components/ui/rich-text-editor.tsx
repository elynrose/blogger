'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const commands = [
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: 'U', command: 'underline' },
  { label: 'H2', command: 'formatBlock', value: 'h2' },
  { label: 'H3', command: 'formatBlock', value: 'h3' },
  { label: '•', command: 'insertUnorderedList' },
  { label: '1.', command: 'insertOrderedList' },
] as const;

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2">
        {commands.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => exec(item.command, 'value' in item ? item.value : undefined)}
          >
            {item.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) {
              exec('createLink', url);
            }
          }}
        >
          Link
        </Button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[300px] rounded-md border border-input bg-background p-3 text-base leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
      />
    </div>
  );
}
