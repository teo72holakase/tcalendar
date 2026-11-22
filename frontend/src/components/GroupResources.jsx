import { useEffect, useState } from 'react';
import { File, FileImage, FileText, Link2, Plus, Trash2 } from 'lucide-react';
import { createGroupResource, deleteGroupResource, fetchGroupResources } from '../services/api';

const errorText = (error, fallback) => error.response?.data?.message || fallback;
const idOf = (value) => String(value?._id ?? value?.id ?? value ?? '');

const fileInfo = (resource) => {
  const fileType = resource.fileType || 'auto';
  let pathname = '';
  let host = '';
  try {
    const parsed = new URL(resource.url);
    pathname = decodeURIComponent(parsed.pathname).toLowerCase();
    host = parsed.hostname.replace(/^www\./, '');
  } catch {
    host = 'Enlace compartido';
  }
  if (fileType === 'pdf' || (fileType === 'auto' && /\.pdf$/.test(pathname))) return { Icon: FileText, type: 'PDF' };
  if (fileType === 'document' || (fileType === 'auto' && (/\.(docx?|odt|rtf)$/.test(pathname) || host === 'docs.google.com'))) return { Icon: FileText, type: 'Documento editable' };
  if (fileType === 'image' || (fileType === 'auto' && /\.(png|jpe?g|gif|webp|svg)$/.test(pathname))) return { Icon: FileImage, type: 'Imagen' };
  if (fileType === 'link') return { Icon: Link2, type: 'Enlace' };
  return { Icon: File, type: 'Archivo o enlace' };
};

export default function GroupResources({ groupId, currentUserId, isCreator, isAdmin }) {
  const [resources, setResources] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '', fileType: 'auto' });
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const load = async (nextCursor = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchGroupResources(groupId, nextCursor);
      setResources((current) => nextCursor ? [...current, ...data.items] : data.items);
      setCursor(data.nextCursor);
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudieron cargar los recursos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* fetch only when the resources tab opens */ }, [groupId]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const { data } = await createGroupResource(groupId, {
        title: form.title.trim(),
        description: form.description.trim(),
        url: form.url.trim(),
        fileType: form.fileType,
      });
      setResources((current) => [data, ...current]);
      setForm({ title: '', description: '', url: '', fileType: 'auto' });
      setFormOpen(false);
    } catch (requestError) {
      setFormError(errorText(requestError, 'No se pudo guardar el enlace'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (resource) => {
    if (!window.confirm(`¿Quitar “${resource.title}” de los recursos?`)) return;
    setError('');
    try {
      await deleteGroupResource(groupId, resource._id);
      setResources((current) => current.filter((item) => item._id !== resource._id));
    } catch (requestError) {
      setError(errorText(requestError, 'No se pudo borrar el recurso'));
    }
  };

  return (
    <section aria-labelledby="group-resources-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="group-resources-title" className="text-2xl font-bold">Recursos compartidos</h2>
          <p className="mt-1 text-sm text-muted">Enlaces a documentos, imágenes y archivos del grupo.</p>
        </div>
        <button type="button" onClick={() => { setFormOpen((open) => !open); setFormError(''); }} className="btn btn-primary btn-sm"><Plus size={17} aria-hidden="true" /> Agregar recurso</button>
      </div>

      {formOpen && (
        <form onSubmit={submit} className="card space-y-3 p-4 sm:p-5">
          <label className="block"><span className="field-label">Título</span><input className="field" maxLength={120} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ej.: Apuntes de la unidad 2" /></label>
          <label className="block"><span className="field-label">Enlace compartido</span><input className="field" type="url" required maxLength={2048} value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://drive.google.com/…" /></label>
          <label className="block"><span className="field-label">Tipo de archivo</span><select className="field" value={form.fileType} onChange={(event) => setForm((current) => ({ ...current, fileType: event.target.value }))}><option value="auto">Detectar por enlace</option><option value="pdf">PDF</option><option value="document">Documento editable</option><option value="image">Imagen (PNG y otros)</option><option value="link">Otro enlace</option></select></label>
          <label className="block"><span className="field-label">Descripción <span className="font-normal text-muted">(opcional)</span></span><textarea className="field min-h-20" maxLength={500} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Qué contiene o para qué sirve" /></label>
          <p className="flex items-center gap-2 text-xs text-muted"><Link2 size={14} aria-hidden="true" /> Compartí el enlace con los permisos adecuados en la plataforma de origen.</p>
          {formError && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Guardando…' : 'Guardar recurso'}</button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      {loading && !resources.length && <div role="status" className="card p-6 text-center text-muted">Cargando recursos…</div>}
      {!loading && !error && !resources.length && <div className="card p-8 text-center text-muted">Todavía no hay enlaces. Agregá el primero para compartirlo con el grupo.</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => {
          const { Icon, type } = fileInfo(resource);
          const domain = (() => { try { return new URL(resource.url).hostname.replace(/^www\./, ''); } catch { return 'Enlace externo'; } })();
          const removable = isCreator || isAdmin || idOf(resource.createdBy) === currentUserId;
          return (
            <article key={resource._id} className="card flex min-w-0 gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Icon size={21} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="break-words font-bold text-ink hover:text-accent-text hover:underline">{resource.title}</a>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><span>{type}</span><span aria-hidden="true">·</span><span className="truncate">{domain}</span></p>
                {resource.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{resource.description}</p>}
                <p className="mt-2 text-xs text-muted">Agregó {resource.createdBy?.username || 'un miembro'}</p>
              </div>
              {removable && <button type="button" onClick={() => remove(resource)} aria-label={`Borrar ${resource.title}`} title="Borrar recurso" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={17} aria-hidden="true" /></button>}
            </article>
          );
        })}
      </div>
      {cursor && <button type="button" onClick={() => load(cursor)} disabled={loading} className="btn btn-quiet w-full">{loading ? 'Cargando…' : 'Ver recursos anteriores'}</button>}
    </section>
  );
}
