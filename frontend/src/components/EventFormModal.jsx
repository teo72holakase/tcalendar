import { useEffect, useState } from 'react';
import { Check, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import Modal from './Modal';
import Field from './Field';
import { DEFAULT_EVENT_COLOR, EVENT_COLORS, addDays, dayNum, noon, todayNum, ymd } from '../lib/ui';
import { fetchGroupResources } from '../services/api';

const empty = () => ({ title: '', description: '', topics: '', dueDate: ymd(todayNum()), color: DEFAULT_EVENT_COLOR, resources: [], resourceLinks: [] });

const EventFormModal = ({ open, onClose, onSave, loading, error, initialData, groupId }) => {
  const [form, setForm] = useState(empty);
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const [availableResources, setAvailableResources] = useState([]);
  const [resourceCursor, setResourceCursor] = useState(null);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceError, setResourceError] = useState('');
  const editing = Boolean(initialData?._id);

  // Depende de valores simples (no del objeto): si no, el formulario se reiniciaba mientras se escribía.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: initialData.title || '', description: initialData.description || '', topics: initialData.topics || '',
        color: initialData.color || DEFAULT_EVENT_COLOR, dueDate: ymd(dayNum(initialData.dueDate)),
        resources: (initialData.resources || []).filter(Boolean).map((resource) => String(resource?._id || resource)),
        resourceLinks: initialData.resourceLinks || [],
      });
    } else {
      setForm({ ...empty(), dueDate: initialData?.dueDate || ymd(todayNum()) });
    }
    setResourcePickerOpen(Boolean(initialData?.resources?.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?._id, initialData?.dueDate]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const loadResources = async (cursor = '') => {
    setResourcesLoading(true);
    setResourceError('');
    try {
      const { data } = await fetchGroupResources(groupId, cursor);
      const items = cursor ? data.items : [...(data.pinnedItems || []), ...data.items];
      setAvailableResources((current) => cursor ? [...current, ...items] : items);
      setResourceCursor(data.nextCursor);
      setResourcesLoaded(true);
    } catch (requestError) {
      setResourceError(requestError.response?.data?.message || 'No se pudieron cargar los recursos');
    } finally {
      setResourcesLoading(false);
    }
  };
  const toggleResourcePicker = () => setResourcePickerOpen((current) => !current);
  const toggleResource = (id) => setForm((current) => ({
    ...current,
    resources: current.resources.includes(id)
      ? current.resources.filter((resourceId) => resourceId !== id)
      : [...current.resources, id],
  }));
  const addResourceLink = () => setForm((current) => ({
    ...current,
    resourceLinks: [...current.resourceLinks, { title: '', url: '' }],
  }));
  const updateResourceLink = (index, key, value) => setForm((current) => ({
    ...current,
    resourceLinks: current.resourceLinks.map((link, i) => i === index ? { ...link, [key]: value } : link),
  }));
  const removeResourceLink = (index) => setForm((current) => ({
    ...current,
    resourceLinks: current.resourceLinks.filter((_, i) => i !== index),
  }));
  const quick = [
    { label: 'Hoy', value: ymd(todayNum()) },
    { label: 'Mañana', value: ymd(addDays(todayNum(), 1)) },
    { label: 'En 1 semana', value: ymd(addDays(todayNum(), 7)) },
  ];
  const selectedResourcesOutsidePage = (initialData?.resources || []).filter((resource) => {
    const id = String(resource?._id || resource);
    return form.resources.includes(id) && !availableResources.some((item) => String(item._id) === id);
  });

  useEffect(() => {
    if (open) {
      setAvailableResources([]);
      setResourceCursor(null);
      setResourcesLoaded(false);
      setResourceError('');
    }
  }, [open, groupId]);

  useEffect(() => {
    if (open && resourcePickerOpen && !resourcesLoaded && !resourcesLoading && !resourceError) loadResources();
    // Load only when the resource picker is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, groupId, resourcePickerOpen, resourcesLoaded, resourcesLoading, resourceError]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar evento' : 'Nuevo evento'} subtitle="Lo ve todo el grupo." titleId="event-form-title" size="max-w-xl">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, dueDate: noon(form.dueDate) }); }}>
        <Field data-autofocus label="¿Qué hay que entregar o hacer?" placeholder="Ej. Informe de laboratorio" value={form.title} onChange={set('title')} required maxLength={120} inputClassName="!text-lg font-semibold" />

        <fieldset>
          <legend className="field-label">¿Para cuándo?</legend>
          <div className="mb-3 flex flex-wrap gap-2">
            {quick.map((q) => (
              <button key={q.label} type="button" aria-pressed={form.dueDate === q.value} onClick={() => setForm({ ...form, dueDate: q.value })} className={`chip min-h-10 px-4 text-sm ${form.dueDate === q.value ? 'chip-strong' : ''}`}>{q.label}</button>
            ))}
          </div>
          <input aria-label="Fecha" type="date" className="field" value={form.dueDate} onChange={set('dueDate')} required />
        </fieldset>

        <Field label="Temas o propuesta" hint="Opcional" placeholder="Ej. Capítulos 3 y 4" value={form.topics} onChange={set('topics')} />
        <Field label="Detalles" hint="Opcional" multiline rows={4} placeholder="Todo lo que el grupo necesita saber" value={form.description} onChange={set('description')} />

        <section className="space-y-3 rounded-2xl border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">Recursos del evento</h3>
              <p className="text-sm text-muted">Enlaces útiles para esta actividad</p>
            </div>
            <button type="button" onClick={toggleResourcePicker} className="btn btn-quiet btn-sm">{resourcePickerOpen ? 'Ocultar selector' : <><Plus size={16} aria-hidden="true" /> Elegir del grupo</>}</button>
          </div>
          {resourcePickerOpen && (
            <div className="space-y-2">
              {selectedResourcesOutsidePage.map((resource) => (
                <div key={String(resource?._id || resource)} className="flex items-center justify-between gap-2 rounded-xl bg-accent-soft p-3 text-sm">
                  <span className="truncate font-medium">{resource?.title || 'Recurso seleccionado'}</span>
                  <button type="button" onClick={() => toggleResource(String(resource?._id || resource))} aria-label="Quitar recurso" className="rounded-lg p-2 text-muted hover:bg-surface"><X size={15} aria-hidden="true" /></button>
                </div>
              ))}
              {availableResources.map((resource) => (
                <label key={resource._id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-2 p-3">
                  <input type="checkbox" checked={form.resources.includes(String(resource._id))} disabled={!form.resources.includes(String(resource._id)) && form.resources.length >= 20} onChange={() => toggleResource(String(resource._id))} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{resource.title}</span>
                    <span className="block truncate text-xs text-muted">{resource.url}</span>
                  </span>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${resource.title}`} onClick={(event) => event.stopPropagation()} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink"><ExternalLink size={16} aria-hidden="true" /></a>
                </label>
              ))}
              {resourcesLoading && <p role="status" className="text-sm text-muted">Cargando recursos…</p>}
              {resourceError && <p role="alert" className="flex items-center justify-between gap-2 text-sm text-danger">{resourceError}<button type="button" onClick={() => loadResources(resourceCursor || '')} className="font-semibold underline">Reintentar</button></p>}
              {resourcesLoaded && !availableResources.length && <p className="text-sm text-muted">Todavía no hay recursos compartidos</p>}
              {resourceCursor && <button type="button" onClick={() => loadResources(resourceCursor)} disabled={resourcesLoading} className="btn btn-quiet btn-sm">{resourcesLoading ? 'Cargando…' : 'Ver más recursos'}</button>}
            </div>
          )}
          {form.resourceLinks.length > 0 && (
            <div className="space-y-3">
              {form.resourceLinks.map((link, index) => (
                <div key={index} className="grid gap-2 rounded-xl bg-surface-2 p-3 sm:grid-cols-[1fr_1.4fr_auto]">
                  <input className="field min-h-11" aria-label="Título del enlace" placeholder="Título" maxLength={120} required value={link.title} onChange={(event) => updateResourceLink(index, 'title', event.target.value)} />
                  <input className="field min-h-11" aria-label="URL del enlace" type="url" placeholder="https://…" maxLength={2048} required value={link.url} onChange={(event) => updateResourceLink(index, 'url', event.target.value)} />
                  <button type="button" onClick={() => removeResourceLink(index)} className="btn btn-quiet btn-sm" aria-label="Quitar enlace"><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          )}
          {form.resourceLinks.length < 10 && <button type="button" onClick={addResourceLink} className="btn btn-quiet btn-sm"><Plus size={16} aria-hidden="true" /> Añadir enlace externo</button>}
        </section>

        <fieldset>
          <legend className="field-label">Color</legend>
          <div className="flex flex-wrap gap-2.5">
            {EVENT_COLORS.map((c) => (
              <button key={c.hex} type="button" aria-label={c.name} title={c.name} aria-pressed={form.color === c.hex} onClick={() => setForm({ ...form, color: c.hex })} style={{ background: c.hex }} className={`flex h-11 w-11 items-center justify-center rounded-full text-[#1a1a1a] transition hover:scale-105 ${form.color === c.hex ? 'ring-[3px] ring-ink ring-offset-2 ring-offset-surface' : ''}`}>
                {form.color === c.hex && <Check size={20} strokeWidth={3} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <div role="alert" className="rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{error}</div>}
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-quiet">Cancelar</button>
          <button type="submit" disabled={loading || !form.title.trim()} className="btn btn-primary">{loading ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear evento'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default EventFormModal;
