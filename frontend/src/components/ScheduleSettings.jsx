import { WEEK_DAYS, formatMinute } from '../lib/schedulePresets';

const times = Array.from({ length: 97 }, (_, index) => index * 15);

const ScheduleSettings = ({ value, onChange, onSave, onCancel, saving, error, blocksFit }) => {
  const update = (key, next) => onChange({ ...value, [key]: next });
  const updateDays = (day) => {
    const days = value.days.includes(day)
      ? value.days.filter((item) => item !== day)
      : [...value.days, day].sort((a, b) => a - b);
    if (days.length) update('days', days);
  };

  return (
    <section aria-labelledby="schedule-settings-title" className="card schedule-settings no-print">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="schedule-settings-title" className="text-xl font-bold">Ajustes de la tabla</h2>
          <p className="mt-1 text-sm text-muted">Adaptá los días, el rango y el tamaño de cada celda.</p>
        </div>
        <button type="button" onClick={onCancel} className="btn btn-quiet btn-sm">Cerrar</button>
      </div>

      <fieldset>
        <legend className="field-label">Días visibles</legend>
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => (
            <label key={day.value} className="cursor-pointer">
              <input type="checkbox" checked={value.days.includes(day.value)} onChange={() => updateDays(day.value)} className="peer sr-only" />
              <span className="flex min-h-10 items-center rounded-xl border border-line bg-surface-2 px-3 text-sm font-semibold text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-text peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-accent">{day.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="schedule-from" className="field-label">Primera hora</label>
          <select id="schedule-from" className="field" value={value.startMinute} onChange={(event) => {
            const startMinute = Number(event.target.value);
            update('startMinute', startMinute < value.endMinute ? startMinute : value.endMinute - 15);
          }}>
            {times.filter((minute) => minute < value.endMinute).map((minute) => <option key={minute} value={minute}>{formatMinute(minute)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="schedule-to" className="field-label">Última hora</label>
          <select id="schedule-to" className="field" value={value.endMinute} onChange={(event) => {
            const endMinute = Number(event.target.value);
            update('endMinute', endMinute > value.startMinute ? endMinute : value.startMinute + 15);
          }}>
            {times.filter((minute) => minute > value.startMinute).map((minute) => <option key={minute} value={minute}>{formatMinute(minute)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="schedule-interval" className="field-label">Filas de</label>
          <select id="schedule-interval" className="field" value={value.interval} onChange={(event) => update('interval', Number(event.target.value))}>
            {[15, 30, 60].map((interval) => <option key={interval} value={interval}>{interval} minutos</option>)}
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Ancho de las columnas <span className="font-normal text-muted">{value.columnWidth}px</span></span>
          <input type="range" min="100" max="320" step="4" value={value.columnWidth} onChange={(event) => update('columnWidth', Number(event.target.value))} className="schedule-range" />
        </label>
        <label className="block">
          <span className="field-label">Alto de las filas <span className="font-normal text-muted">{value.rowHeight}px</span></span>
          <input type="range" min="28" max="100" step="4" value={value.rowHeight} onChange={(event) => update('rowHeight', Number(event.target.value))} className="schedule-range" />
        </label>
      </div>

      {!blocksFit && <p className="mt-4 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">Algunos bloques quedan fuera de los días u horas elegidos. Ajustalos antes de guardar la tabla.</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">{error}</p>}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn btn-quiet">Cancelar cambios</button>
        <button type="button" onClick={onSave} disabled={saving || !blocksFit} className="btn btn-primary">{saving ? 'Guardando…' : 'Guardar ajustes'}</button>
      </div>
    </section>
  );
};

export default ScheduleSettings;
