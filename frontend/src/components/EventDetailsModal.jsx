import { useState } from 'react';
import { Check, ExternalLink, File, FileText, FolderOpen } from 'lucide-react';
import Modal from './Modal';
import { Avatar } from './Avatar';
import { DEFAULT_EVENT_COLOR, EVENT_COLORS, dayNum, daysUntil, fmt, relative, relClass } from '../lib/ui';

const Row = ({ label, children }) => (
  <div>
    <dt className="text-sm font-semibold text-muted">{label}</dt>
    <dd className="mt-0.5 whitespace-pre-wrap break-words text-lg">{children}</dd>
  </div>
);

const resourceIcon = (fileType, url = '') => {
  if (/\/folders\//i.test(url)) return FolderOpen;
  if (fileType === 'pdf' || /\.pdf(?:$|[?#])/i.test(url)) return FileText;
  return File;
};

const EventDetailsModal = ({ open, onClose, event, onDelete, onEdit, onColorChange, canDelete, loading, error }) => {
  const [colorError, setColorError] = useState('');
  const [saving, setSaving] = useState(false);
  if (!event) return null;

  const color = event.color || DEFAULT_EVENT_COLOR;
  const n = daysUntil(event.dueDate);

  const pick = async (hex) => {
    setSaving(true);
    setColorError('');
    const result = await onColorChange(event, hex);
    setSaving(false);
    if (result !== true) setColorError(result || 'No se pudo cambiar el color. Intentá de nuevo.');
  };

  return (
    <Modal
      open={open} onClose={onClose} titleId="event-details-title" size="max-w-lg"
      title={<span className="flex items-start gap-3"><span aria-hidden="true" className="mt-2 h-4 w-4 shrink-0 rounded-full" style={{ background: color }} />{event.title || 'Sin título'}</span>}
    >
      <p className="mb-5 flex flex-wrap items-center gap-2 text-lg">
        <span className="capitalize">{fmt(dayNum(event.dueDate), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <span className={`chip ${relClass(n)}`}>{relative(n)}</span>
      </p>
      <dl className="space-y-4">
        {event.topics && <Row label="Temas o propuesta">{event.topics}</Row>}
        {event.description && <Row label="Detalles">{event.description}</Row>}
        <Row label="Creado por"><span className="inline-flex items-center gap-2"><Avatar name={event.createdBy?.username || '?'} size={28} /> {event.createdBy?.username || 'Usuario desconocido'}</span></Row>
        {event.createdAt && <Row label="Creado el">{new Date(event.createdAt).toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' })}</Row>}
      </dl>

      {((event.resources?.length || 0) > 0 || (event.resourceLinks?.length || 0) > 0) && (
        <section className="mt-6 space-y-2" aria-label="Recursos adjuntos">
          <h3 className="text-sm font-semibold text-muted">Recursos</h3>
          {[...(event.resources || []).filter(Boolean), ...(event.resourceLinks || [])].map((resource, index) => {
            const Icon = resourceIcon(resource.fileType, resource.url);
            return (
              <a key={resource._id || `${resource.url}-${index}`} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 rounded-xl border border-line p-3 hover:bg-surface-2">
                <Icon size={18} className="shrink-0 text-muted" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium">{resource.title}</span>
                <ExternalLink size={16} className="shrink-0 text-muted" aria-hidden="true" />
              </a>
            );
          })}
        </section>
      )}

      {canDelete && (
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-muted">Color</legend>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {EVENT_COLORS.map((c) => (
              <button key={c.hex} type="button" disabled={saving} aria-label={c.name} title={c.name} aria-pressed={color === c.hex} onClick={() => pick(c.hex)} style={{ background: c.hex }} className={`flex h-11 w-11 items-center justify-center rounded-full text-[#1a1a1a] transition hover:scale-105 disabled:opacity-60 ${color === c.hex ? 'ring-[3px] ring-ink ring-offset-2 ring-offset-surface' : ''}`}>
                {color === c.hex && <Check size={20} strokeWidth={3} aria-hidden="true" />}
              </button>
            ))}
          </div>
          {colorError && <p role="alert" className="mt-2 text-sm font-medium text-danger">{colorError}</p>}
        </fieldset>
      )}

      {error && <div role="alert" className="mt-5 rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{error}</div>}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="btn btn-quiet">Cerrar</button>
        {canDelete && <button type="button" onClick={() => onEdit(event)} className="btn btn-quiet">Editar</button>}
        {canDelete && <button type="button" onClick={() => onDelete(event)} disabled={loading} className="btn btn-danger">{loading ? 'Eliminando…' : 'Eliminar'}</button>}
      </div>
    </Modal>
  );
};

export default EventDetailsModal;
