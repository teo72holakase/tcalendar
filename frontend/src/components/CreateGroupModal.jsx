import { useEffect, useState } from 'react';
import Modal from './Modal';
import Field from './Field';
import { GROUP_ICONS } from '../lib/groupIcons';

const EMPTY = { name: '', description: '', icon: 'calendar' };

const CreateGroupModal = ({ open, onClose, onCreate, loading, error }) => {
  const [data, setData] = useState(EMPTY);
  // Se limpia al cerrar (no al enviar): si falla la creación no se pierde lo escrito.
  useEffect(() => { if (!open) setData(EMPTY); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Nuevo grupo" subtitle="Un espacio compartido para tu equipo, curso o familia." titleId="create-group-title">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onCreate(data); }}>
        <Field data-autofocus label="Nombre del grupo" placeholder="Ej. Proyecto final" maxLength={60} required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        <Field label="Descripción" hint="Opcional" multiline rows={3} value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
        <fieldset>
          <legend className="field-label">Sello del grupo</legend>
          <div className="grid grid-cols-4 gap-2">
            {GROUP_ICONS.map(({ id, label, Icon }) => (
              <label key={id} className="cursor-pointer">
                <input type="radio" name="icon" value={id} checked={data.icon === id} onChange={() => setData({ ...data, icon: id })} className="peer sr-only" />
                <span className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-line bg-surface-2 text-muted transition hover:border-muted/50 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-text peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-accent" title={label}>
                  <Icon size={19} aria-hidden="true" />
                  <span className="text-[0.7rem] font-semibold">{label}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <div role="alert" className="rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{error}</div>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-quiet">Cancelar</button>
          <button disabled={loading || !data.name.trim()} className="btn btn-primary">{loading ? 'Creando…' : 'Crear grupo'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
