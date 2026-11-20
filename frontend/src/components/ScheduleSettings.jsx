import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { WEEK_DAYS, formatMinute, createRowId } from '../lib/schedulePresets';

const quarterHours = Array.from({ length: 97 }, (_, index) => index * 15);
const timeValue = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const parseTime = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const moveItem = (items, index, offset) => {
  const destination = index + offset;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
};

const ScheduleSettings = ({ value, onChange, onSave, onCancel, saving, error, blocksFit, blocks, settingsReady }) => {
  const mode = value.layoutMode || 'interval';
  const updateMany = (patch) => onChange({ ...value, ...patch });
  const update = (key, next) => updateMany({ [key]: next });
  const updateDays = (day) => {
    const days = value.days.includes(day)
      ? value.days.filter((item) => item !== day)
      : [...value.days, day].sort((a, b) => a - b);
    if (days.length) update('days', days);
  };
  const updatePeriods = (periods) => {
    const endMinute = value.startMinute + periods.reduce((sum, period) => sum + period.durationMinutes + period.gapAfterMinutes, 0) - periods.at(-1).gapAfterMinutes;
    updateMany({ periods, endMinute });
  };
  const updatePeriod = (id, patch) => updatePeriods(value.periods.map((period) => period.id === id ? { ...period, ...patch } : period));
  const updateColumn = (id, patch) => update('columns', value.columns.map((column) => column.id === id ? { ...column, ...patch } : column));
  const updateRow = (id, patch) => update('rows', value.rows.map((row) => row.id === id ? { ...row, ...patch } : row));

  return (
    <section aria-labelledby="schedule-settings-title" className="card schedule-settings no-print">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="schedule-settings-title" className="text-xl font-bold">Ajustes de la tabla</h2>
          <p className="mt-1 text-sm text-muted">
            {mode === 'interval' && 'Los eventos se ajustan a las filas y a la duración elegida.'}
            {mode === 'blocks' && 'Las pausas se indican entre períodos, pero no dejan espacios vacíos.'}
            {mode === 'custom' && 'Personalizá los encabezados, las referencias y el tamaño de cada celda.'}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="btn btn-quiet btn-sm">Cerrar</button>
      </div>

      {mode !== 'custom' ? (
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
      ) : (
        <label className="block max-w-sm">
          <span className="field-label">Encabezado de la esquina</span>
          <input className="field" maxLength={40} value={value.cornerLabel} onChange={(event) => update('cornerLabel', event.target.value)} />
        </label>
      )}

      {mode === 'interval' && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="schedule-from" className="field-label">Primera hora</label>
              <select id="schedule-from" className="field" value={value.startMinute} onChange={(event) => {
                const startMinute = Number(event.target.value);
                const nextStart = startMinute < value.endMinute ? startMinute : value.endMinute - value.interval;
                const duration = value.endMinute - value.startMinute;
                const nextEnd = Math.min(1440, nextStart + Math.ceil(duration / value.interval) * value.interval);
                updateMany({ startMinute: nextStart, endMinute: nextEnd });
              }}>
                {quarterHours.filter((minute) => minute < value.endMinute).map((minute) => <option key={minute} value={minute}>{formatMinute(minute)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="schedule-to" className="field-label">Última hora</label>
              <select id="schedule-to" className="field" value={value.endMinute} onChange={(event) => {
                const endMinute = Number(event.target.value);
                update('endMinute', endMinute > value.startMinute ? endMinute : value.startMinute + value.interval);
              }}>
                {quarterHours.filter((minute) => minute > value.startMinute && (minute - value.startMinute) % value.interval === 0).map((minute) => <option key={minute} value={minute}>{formatMinute(minute)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="schedule-interval" className="field-label">Filas de</label>
              <select id="schedule-interval" className="field" value={value.interval} onChange={(event) => {
                const interval = Number(event.target.value);
                const endMinute = value.startMinute + Math.ceil((value.endMinute - value.startMinute) / interval) * interval;
                updateMany({ interval, endMinute: Math.min(1440, endMinute) });
              }}>
                {[15, 30, 60].map((interval) => <option key={interval} value={interval}>{interval} minutos</option>)}
              </select>
            </div>
          </div>
          <label className="mt-5 block">
            <span className="field-label">Alto de cada fila <span className="font-normal text-muted">{value.rowHeight}px</span></span>
            <input type="range" min="28" max="100" step="4" value={value.rowHeight} onChange={(event) => update('rowHeight', Number(event.target.value))} className="schedule-range" />
          </label>
          <label className="mt-4 block">
            <span className="field-label">Ancho de cada día <span className="font-normal text-muted">{value.columnWidth}px</span></span>
            <input type="range" min="100" max="320" step="4" value={value.columnWidth} onChange={(event) => update('columnWidth', Number(event.target.value))} className="schedule-range" />
          </label>
        </>
      )}

      {mode === 'blocks' && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label>
              <span className="field-label">Inicio de la secuencia</span>
              <input type="time" step="300" className="field" value={timeValue(value.startMinute)} onChange={(event) => {
                const startMinute = parseTime(event.target.value);
                const duration = value.periods.reduce((sum, period) => sum + period.durationMinutes + period.gapAfterMinutes, 0) - value.periods.at(-1).gapAfterMinutes;
                updateMany({ startMinute, endMinute: startMinute + duration });
              }} />
            </label>
            <label>
              <span className="field-label">Alto de referencia por 15 min <span className="font-normal text-muted">{value.rowHeight}px</span></span>
              <input type="range" min="28" max="100" step="4" value={value.rowHeight} onChange={(event) => update('rowHeight', Number(event.target.value))} className="schedule-range" />
            </label>
            <label>
              <span className="field-label">Ancho de cada día <span className="font-normal text-muted">{value.columnWidth}px</span></span>
              <input type="range" min="100" max="320" step="4" value={value.columnWidth} onChange={(event) => update('columnWidth', Number(event.target.value))} className="schedule-range" />
            </label>
          </div>
          <fieldset className="mt-5">
            <legend className="field-label">Secuencia de períodos</legend>
            <div className="space-y-3">
              {value.periods.map((period, index) => (
                <div key={period.id}>
                  <div className="grid gap-3 rounded-xl border border-line bg-surface-2 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
                    <label>
                      <span className="field-label">Nombre del período</span>
                      <input className="field" maxLength={40} value={period.label} onChange={(event) => updatePeriod(period.id, { label: event.target.value })} />
                    </label>
                    <label>
                      <span className="field-label">Duración (min)</span>
                      <input className="field" type="number" min="15" max="360" step="5" value={period.durationMinutes} onChange={(event) => {
                        const durationMinutes = Number(event.target.value);
                        updatePeriod(period.id, { durationMinutes });
                      }} />
                    </label>
                    <button type="button" disabled={value.periods.length <= 1 || blocks.some((block) => block.rowId === period.id)} onClick={() => updatePeriods(value.periods.filter((item) => item.id !== period.id))} className="btn btn-quiet btn-sm text-danger" aria-label={`Eliminar ${period.label}`}><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                  {index < value.periods.length - 1 && (
                    <label className="schedule-gap-control">
                      <span className="schedule-gap-plus" aria-hidden="true">+</span>
                      <span>Pausa invisible</span>
                      <input type="number" min="0" max="240" step="5" value={period.gapAfterMinutes} onChange={(event) => {
                        const gapAfterMinutes = Number(event.target.value);
                        updatePeriod(period.id, { gapAfterMinutes });
                      }} className="field schedule-gap-input" aria-label={`Pausa después de ${period.label}, en minutos`} />
                      <span>min</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
            <button type="button" disabled={value.periods.length >= 60} onClick={() => updatePeriods([...value.periods, { id: createRowId('period'), label: `Hora ${value.periods.length + 1}`, durationMinutes: 30, gapAfterMinutes: 0 }])} className="btn btn-quiet btn-sm mt-4"><Plus size={16} aria-hidden="true" /> Añadir período</button>
          </fieldset>
        </>
      )}

      {mode === 'custom' && (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <fieldset className="min-w-0">
            <legend className="field-label">Columnas superiores</legend>
            <div className="space-y-3">
              {value.columns.map((column, index) => (
                <div key={column.id} className="grid gap-3 rounded-xl border border-line bg-surface-2 p-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto_auto_auto] sm:items-end">
                  <label>
                    <span className="field-label">Referencia</span>
                    <input className="field" maxLength={40} value={column.label} onChange={(event) => updateColumn(column.id, { label: event.target.value })} />
                  </label>
                  <label>
                    <span className="field-label">Ancho</span>
                    <input className="field" type="number" min="100" max="320" step="4" value={column.width} onChange={(event) => updateColumn(column.id, { width: Number(event.target.value) })} />
                  </label>
                  <button type="button" disabled={index === 0} onClick={() => update('columns', moveItem(value.columns, index, -1))} className="btn btn-quiet btn-sm" aria-label={`Mover ${column.label} a la izquierda`}><ArrowLeft size={16} aria-hidden="true" /></button>
                  <button type="button" disabled={index >= value.columns.length - 1} onClick={() => update('columns', moveItem(value.columns, index, 1))} className="btn btn-quiet btn-sm" aria-label={`Mover ${column.label} a la derecha`}><ArrowRight size={16} aria-hidden="true" /></button>
                  <button type="button" disabled={value.columns.length <= 1 || blocks.some((block) => block.columnId === column.id)} onClick={() => update('columns', value.columns.filter((item) => item.id !== column.id))} className="btn btn-quiet btn-sm text-danger" aria-label={`Eliminar ${column.label}`}><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
            <button type="button" disabled={value.columns.length >= 14} onClick={() => update('columns', [...value.columns, { id: createRowId('column'), label: `Columna ${value.columns.length + 1}`, width: value.columnWidth }])} className="btn btn-quiet btn-sm mt-3"><Plus size={16} aria-hidden="true" /> Añadir columna</button>
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="field-label">Filas y referencias laterales</legend>
            <div className="space-y-3">
              {value.rows.map((row, index) => (
                <div key={row.id}>
                  <div className="grid gap-3 rounded-xl border border-line bg-surface-2 p-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto_auto_auto] sm:items-end">
                    <label>
                      <span className="field-label">Referencia</span>
                      <input className="field" maxLength={50} value={row.label} onChange={(event) => updateRow(row.id, { label: event.target.value })} />
                    </label>
                    <label>
                      <span className="field-label">Alto</span>
                      <input className="field" type="number" min="28" max="240" step="4" value={row.height} onChange={(event) => updateRow(row.id, { height: Number(event.target.value) })} />
                    </label>
                    <button type="button" disabled={index === 0} onClick={() => update('rows', moveItem(value.rows, index, -1))} className="btn btn-quiet btn-sm" aria-label={`Mover ${row.label} hacia arriba`}><ArrowUp size={16} aria-hidden="true" /></button>
                    <button type="button" disabled={index >= value.rows.length - 1} onClick={() => update('rows', moveItem(value.rows, index, 1))} className="btn btn-quiet btn-sm" aria-label={`Mover ${row.label} hacia abajo`}><ArrowDown size={16} aria-hidden="true" /></button>
                    <button type="button" disabled={value.rows.length <= 1 || blocks.some((block) => block.rowId === row.id)} onClick={() => update('rows', value.rows.filter((item) => item.id !== row.id))} className="btn btn-quiet btn-sm text-danger" aria-label={`Eliminar ${row.label}`}><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                  {index < value.rows.length - 1 && (
                    <label className="schedule-gap-control">
                      <span className="schedule-gap-plus" aria-hidden="true">+</span>
                      <span>Indicador de pausa</span>
                      <input type="number" min="0" max="240" step="5" value={row.gapAfterMinutes} onChange={(event) => updateRow(row.id, { gapAfterMinutes: Number(event.target.value) })} className="field schedule-gap-input" aria-label={`Indicador después de ${row.label}, en minutos`} />
                      <span>min</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
            <button type="button" disabled={value.rows.length >= 60} onClick={() => update('rows', [...value.rows, { id: createRowId('row'), label: `Fila ${value.rows.length + 1}`, height: 56, gapAfterMinutes: 0 }])} className="btn btn-quiet btn-sm mt-3"><Plus size={16} aria-hidden="true" /> Añadir fila</button>
          </fieldset>
        </div>
      )}

      {!blocksFit && <p className="mt-4 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">Algunos bloques quedan fuera de la tabla. Ajustalos antes de guardar la configuración.</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">{error}</p>}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn btn-quiet">Cancelar cambios</button>
        <button type="button" onClick={onSave} disabled={saving || !blocksFit || !settingsReady} className="btn btn-primary">{saving ? 'Guardando…' : 'Guardar ajustes'}</button>
      </div>
    </section>
  );
};

export default ScheduleSettings;
