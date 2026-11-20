import { useEffect, useState } from 'react';
import Modal from './Modal';
import Field from './Field';
import { SCHEDULE_PRESETS, createPreset } from '../lib/schedulePresets';

const ScheduleCreateModal = ({ open, onClose, onCreate, loading, error }) => {
  const [presetId, setPresetId] = useState('blank');
  const [title, setTitle] = useState('Mi horario');

  useEffect(() => {
    if (open) {
      setPresetId('blank');
      setTitle('Mi horario');
    }
  }, [open]);

  const choosePreset = (id) => {
    setPresetId(id);
    setTitle(createPreset(id).title);
  };

  return (
    <Modal open={open} onClose={onClose} title="Crear horario" subtitle="Empezá con una tabla vacía o adaptá uno de los presets." titleId="create-schedule-title">
      <form className="space-y-5" onSubmit={(event) => {
        event.preventDefault();
        onCreate({ ...createPreset(presetId), title: title.trim() });
      }}>
        <div>
          <label htmlFor="schedule-preset" className="field-label">Preset</label>
          <select id="schedule-preset" className="field" value={presetId} onChange={(event) => choosePreset(event.target.value)}>
            {SCHEDULE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
          </select>
          <p className="field-hint">{SCHEDULE_PRESETS.find((preset) => preset.id === presetId)?.description}</p>
        </div>
        <Field data-autofocus label="Nombre del horario" maxLength={80} required value={title} onChange={(event) => setTitle(event.target.value)} />
        {error && <div role="alert" className="rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{error}</div>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-quiet">Cancelar</button>
          <button disabled={loading || !title.trim()} className="btn btn-primary">{loading ? 'Creando…' : 'Crear horario'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleCreateModal;
