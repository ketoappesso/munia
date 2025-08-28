import { memo } from 'react';
import { cn } from '@/lib/cn';

interface SearchHighlightProps {
  text: string;
  searchTerm?: string | null;
  className?: string;
  highlightClassName?: string;
}

export const SearchHighlight = memo(function SearchHighlight({
  text,
  searchTerm,
  className,
  highlightClassName = 'bg-neutral-200 dark:bg-neutral-700 rounded px-1 py-0.5',
}: SearchHighlightProps) {
  if (!searchTerm || !text.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
    return <span className={className}>{text}</span>;
  }

  const searchTermLower = searchTerm.trim().toLowerCase();
  const regex = new RegExp(`(${searchTermLower})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.toLowerCase() === searchTermLower) {
          return (
            <span key={index} className={cn(highlightClassName, 'font-semibold')}>
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
});

SearchHighlight.displayName = 'SearchHighlight';
