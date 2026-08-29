'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { ImageLightbox } from '@/components/ImageLightbox';

const base = 'markdown-body';

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  try {
    const u = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    const host = u.hostname.toLowerCase();

    // YouTube: watch, embed, shorts, live, youtu.be, youtube-nocookie
    if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com')) {
      let id = u.searchParams.get('v');
      if (!id) {
        if (u.pathname.startsWith('/embed/')) {
          id = u.pathname.replace('/embed/', '').split('/')[0].split('?')[0];
        } else if (u.pathname.startsWith('/shorts/')) {
          id = u.pathname.replace('/shorts/', '').split('/')[0].split('?')[0];
        } else if (u.pathname.startsWith('/live/')) {
          id = u.pathname.replace('/live/', '').split('/')[0].split('?')[0];
        } else if (host === 'youtu.be') {
          id = u.pathname.slice(1).split('/')[0].split('?')[0];
        }
      }
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }

    // Vimeo
    if (host.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }

    // Прямой видеофайл
    if (cleanUrl.match(/\.(mp4|webm|ogg)(\?|$)/i)) return cleanUrl;
  } catch {}
  return null;
}

function VideoBlock({ url }: { url: string }) {
  const embed = getEmbedUrl(url);
  if (!embed) return (
    <div className="my-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <a href={url} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-2" style={{ color: 'var(--accent-blue)' }}>
        <i className="fa-solid fa-play" /> {url}
      </a>
    </div>
  );
  if (embed.match(/\.(mp4|webm|ogg)/i)) {
    return (
      <video src={embed} controls className="my-4 w-full rounded-xl" style={{ maxHeight: '60vh', background: '#000' }} />
    );
  }
  return (
    <div className="my-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ aspectRatio: '16/9', background: '#000' }}>
      <iframe
        src={embed}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0"
        title="Video"
      />
    </div>
  );
}

export function MarkdownBody({ content }: { content: string }) {
  if (!content) return null;

  // Разбиваем контент на текстовые блоки и видео-блоки (поддерживаем ::video[...] и старые <video-embed>)
  const parts = content.split(/(::video\[[^\]]+\]|<video-embed[^>]*data-url="[^"]+"[^>]*>(?:<\/video-embed>)?)/gi);

  return (
    <div className={`${base} max-w-none`} style={{ color: 'var(--text-primary)' }}>
      {parts.map((part, idx) => {
        if (!part) return null;

        // Матчим ::video[url]
        const videoMatch = part.match(/^::video\[([^\]]+)\]$/i);
        if (videoMatch) {
          return <VideoBlock key={idx} url={videoMatch[1]} />;
        }

        // Матчим <video-embed data-url="url">
        const embedTagMatch = part.match(/^<video-embed[^>]*data-url="([^"]+)"[^>]*>/i);
        if (embedTagMatch) {
          return <VideoBlock key={idx} url={embedTagMatch[1]} />;
        }

        if (!part.trim()) return null;

        return (
          <ReactMarkdown
            key={idx}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
          h1: ({ children }) => <h1 className="text-2xl font-semibold mt-6 mb-4 first:mt-0" style={{ color: 'var(--text-primary)' }}>{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 pb-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{children}</h3>,
          p:  ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-3 pl-6 list-disc space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 pl-6 list-decimal space-y-0.5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-4 italic rounded-r-lg py-2 pr-3" style={{ borderColor: 'var(--accent-primary)', background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', color: 'var(--text-secondary)' }}>
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent-blue)' }}>{children}</a>,
          img: ({ src, alt }) =>
            src && typeof src === 'string' ? (
              <ImageLightbox src={src} alt={alt ?? ''} className="my-3 rounded-[var(--radius-lg)] max-w-full" />
            ) : null,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          table:  ({ children }) => <div className="my-4 overflow-x-auto"><table className="w-full border-collapse">{children}</table></div>,
          thead:  ({ children }) => <thead>{children}</thead>,
          tbody:  ({ children }) => <tbody>{children}</tbody>,
          tr:     ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th className="border px-3 py-2 text-left font-semibold" style={{ borderColor: 'var(--border-color)' }}>{children}</th>,
          td: ({ children }) => <td className="border px-3 py-2" style={{ borderColor: 'var(--border-color)' }}>{children}</td>,
          code: ({ className, children, ...props }: any) => {
            const isBlock = className?.includes('language-');
            const lang = className?.replace('language-', '') ?? '';
            if (isBlock) {
              return (
                <div className="rich-code-block my-4">
                  {lang && (
                    <div className="rich-code-block-header">
                      <span className="rich-code-lang">{lang}</span>
                      <button type="button" className="rich-code-copy-btn" onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}>
                        <i className="fa-regular fa-copy" style={{ marginRight: 4 }} />Copy
                      </button>
                    </div>
                  )}
                  <pre className="rich-code-pre"><code className={className} {...props}>{children}</code></pre>
                </div>
              );
            }
            return <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: 'var(--bg-accent)', fontSize: '0.875em' }}>{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {part}
      </ReactMarkdown>
    );
  })}
</div>
);
}
