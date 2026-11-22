import { Globe2, Link2 } from 'lucide-react';

const INLINE = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<]+|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|`[^`]+`|\/[a-f\d]{24}\b|![a-f\d]{24}\b|@[\w.-]+)/gi;

const previewsFor = (content) => {
  const found = new Map();
  const links = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/gi;
  for (const match of content.matchAll(links)) {
    const url = match[2] || match[3];
    try {
      const parsed = new URL(url);
      if (!found.has(parsed.href)) found.set(parsed.href, { url: parsed.href, title: match[1] || parsed.hostname.replace(/^www\./, ''), host: parsed.hostname.replace(/^www\./, '') });
    } catch {
      // Ignore malformed links; inline rendering also only creates http(s) links.
    }
    if (found.size === 3) break;
  }
  return [...found.values()];
};

const renderInline = (text, keyPrefix, { eventRefs = {}, resourceRefs = {}, onEventClick, interactiveMentions = true } = {}) => {
  const parts = [];
  let cursor = 0;
  for (const [index, match] of [...text.matchAll(INLINE)].entries()) {
    const token = match[0];
    const start = match.index;
    if (start > cursor) parts.push(text.slice(cursor, start));
    if (token.startsWith('[')) {
      parts.push(<a key={`${keyPrefix}-${index}`} href={match[3]} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-text underline break-all">{match[2]}</a>);
    } else if (/^https?:/i.test(token)) {
      const url = token.replace(/[.,!?]+$/, '');
      parts.push(<a key={`${keyPrefix}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-text underline break-all">{url}</a>);
      if (url.length < token.length) parts.push(token.slice(url.length));
    } else if (token.startsWith('**') || token.startsWith('__')) {
      parts.push(<strong key={`${keyPrefix}-${index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      parts.push(<em key={`${keyPrefix}-${index}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      parts.push(<code key={`${keyPrefix}-${index}`} className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.92em]">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('/')) {
      const event = eventRefs[token.slice(1).toLowerCase()];
      parts.push(event
        ? interactiveMentions
          ? <button key={`${keyPrefix}-${index}`} type="button" onClick={() => onEventClick?.(event)} className="chip chip-accent hover:brightness-95">{event.title}</button>
          : <span key={`${keyPrefix}-${index}`} className="chip chip-accent">{event.title}</span>
        : <span key={`${keyPrefix}-${index}`} className="chip chip-accent">Evento · {token.slice(-6)}</span>);
    } else if (token.startsWith('!')) {
      const resource = resourceRefs[token.slice(1).toLowerCase()];
      parts.push(resource
        ? interactiveMentions
          ? <a key={`${keyPrefix}-${index}`} href={resource.url} target="_blank" rel="noopener noreferrer" className="chip chip-accent hover:brightness-95">{resource.title}</a>
          : <span key={`${keyPrefix}-${index}`} className="chip chip-accent">{resource.title}</span>
        : <span key={`${keyPrefix}-${index}`} className="chip chip-accent">Recurso · {token.slice(-6)}</span>);
    } else {
      parts.push(<span key={`${keyPrefix}-${index}`} className="font-semibold text-accent-text">{token}</span>);
    }
    cursor = start + token.length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

const GroupRichText = ({ content, eventRefs, resourceRefs, onEventClick, interactiveMentions = true }) => {
  const text = String(content || '');
  const previews = previewsFor(text);
  return (
  <div className="space-y-3 break-words">
    <div className="space-y-1">
    {text.split('\n').map((line, index) => {
      const key = `line-${index}`;
      if (/^###\s/.test(line)) return <h5 key={key} className="text-base font-bold">{renderInline(line.slice(4), key, { eventRefs, resourceRefs, onEventClick, interactiveMentions })}</h5>;
      if (/^##\s/.test(line)) return <h4 key={key} className="text-lg font-bold">{renderInline(line.slice(3), key, { eventRefs, resourceRefs, onEventClick, interactiveMentions })}</h4>;
      if (/^#\s/.test(line)) return <h3 key={key} className="text-xl font-bold">{renderInline(line.slice(2), key, { eventRefs, resourceRefs, onEventClick, interactiveMentions })}</h3>;
      if (/^[-*]\s/.test(line)) return <p key={key} className="pl-4 before:mr-2 before:content-['•']">{renderInline(line.slice(2), key, { eventRefs, resourceRefs, onEventClick, interactiveMentions })}</p>;
      if (/^>\s?/.test(line)) return <blockquote key={key} className="border-l-2 border-line pl-3 text-muted">{renderInline(line.replace(/^>\s?/, ''), key, { eventRefs, resourceRefs, onEventClick, interactiveMentions })}</blockquote>;
      return <p key={key} className={line ? '' : 'min-h-3'}>{renderInline(line, key, { eventRefs, resourceRefs, onEventClick, interactiveMentions })}</p>;
    })}
    </div>
    {previews.length > 0 && (
      <div className="grid gap-2 sm:grid-cols-2">
        {previews.map(({ url, title, host }) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:bg-surface-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text"><Globe2 size={18} aria-hidden="true" /></span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{title}</span>
              <span className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Link2 size={12} aria-hidden="true" /><span className="truncate">{host} · Enlace compartido</span></span>
            </span>
          </a>
        ))}
      </div>
    )}
  </div>
  );
};

export default GroupRichText;
