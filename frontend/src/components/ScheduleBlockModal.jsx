import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import Field from './Field';
import { BLOCK_COLORS, WEEK_DAYS, formatMinute, getPeriodRows } from '../lib/schedulePresets';

const ScheduleBlockModal = ({ open, onClose, onSave, onDelete, settings, initialData, initialDay, initialMinute, initialRowId, initialColumnId, loading, error }) => {
  const mode = settings.layoutMode || 'interval';
  const periods = useMemo(() => getPeriodRows(settings), [settings]);
  const times = useMemo(() => {
    const values = [];
    const interval = mode === 'interval' ? settings.interval : 15;
    for (let minute = settings.startMinute; minute <= settings.endMinute; minute += interval) values.push(minute);
    return values;
  }, [mode, settings]);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open) return;
    const step = mode === 'interval' ? settings.interval : 15;
    const startMinute = initialData?.startMinute ?? settings.startMinute + Math.max(0, Math.floor(((initialMinute ?? settings.startMinute) - settings.startMinute) / step)) * step;
    const defaultEndMinute = Math.min(settings.endMinute, startMinute + Math.max(step, Math.ceil(60 / step) * step));
    const selectedPeriod = periods.find((period) => period.id === (initialData?.rowId || initialRowId))
      || periods.find((period) => period.startMinute === initialData?.startMinute && period.endMinute === initialData?.endMinute)
      || periods[0];
    const selectedRow = settings.rows?.find((row) => row.id === (initialData?.rowId || initialRowId)) || settings.rows?.[0];
    setData({
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      days: initialData?.days ?? (mode === 'custom' ? [] : [initialDay ?? settings.days[0] ?? 1]),
      startMinute: mode === 'blocks' ? selectedPeriod?.startMinute : startMinute,
      endMinute: mode === 'blocks' ? selectedPeriod?.endMinute : (initialData?.endMinute ?? defaultEndMinute),
      rowId: mode === 'blocks' ? selectedPeriod?.id : selectedRow?.id ?? '',
      columnId: initialData?.columnId ?? initialColumnId ?? settings.columns?.[0]?.id ?? '',
      color: initialData?.color ?? BLOCK_COLORS[0],
      tone: initialData?.tone ?? 'soft',
    });
  }, [mode, open, initialData, initialDay, initialMinute, initialRowId, initialColumnId, periods, settings]);

  if (!data) return <Modal open={false} onClose={onClose} title="" titleId="edit-schedule-block-title" />;

  const availableDays = mode === 'custom' ? [] : WEEK_DAYS.filter((day) => settings.days.includes(day.value));
  const endTimes = times.filter((minute) => minute > data.startMinute);
  const update = (key, value) => setData((current) => ({ ...current, [key]: value }));
  const toggleDay = (day) => update('days', data.days.includes(day)
    ? data.days.filter((item) => item !== day)
    : [...data.days, day].sort((a, b) => a - b));
  const selectedPeriod = periods.find((period) => period.id === data.rowId);
  const submitData = {
    ...data,
    days: mode === 'custom' ? [] : data.days,
    startMinute: mode === 'custom' ? null : data.startMinute,
    endMinute: mode === 'custom' ? null : data.endMinute,
    rowId: mode === 'interval' ? '' : data.rowId,
    columnId: mode === 'custom' ? data.columnId : '',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar bloque' : 'Nuevo bloque'}
      subtitle={mode === 'custom' ? 'Elegí una fila y una columna de la grilla.' : mode === 'blocks' ? 'Asigná una actividad a uno de tus períodos.' : 'Elegí los días y un rango alineado a las filas.'}
      titleId="edit-schedule-block-title"
    >
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(submitData); }}>
        <Field data-autofocus label="Actividad" placeholder="Ej. Clases, estudio, trabajo" maxLength={60} required value={data.title} onChange={(event) => update('title', event.target.value)} />
        <label className="block">
          <span className="field-label">Descripción <span className="font-normal text-muted">(opcional, {data.description.length}/30)</span></span>
          <textarea maxLength={30} rows={2} value={data.description} onChange={(event) => update('description', event.target.value)} className="field resize-none" placeholder="Un detalle breve de la actividad" />
        </label>
        {mode !== 'custom' && (
          <fieldset>
            <legend className="field-label">Días</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {availableDays.map((day) => (
                <label key={day.value} className="cursor-pointer">
                  <input type="checkbox" checked={data.days.includes(day.value)} onChange={() => toggleDay(day.value)} className="peer sr-only" />
                  <span className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface-2 px-2 text-sm font-semibold text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-text peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-accent">
                    <span className="sm:hidden">{day.short}</span><span className="hidden sm:inline">{day.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {mode === 'interval' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="block-start" className="field-label">Desde</label>
              <select id="block-start" className="field" value={data.startMinute} onChange={(event) => {
                const startMinute = Number(event.target.value);
                update('startMinute', startMinute);
                if (data.endMinute <= startMinute) update('endMinute', times.find((minute) => minute > startMinute) ?? settings.endMinute);
              }}>
                {times.filter((minute) => minute < settings.endMinute).map((minute) => <option key={minute} value={minute}>{formatMinute(minute)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="block-end" className="field-label">Hasta</label>
              <select id="block-end" className="field" value={data.endMinute} onChange={(event) => update('endMinute', Number(event.target.value))}>
                {endTimes.map((minute) => <option key={minute} value={minute}>{formatMinute(minute)}</option>)}
              </select>
            </div>
          </div>
        )}
        {mode === 'blocks' && (
          <label>
            <span className="field-label">Período</span>
            <select className="field" value={data.rowId} onChange={(event) => {
              const period = periods.find((item) => item.id === event.target.value);
              update('rowId', event.target.value);
              if (period) setData((current) => ({ ...current, rowId: period.id, startMinute: period.startMinute, endMinute: period.endMinute }));
            }}>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.label} · {formatMinute(period.startMinute)}–{formatMinute(period.endMinute)}</option>)}
            </select>
          </label>
        )}
        {mode === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="field-label">Columna</span>
              <select className="field" value={data.columnId} onChange={(event) => update('columnId', event.target.value)}>
                {settings.columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Fila</span>
              <select className="field" value={data.rowId} onChange={(event) => update('rowId', event.target.value)}>
                {settings.rows.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}
              </select>
            </label>
          </div>
        )}
        <fieldset>
          <legend className="field-label">Color</legend>
          <div className="flex flex-wrap items-center gap-2.5">
            {BLOCK_COLORS.map((color) => (
              <label key={color} className="cursor-pointer">
                <input type="radio" name="schedule-color" value={color} checked={data.color === color} onChange={() => update('color', color)} className="peer sr-only" />
                <span className="block h-9 w-9 rounded-full border-2 border-surface shadow-sm ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-accent" style={{ backgroundColor: color }} aria-label={`Color ${color}`} />
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface-2 px-2.5 py-1.5 text-sm font-medium">
              <input aria-label="Elegir otro color" type="color" value={data.color} onChange={(event) => update('color', event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
              Otro
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">Tono</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['soft', 'Suave'],
              ['balanced', 'Medio'],
              ['vivid', 'Intenso'],
            ].map(([tone, label]) => (
              <label key={tone} className="cursor-pointer">
                <input type="radio" name="schedule-tone" checked={data.tone === tone} onChange={() => update('tone', tone)} className="peer sr-only" />
                <span className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-sm font-semibold text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-text peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-accent">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <div role="alert" className="rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{error}</div>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {initialData && onDelete
            ? <button type="button" disabled={loading} onClick={onDelete} className="btn btn-quiet text-danger">Eliminar bloque</button>
            : <span />}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={onClose} className="btn btn-quiet">Cancelar</button>
            <button disabled={loading || !data.title.trim() || (mode !== 'custom' && !data.days.length) || (mode !== 'custom' && (!data.endMinute || data.endMinute <= data.startMinute)) || (mode === 'custom' && (!data.rowId || !data.columnId))} className="btn btn-primary">{loading ? 'Guardando…' : 'Guardar bloque'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleBlockModal;
