import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Modal from './Modal';
import Field from './Field';
import { DEFAULT_EVENT_COLOR, EVENT_COLORS, addDays, dayNum, noon, todayNum, ymd } from '../lib/ui';

const empty = () => ({ title: '', description: '', topics: '', dueDate: ymd(todayNum()), color: DEFAULT_EVENT_COLOR });

const EventFormModal = ({ open, onClose, onSave, loading, error, initialData }) => {
  const [form, setForm] = useState(empty);
  const editing = Boolean(initialData?._id);

  // Depende de valores simples (no del objeto): si no, el formulario se reiniciaba mientras se escribía.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: initialData.title || '', description: initialData.description || '', topics: initialData.topics || '',
        color: initialData.color || DEFAULT_EVENT_COLOR, dueDate: ymd(dayNum(initialData.dueDate)),
      });
    } else {
      setForm({ ...empty(), dueDate: initialData?.dueDate || ymd(todayNum()) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?._id, initialData?.dueDate]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const quick = [
    { label: 'Hoy', value: ymd(todayNum()) },
    { label: 'Mañana', value: ymd(addDays(todayNum(), 1)) },
    { label: 'En 1 semana', value: ymd(addDays(todayNum(), 7)) },
  ];

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
