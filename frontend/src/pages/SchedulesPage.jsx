import { useEffect, useRef, useState } from 'react';
import { Clock3, Download, FileImage, Pencil, Plus, Settings2, Share2, Trash2, UsersRound, X } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ScheduleBlockModal from '../components/ScheduleBlockModal';
import ScheduleCreateModal from '../components/ScheduleCreateModal';
import ScheduleGrid from '../components/ScheduleGrid';
import ScheduleSettings from '../components/ScheduleSettings';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import {
  addScheduleToGroup, createSchedule, deleteSchedule, fetchSchedules,
  removeScheduleFromGroup, updateSchedule,
} from '../services/api';
import { createPreset, SCHEDULE_PRESETS } from '../lib/schedulePresets';

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;
const schedulePayload = ({ title, settings, blocks }) => ({ title, settings, blocks });
const displayName = (title) => title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.-]+/g, '_') || 'horario';
const scheduleThemeTokens = ['--surface', '--surface-2', '--ink', '--muted', '--line', '--accent'];
const PNG_FORMATS = [
  { id: 'normal', label: 'Normal', detail: 'Tamaño original' },
  { id: '1:1', label: '1:1', detail: 'Cuadrado', width: 1600, height: 1600 },
  { id: '16:9', label: '16:9', detail: 'Horizontal', width: 1920, height: 1080 },
  { id: '9:16', label: '9:16', detail: 'Vertical', width: 1080, height: 1920 },
];

const captureSchedule = async (node, format) => {
  const originalStyle = node.getAttribute('style');
  const originalChildStyles = [];
  const sourceStyles = getComputedStyle(node.classList.contains('schedule-pdf') ? node : document.documentElement);
  const surface = sourceStyles.getPropertyValue('--surface').trim();
  const backgroundColor = `rgb(${surface.split(/\s+/).join(', ')})`;

  scheduleThemeTokens.forEach((token) => {
    node.style.setProperty(token, sourceStyles.getPropertyValue(token).trim());
  });
  node.style.backgroundColor = backgroundColor;

  try {
    if (format?.width && format?.height) {
      const slots = Number(node.dataset.scheduleSlots);
      const days = Number(node.style.getPropertyValue('--schedule-days'));
      const rowHeight = Number.parseFloat(node.style.getPropertyValue('--schedule-row-height'));
      const title = node.querySelector('.schedule-board-title');
      const heading = node.querySelector('.schedule-day-heading, .schedule-corner');
      const widthScale = format.width / node.scrollWidth;
      const heightScale = format.height / node.scrollHeight;
      const textScale = Math.sqrt(widthScale * heightScale);
      const timeColumnWidth = 76 * textScale;
      const columnWidth = (format.width - timeColumnWidth) / days;

      if (!slots || !days || !rowHeight || columnWidth <= 0) {
        throw new Error('No se pudo adaptar el horario al formato PNG');
      }

      node.style.width = `${format.width}px`;
      node.style.minWidth = `${format.width}px`;
      node.style.gridTemplateColumns = `${timeColumnWidth}px repeat(${days}, minmax(${columnWidth}px, 1fr))`;
      node.style.setProperty('--schedule-column-width', `${columnWidth}px`);
      node.style.setProperty('--schedule-export-scale', String(textScale));

      const titleHeight = title.getBoundingClientRect().height;
      const headingHeight = heading.getBoundingClientRect().height;
      const nextRowHeight = (format.height - titleHeight - headingHeight) / slots;
      if (nextRowHeight <= 0) {
        throw new Error('No se pudo adaptar el horario al formato PNG');
      }

      node.style.setProperty('--schedule-row-height', `${nextRowHeight}px`);
      const scaleY = nextRowHeight / rowHeight;
      node.querySelectorAll('.schedule-time-axis, .schedule-day-column, .schedule-time-tick, .schedule-block').forEach((element) => {
        originalChildStyles.push([element, element.getAttribute('style')]);
        if (element.matches('.schedule-time-axis, .schedule-day-column')) {
          element.style.height = `${slots * nextRowHeight}px`;
        } else {
          element.style.top = `${Number.parseFloat(element.style.top) * scaleY}px`;
          if (element.matches('.schedule-block')) {
            element.style.height = `${Number.parseFloat(element.style.height) * scaleY}px`;
          }
        }
      });
    }

    const { toPng } = await import('html-to-image');
    await document.fonts.ready;
    return {
      dataUrl: await toPng(node, {
        cacheBust: true,
        pixelRatio: format?.width ? 1 : 2,
        backgroundColor,
        width: format?.width || node.scrollWidth,
        height: format?.height || node.scrollHeight,
      }),
      backgroundColor,
    };
  } finally {
    originalChildStyles.forEach(([element, style]) => {
      if (style === null) element.removeAttribute('style');
      else element.setAttribute('style', style);
    });
    if (originalStyle === null) node.removeAttribute('style');
    else node.setAttribute('style', originalStyle);
  }
};

const SchedulesPage = () => {
  const { user } = useAuth();
  const { groups } = useGroup();
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [blockState, setBlockState] = useState({ open: false, block: null, day: null, minute: null });
  const [blockError, setBlockError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [pngOptionsOpen, setPngOptionsOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const gridRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchSchedules()
      .then(({ data }) => {
        if (!active) return;
        setSchedules(data);
        setSelectedId(data[0]?._id || '');
      })
      .catch((err) => { if (active) setError(errorMessage(err, 'No se pudieron cargar los horarios')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selected = schedules.find((schedule) => schedule._id === selectedId) || null;
  const currentUserId = String(user?.id ?? user?._id ?? '');
  const ownerId = String(selected?.owner?._id ?? selected?.owner ?? '');
  const isOwner = Boolean(selected && currentUserId && currentUserId === ownerId);
  const availableGroups = groups.filter((group) => !selected?.sharedWith?.some((shared) => String(shared?._id ?? shared) === String(group._id)));
  const isSettingsChanged = Boolean(selected && settingsDraft && JSON.stringify(settingsDraft) !== JSON.stringify(selected.settings));
  const blocksFit = Boolean(selected && settingsDraft && selected.blocks.every((block) => (
    block.days.every((day) => settingsDraft.days.includes(day))
    && block.startMinute >= settingsDraft.startMinute
    && block.endMinute <= settingsDraft.endMinute
  )));

  useEffect(() => {
    if (!selected) return;
    setSettingsDraft({ ...selected.settings, days: [...selected.settings.days] });
    setTitleDraft(selected.title);
    setRenaming(false);
    setSettingsOpen(false);
  }, [selectedId, selected?.updatedAt]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const replaceSchedule = (schedule) => {
    setSchedules((current) => current.map((item) => item._id === schedule._id ? schedule : item));
  };

  const saveSchedule = async (payload) => {
    setSaving(true);
    setError('');
    try {
      const { data } = await updateSchedule(selected._id, schedulePayload(payload));
      replaceSchedule(data);
      setMessage('Horario guardado');
      return data;
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar el horario'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const createFromData = async (data) => {
    setSaving(true);
    setCreateError('');
    setError('');
    try {
      const { data: schedule } = await createSchedule(data);
      setSchedules((current) => [schedule, ...current]);
      setSelectedId(schedule._id);
      setCreateOpen(false);
      setMessage('Horario creado');
    } catch (err) {
      setCreateError(errorMessage(err, 'No se pudo crear el horario'));
    } finally {
      setSaving(false);
    }
  };

  const createFromPreset = (presetId) => createFromData(createPreset(presetId));

  const saveBlock = async (block) => {
    const blocks = blockState.block
      ? selected.blocks.map((item) => String(item._id) === String(blockState.block._id) ? { ...blockState.block, ...block } : item)
      : [...selected.blocks, block];
    if (await saveSchedule({ ...selected, blocks })) {
      setBlockState({ open: false, block: null, day: null, minute: null });
      setBlockError('');
    } else {
      setBlockError(error || 'No se pudo guardar el bloque');
    }
  };

  const deleteBlock = async () => {
    if (!window.confirm(`¿Eliminar “${blockState.block.title}” de este horario?`)) return;
    const blocks = selected.blocks.filter((item) => String(item._id) !== String(blockState.block._id));
    if (await saveSchedule({ ...selected, blocks })) setBlockState({ open: false, block: null, day: null, minute: null });
  };

  const addToGroup = async (groupId) => {
    if (!groupId || !selected) return;
    setSharing(true);
    setError('');
    try {
      const { data } = await addScheduleToGroup(selected._id, groupId);
      replaceSchedule(data);
      setMessage('Horario añadido al grupo');
    } catch (err) {
      setError(errorMessage(err, 'No se pudo añadir el horario al grupo'));
    } finally {
      setSharing(false);
    }
  };

  const removeFromGroup = async (group) => {
    if (!window.confirm(`¿Quitar “${selected.title}” del grupo “${group.name}”?`)) return;
    setError('');
    try {
      await removeScheduleFromGroup(selected._id, group._id);
      replaceSchedule({ ...selected, sharedWith: selected.sharedWith.filter((item) => String(item?._id ?? item) !== String(group._id)) });
      setMessage('Horario quitado del grupo');
    } catch (err) {
      setError(errorMessage(err, 'No se pudo quitar el horario del grupo'));
    }
  };

  const removeSchedule = async () => {
    if (!window.confirm(`¿Eliminar “${selected.title}” y quitarlo de todos los grupos?`)) return;
    setSaving(true);
    setError('');
    try {
      await deleteSchedule(selected._id);
      const remaining = schedules.filter((item) => item._id !== selected._id);
      setSchedules(remaining);
      setSelectedId(remaining[0]?._id || '');
      setMessage('Horario eliminado');
    } catch (err) {
      setError(errorMessage(err, 'No se pudo eliminar el horario'));
    } finally {
      setSaving(false);
    }
  };

  const renameSchedule = async (event) => {
    event.preventDefault();
    const title = titleDraft.trim();
    if (!title || title === selected.title) {
      setRenaming(false);
      setTitleDraft(selected.title);
      return;
    }
    if (await saveSchedule({ ...selected, title })) setRenaming(false);
  };

  const exportPng = async (format) => {
    if (!gridRef.current) return;
    setError('');
    const node = gridRef.current;
    node.classList.add('schedule-png');
    if (format.width) node.classList.add('schedule-png-expanded');
    try {
      const { dataUrl } = await captureSchedule(node, format);
      const link = document.createElement('a');
      const suffix = format.id === 'normal' ? '' : `_${format.id.replace(':', 'x')}`;
      link.download = `${displayName(selected.title)}${suffix}.png`;
      link.href = dataUrl;
      link.click();
      setMessage(`PNG ${format.label} descargado`);
    } catch (err) {
      console.error('Error exportando el horario como PNG:', err);
      setError('No se pudo crear la imagen. Probá de nuevo o descargá el horario como PDF.');
    } finally {
      node.classList.remove('schedule-png');
      node.classList.remove('schedule-png-expanded');
    }
  };

  const exportPdf = async () => {
    if (!gridRef.current) return;
    setError('');
    const node = gridRef.current;
    node.classList.add('schedule-pdf');
    try {
      const [{ jsPDF }, { dataUrl: image }] = await Promise.all([
        import('jspdf'),
        captureSchedule(node),
      ]);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const scale = Math.min(
        (pageWidth - margin * 2) / node.scrollWidth,
        (pageHeight - margin * 2) / node.scrollHeight,
      );
      const width = node.scrollWidth * scale;
      const height = node.scrollHeight * scale;
      pdf.addImage(image, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
      const url = URL.createObjectURL(pdf.output('blob'));
      const link = document.createElement('a');
      link.download = `${displayName(selected.title)}.pdf`;
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('PDF descargado en formato A4');
    } catch (err) {
      console.error('Error exportando el horario como PDF:', err);
      setError('No se pudo crear el PDF. Probá de nuevo o descargá el horario como PNG.');
    } finally {
      node.classList.remove('schedule-pdf');
    }
  };

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-accent-text"><Clock3 size={16} aria-hidden="true" /> Organización semanal</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold sm:text-5xl">Horarios</h1>
            <p className="mt-2 max-w-2xl text-muted">Diseñá una tabla a tu medida y compartila con tus grupos.</p>
          </div>
          <button type="button" onClick={() => { setCreateError(''); setCreateOpen(true); }} className="btn btn-primary">
            <Plus size={19} aria-hidden="true" /> Nuevo horario
          </button>
        </div>

        {(message || error) && (
          <div role={error ? 'alert' : 'status'} className={`mb-5 rounded-2xl p-4 text-sm font-medium ${error ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-text'}`}>
            {error || message}
          </div>
        )}

        {loading ? (
          <div className="card flex min-h-56 items-center justify-center gap-3 p-8 text-muted"><span className="load-ring" aria-hidden="true" /> Cargando tus horarios</div>
        ) : !schedules.length ? (
          <section aria-labelledby="schedule-empty-title" className="space-y-5">
            <div className="card flex flex-col items-center gap-3 p-8 text-center sm:p-12">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text"><Clock3 size={27} aria-hidden="true" /></span>
              <h2 id="schedule-empty-title" className="text-2xl font-bold">Armá tu primer horario</h2>
              <p className="max-w-lg text-muted">Empezá con una plantilla y personalizá los días, las horas, los colores y el tamaño de la tabla.</p>
              <button type="button" onClick={() => { setCreateError(''); setCreateOpen(true); }} className="btn btn-primary mt-1"><Plus size={18} aria-hidden="true" /> Crear horario</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SCHEDULE_PRESETS.filter((preset) => preset.id !== 'blank').map((preset) => (
                <button key={preset.id} type="button" onClick={() => createFromPreset(preset.id)} disabled={saving} className="card card-lift p-4 text-left disabled:opacity-50">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-accent-text"><Clock3 size={19} aria-hidden="true" /></span>
                  <span className="block font-bold">{preset.name}</span>
                  <span className="mt-1 block text-sm text-muted">{preset.description}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Tus horarios">
              {schedules.map((schedule) => (
                <button key={schedule._id} type="button" role="tab" aria-selected={selectedId === schedule._id} onClick={() => setSelectedId(schedule._id)} className={`schedule-tab ${selectedId === schedule._id ? 'schedule-tab-active' : ''}`}>
                  <Clock3 size={16} aria-hidden="true" /><span className="max-w-48 truncate">{schedule.title}</span>
                </button>
              ))}
            </div>

            {selected && (
              <>
                <section className="card mb-5 p-4 sm:p-5 no-print" aria-label="Acciones del horario">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {renaming && isOwner ? (
                        <form onSubmit={renameSchedule} className="flex flex-wrap items-center gap-2">
                          <label htmlFor="schedule-title" className="sr-only">Nombre del horario</label>
                          <input id="schedule-title" autoFocus maxLength="80" required value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} className="field min-h-11 max-w-lg flex-1" />
                          <button type="submit" disabled={saving || !titleDraft.trim()} className="btn btn-primary btn-sm">Guardar</button>
                          <button type="button" onClick={() => { setRenaming(false); setTitleDraft(selected.title); }} className="btn btn-quiet btn-sm"><X size={17} aria-hidden="true" /> Cancelar</button>
                        </form>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-2xl font-bold">{selected.title}</h2>
                          {isOwner && <button type="button" aria-label="Cambiar nombre del horario" title="Cambiar nombre" onClick={() => setRenaming(true)} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink"><Pencil size={16} aria-hidden="true" /></button>}
                        </div>
                      )}
                      <p className="mt-1 text-sm text-muted">
                        {isOwner ? 'Tu horario' : `Creado por ${selected.owner?.username || 'un miembro del grupo'}`}
                        {selected.sharedWith?.length ? ` · Compartido con ${selected.sharedWith.length} ${selected.sharedWith.length === 1 ? 'grupo' : 'grupos'}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isOwner && (
                        <>
                          <button type="button" onClick={() => {
                            if (settingsOpen) {
                              setSettingsDraft({ ...selected.settings, days: [...selected.settings.days] });
                              setSettingsOpen(false);
                            } else {
                              setSettingsDraft({ ...selected.settings, days: [...selected.settings.days] });
                              setSettingsOpen(true);
                            }
                          }} className="btn btn-quiet btn-sm"><Settings2 size={16} aria-hidden="true" /> Tabla</button>
                          <button type="button" onClick={() => { setBlockError(''); setBlockState({ open: true, block: null, day: null, minute: null }); }} disabled={isSettingsChanged} className="btn btn-primary btn-sm"><Plus size={17} aria-hidden="true" /> Bloque</button>
                        </>
                      )}
                      {isOwner && <button type="button" onClick={removeSchedule} disabled={saving} aria-label="Eliminar horario" title="Eliminar horario" className="btn btn-quiet btn-sm text-danger"><Trash2 size={16} aria-hidden="true" /></button>}
                    </div>
                  </div>

                  {settingsOpen && isOwner && (
                    <div className="mt-5">
                      <ScheduleSettings
                        value={settingsDraft}
                        onChange={setSettingsDraft}
                        onSave={async () => {
                          const saved = await saveSchedule({ ...selected, settings: settingsDraft });
                          if (saved) setSettingsOpen(false);
                        }}
                        onCancel={() => {
                          setSettingsDraft({ ...selected.settings, days: [...selected.settings.days] });
                          setSettingsOpen(false);
                        }}
                        saving={saving}
                        error={error}
                        blocksFit={blocksFit}
                      />
                    </div>
                  )}
                </section>

                <section className="mb-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-line bg-surface/75 p-4 no-print" aria-label="Compartir horario">
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 font-bold"><Share2 size={17} aria-hidden="true" /> Añadir a un grupo</h3>
                    <p className="mt-1 text-sm text-muted">Cualquier miembro puede compartir este horario con sus grupos.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.sharedWith?.map((group) => {
                        const creatorId = String(group.creator?._id ?? group.creator ?? '');
                        const canRemove = isOwner || creatorId === currentUserId;
                        return (
                          <span key={group._id} className="chip chip-accent">
                            <UsersRound size={14} aria-hidden="true" /> {group.name}
                            {canRemove && <button type="button" onClick={() => removeFromGroup(group)} className="ml-1 rounded-full p-0.5 hover:bg-surface/70" aria-label={`Quitar del grupo ${group.name}`} title="Quitar del grupo"><X size={13} aria-hidden="true" /></button>}
                          </span>
                        );
                      })}
                      {!selected.sharedWith?.length && <span className="text-sm text-muted">Todavía no está añadido a ningún grupo.</span>}
                    </div>
                  </div>
                  <label className="w-full sm:w-64">
                    <span className="sr-only">Elegir grupo para compartir</span>
                    <select className="field min-h-11" value="" disabled={sharing || !availableGroups.length} onChange={(event) => addToGroup(event.target.value)}>
                      <option value="">{sharing ? 'Añadiendo…' : availableGroups.length ? 'Elegir un grupo…' : 'No hay más grupos'}</option>
                      {availableGroups.map((group) => <option key={group._id} value={group._id}>{group.name}</option>)}
                    </select>
                  </label>
                </section>

                {isSettingsChanged && <p role="status" className="mb-4 rounded-xl bg-accent-soft p-3 text-sm text-accent-text no-print">Guardá los ajustes de la tabla antes de editar sus bloques.</p>}
                {!isOwner && <p className="mb-4 rounded-xl bg-surface-2 p-3 text-sm text-muted no-print">Podés ver y descargar este horario. Solo quien lo creó puede editar sus bloques.</p>}
                <ScheduleGrid
                  schedule={selected}
                  canEdit={isOwner && !isSettingsChanged}
                  gridRef={gridRef}
                  onEditBlock={(block) => { setBlockError(''); setBlockState({ open: true, block, day: null, minute: null }); }}
                  onAddBlock={(day, minute) => { setBlockError(''); setBlockState({ open: true, block: null, day, minute }); }}
                />
                <p className="no-print mt-2 text-center text-xs text-muted">
                  {isOwner && 'Seleccioná un espacio vacío para agregar un bloque o uno existente para editarlo.'}
                  {isOwner && <span className="sm:hidden"> Deslizá la tabla para ver todos los días.</span>}
                  {!isOwner && <span className="sm:hidden">Deslizá la tabla hacia los lados para ver todos los días.</span>}
                </p>
                <section className="card no-print mt-5 p-4 sm:p-5" aria-label="Descargar horario">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold">Descargar horario</h3>
                      <p className="mt-1 text-sm text-muted">Elegí una imagen PNG o guardá la tabla completa en PDF.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        aria-expanded={pngOptionsOpen}
                        aria-controls="schedule-png-options"
                        onClick={() => setPngOptionsOpen((open) => !open)}
                        className="btn btn-quiet btn-sm"
                      >
                        <FileImage size={16} aria-hidden="true" /> PNG
                      </button>
                      <button type="button" onClick={exportPdf} className="btn btn-quiet btn-sm"><Download size={16} aria-hidden="true" /> PDF</button>
                    </div>
                  </div>
                  {pngOptionsOpen && (
                    <div id="schedule-png-options" role="group" aria-label="Formato de imagen PNG" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {PNG_FORMATS.map((format) => (
                        <button
                          key={format.id}
                          type="button"
                          aria-label={`Descargar PNG ${format.label}, ${format.detail}`}
                          onClick={() => {
                            setPngOptionsOpen(false);
                            exportPng(format);
                          }}
                          className="flex min-h-14 flex-col items-center justify-center rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:bg-surface-2"
                        >
                          <span>{format.label}</span><span className="text-xs font-normal text-muted">{format.detail}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>

      <ScheduleCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createFromData} loading={saving} error={createError} />
      {selected && isOwner && (
        <ScheduleBlockModal
          open={blockState.open}
          onClose={() => { setBlockState({ open: false, block: null, day: null, minute: null }); setBlockError(''); }}
          onSave={saveBlock}
          onDelete={blockState.block ? deleteBlock : null}
          settings={selected.settings}
          initialData={blockState.block}
          initialDay={blockState.day}
          initialMinute={blockState.minute}
          loading={saving}
          error={blockError}
        />
      )}
    </div>
  );
};

export default SchedulesPage;
