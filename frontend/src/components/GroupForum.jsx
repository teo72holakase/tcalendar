import { useEffect, useRef, useState } from 'react';
import { AtSign, LoaderCircle, MessageCircle, MoreHorizontal, Send, Trash2 } from 'lucide-react';
import {
  createGroupComment, createGroupPost, deleteGroupComment, deleteGroupPost,
  fetchGroupComments, fetchGroupEvents, fetchGroupPosts,
} from '../services/api';
import GroupRichText from './GroupRichText';

const errorText = (error, fallback) => error.response?.data?.message || fallback;
const userIdOf = (value) => String(value?._id ?? value?.id ?? value ?? '');
const authorName = (author) => author?.username || 'Miembro';

function MessageComposer({ groupId, members, value, onChange, onSubmit, disabled, placeholder, buttonLabel, maxLength = 4000 }) {
  const textarea = useRef(null);
  const [suggestion, setSuggestion] = useState(null);
  const [eventOptions, setEventOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const requestId = useRef(0);
  const cursorRef = useRef(0);

  const updateSuggestion = (text, cursor) => {
    const before = text.slice(0, cursor);
    const match = before.match(/(?:^|\s)([@/])([^\s@/]*)$/);
    setSuggestion(match ? { type: match[1], query: match[2], start: cursor - match[0].length + match[0].indexOf(match[1]) } : null);
  };

  useEffect(() => {
    const sequence = ++requestId.current;
    if (suggestion?.type !== '/' || suggestion.query.length < 1) {
      setEventOptions([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const { data } = await fetchGroupEvents(groupId, { q: suggestion.query });
        if (sequence === requestId.current) setEventOptions(data);
      } catch {
        if (sequence === requestId.current) {
          setEventOptions([]);
          setSearchError('No se pudieron buscar eventos.');
        }
      } finally {
        if (sequence === requestId.current) setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [groupId, suggestion]);

  const insertSuggestion = (valueToInsert) => {
    const start = suggestion.start;
    const end = cursorRef.current;
    const next = `${value.slice(0, start)}${valueToInsert} ${value.slice(end)}`;
    onChange(next);
    setSuggestion(null);
    requestAnimationFrame(() => {
      textarea.current?.focus();
      const cursor = start + valueToInsert.length + 1;
      textarea.current?.setSelectionRange(cursor, cursor);
    });
  };

  const options = suggestion?.type === '@'
    ? members.filter((member) => member.username.toLowerCase().startsWith(suggestion.query.toLowerCase())).slice(0, 6)
    : eventOptions;

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="sr-only" htmlFor={placeholder.replace(/\W+/g, '-')}>Mensaje</label>
      <div className="relative">
        <textarea
          ref={textarea}
          id={placeholder.replace(/\W+/g, '-')}
          className="field min-h-24"
          maxLength={maxLength}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            cursorRef.current = event.target.selectionStart;
            updateSuggestion(event.target.value, event.target.selectionStart);
          }}
          onClick={(event) => {
            cursorRef.current = event.target.selectionStart;
            updateSuggestion(value, event.target.selectionStart);
          }}
          onKeyUp={(event) => {
            cursorRef.current = event.currentTarget.selectionStart;
            updateSuggestion(value, event.currentTarget.selectionStart);
          }}
          onKeyDown={(event) => {
            if (suggestion && event.key === 'Escape') setSuggestion(null);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required
        />
        {suggestion && suggestion.type === '@' && options.length > 0 && (
          <div className="absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            {options.map((member) => (
              <button key={member._id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertSuggestion(`@${member.username}`)} className="flex min-h-11 w-full items-center gap-2 px-3 text-left hover:bg-surface-2">
                <AtSign size={15} aria-hidden="true" /> {member.username}
              </button>
            ))}
          </div>
        )}
        {suggestion?.type === '/' && (
          <div className="absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            {searching && <p className="p-3 text-sm text-muted">Buscando eventos…</p>}
            {!searching && searchError && <p role="alert" className="p-3 text-sm text-danger">{searchError}</p>}
            {!searching && suggestion.query.length === 0 && <p className="p-3 text-sm text-muted">Escribí un título o código después de /</p>}
            {!searching && suggestion.query.length > 0 && !options.length && <p className="p-3 text-sm text-muted">No se encontraron eventos</p>}
            {options.map((event) => (
              <button key={event._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertSuggestion(`/${event._id}`)} className="flex min-h-12 w-full flex-col items-start justify-center px-3 text-left hover:bg-surface-2">
                <span className="max-w-full truncate font-semibold">{event.title}</span>
                <span className="text-xs text-muted">/{event._id}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">Markdown, @ menciones y /eventos · {value.length}/{maxLength}</p>
        <button type="submit" className="btn btn-primary btn-sm" disabled={disabled || !value.trim()}><Send size={15} aria-hidden="true" /> {buttonLabel}</button>
      </div>
    </form>
  );
}

function CommentThread({ groupId, post, members, currentUserId, canModerate }) {
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const load = async (nextCursor = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchGroupComments(groupId, post._id, nextCursor);
      setComments((current) => nextCursor ? [...current, ...data.items] : data.items);
      setCursor(data.nextCursor);
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudieron cargar los comentarios'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* one fetch when this thread opens */ }, [groupId, post._id]);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const { data } = await createGroupComment(groupId, post._id, content.trim());
      setComments((current) => [data, ...current]);
      setContent('');
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudo publicar el comentario'));
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment) => {
    if (!window.confirm('¿Borrar este comentario?')) return;
    try {
      await deleteGroupComment(groupId, post._id, comment._id);
      setComments((current) => current.filter((item) => item._id !== comment._id));
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudo borrar el comentario'));
    }
  };

  return (
    <div className="mt-4 space-y-4 border-t border-line pt-4">
      <MessageComposer groupId={groupId} members={members} value={content} onChange={setContent} onSubmit={submit} disabled={sending} placeholder="Dejá un comentario…" buttonLabel="Comentar" maxLength={2000} />
      {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      {loading && !comments.length && <p className="text-sm text-muted">Cargando comentarios…</p>}
      <div className="space-y-3">
        {comments.map((comment) => {
          const removable = canModerate || userIdOf(comment.author) === currentUserId;
          return (
            <article key={comment._id} className="rounded-2xl bg-surface-2 p-3">
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{authorName(comment.author)}</span>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('es')}</time>
                  {removable && <button type="button" onClick={() => remove(comment)} aria-label="Borrar comentario" className="rounded-lg p-1 hover:text-danger"><Trash2 size={15} aria-hidden="true" /></button>}
                </div>
              </div>
              <div className="text-sm"><GroupRichText content={comment.content} /></div>
            </article>
          );
        })}
      </div>
      {cursor && <button type="button" onClick={() => load(cursor)} disabled={loading} className="btn btn-quiet btn-sm">{loading ? 'Cargando…' : 'Ver comentarios anteriores'}</button>}
    </div>
  );
}

export default function GroupForum({ groupId, members, currentUserId, isCreator, isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [activePost, setActivePost] = useState('');
  const canModerate = isCreator || isAdmin;

  const load = async (nextCursor = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchGroupPosts(groupId, nextCursor);
      setPosts((current) => nextCursor ? [...current, ...data.items] : data.items);
      setCursor(data.nextCursor);
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudo cargar el foro'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* fetch only when the forum tab opens */ }, [groupId]);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const { data } = await createGroupPost(groupId, content.trim());
      setPosts((current) => [data, ...current]);
      setContent('');
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudo publicar el mensaje'));
    } finally {
      setSending(false);
    }
  };

  const remove = async (post) => {
    if (!window.confirm('¿Borrar este mensaje y sus comentarios?')) return;
    try {
      await deleteGroupPost(groupId, post._id);
      setPosts((current) => current.filter((item) => item._id !== post._id));
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudo borrar el mensaje'));
    }
  };

  return (
    <section aria-labelledby="group-forum-title" className="space-y-5">
      <div className="card p-4 sm:p-5">
        <h2 id="group-forum-title" className="mb-3 text-xl font-bold">Conversación del grupo</h2>
        <MessageComposer groupId={groupId} members={members} value={content} onChange={setContent} onSubmit={submit} disabled={sending} placeholder="Compartí una idea, consulta o actualización…" buttonLabel="Publicar" />
        {error && <p role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      </div>

      {loading && !posts.length && <div role="status" className="card flex min-h-32 items-center justify-center gap-2 p-6 text-muted"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Cargando mensajes</div>}
      {!loading && !error && !posts.length && <div className="card p-8 text-center text-muted"><MessageCircle size={24} className="mx-auto mb-2" aria-hidden="true" />Todavía no hay mensajes. Iniciá la conversación.</div>}
      {posts.map((post) => {
        const removable = canModerate || userIdOf(post.author) === currentUserId;
        return (
          <article key={post._id} className="card p-4 sm:p-5">
            <header className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{authorName(post.author)}</p>
                <time dateTime={post.createdAt} className="text-xs text-muted">{new Date(post.createdAt).toLocaleString('es')}</time>
              </div>
              {removable && <button type="button" onClick={() => remove(post)} aria-label="Borrar mensaje" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={17} aria-hidden="true" /></button>}
            </header>
            <div className="text-[0.98rem]"><GroupRichText content={post.content} /></div>
            <button type="button" onClick={() => setActivePost((current) => current === post._id ? '' : post._id)} aria-expanded={activePost === post._id} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
              <MoreHorizontal size={17} aria-hidden="true" /> {activePost === post._id ? 'Ocultar comentarios' : 'Comentar o ver conversación'}
            </button>
            {activePost === post._id && <CommentThread key={post._id} groupId={groupId} post={post} members={members} currentUserId={currentUserId} canModerate={canModerate} />}
          </article>
        );
      })}
      {cursor && <button type="button" onClick={() => load(cursor)} disabled={loading} className="btn btn-quiet w-full">{loading ? 'Cargando…' : 'Ver mensajes anteriores'}</button>}
      {loading && posts.length > 0 && <p role="status" className="text-center text-sm text-muted">Cargando mensajes…</p>}
    </section>
  );
}
