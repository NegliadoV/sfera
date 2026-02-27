'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageLightbox } from '@/components/ImageLightbox';

const base = 'markdown-body';

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div
      className={`${base} max-w-none`}
      style={{ color: 'var(--text-primary)' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold mt-6 mb-4 first:mt-0" style={{ color: 'var(--text-primary)' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3 pb-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 pl-6 list-disc space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 pl-6 list-decimal space-y-0.5">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-4 border-l-4 italic" style={{ borderColor: 'var(--accent-blue)' }}>
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent-blue)' }}>
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            src && typeof src === 'string' ? (
              <ImageLightbox
                src={src}
                alt={alt ?? ''}
                className="my-3 rounded-[var(--radius-lg)] max-w-full"
              />
            ) : null,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="border px-3 py-2 text-left font-semibold" style={{ borderColor: 'var(--border-color)' }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-3 py-2" style={{ borderColor: 'var(--border-color)' }}>
              {children}
            </td>
          ),
          code: ({ children, ...props }) => {
            const text = String(children ?? '');
            if (text.includes('\n')) {
              return (
                <pre className="my-4 p-4 rounded-[var(--radius-lg)] overflow-x-auto text-sm font-mono" style={{ backgroundColor: 'var(--bg-accent)', border: '1px solid var(--border-color)' }}>
                  <code {...props} style={{ background: 'transparent', padding: 0 }}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code
                {...props}
                className="px-1.5 py-0.5 rounded-[var(--radius-sm)] text-sm font-mono"
                style={{ backgroundColor: 'var(--bg-accent)' }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
