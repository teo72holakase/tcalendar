import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Plus } from 'lucide-react';
import Header from '../components/Header';
import AgendaView from '../components/AgendaView';
import MonthView from '../components/MonthView';
import MembersPanel from '../components/MembersPanel';
import { AvatarStack } from '../components/Avatar';
import EventFormModal from '../components/EventFormModal';
import EventDetailsModal from '../components/EventDetailsModal';
import CreateInviteModal from '../components/CreateInviteModal';
import DeleteGroupModal from '../components/DeleteGroupModal';
import GroupForum from '../components/GroupForum';
import GroupResources from '../components/GroupResources';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { exportGroupIcs } from '../services/api';
import { addDays, todayNum } from '../lib/ui';

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    groups, events, members,
    loadEvents, createEvent, removeEvent, updateEvent, changeEventColor, resetGroupData,
    inviteToGroup, loadMembers, removeMember, removeGroup,
    loading, error, message, setError,
  } = useGroup();

  const [view, setView] = useState('agenda');
  const [tab, setTab] = useState('calendar');
  const [eventModal, setEventModal] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [focusedEvent, setFocusedEvent] = useState(null);
  const [highlightedEventId, setHighlightedEventId] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventError, setEventError] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    resetGroupData();
    setTab('calendar');
    setSelectedEvent(null);
    setFocusedEvent(null);
    setHighlightedEventId('');
    loadMembers(groupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Refresca la lista visible sin bloquear la pantalla, para que cambios de avatar hechos
  // por otros miembros aparezcan aunque ambos estén con la sesión abierta.
  useEffect(() => {
    if (!groupId) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') loadMembers(groupId);
    };
    const interval = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // La agenda mira de dos semanas atrás a cuatro meses adelante; la vista Mes pide su propio rango.
  useEffect(() => {
    if (view !== 'agenda') return undefined;
    let range;
    if (focusedEvent?.dueDate && !Number.isNaN(new Date(focusedEvent.dueDate).getTime())) {
      const date = new Date(focusedEvent.dueDate);
      const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      range = { from: from.toISOString(), to: new Date(from.getTime() + 86400000).toISOString() };
    } else {
      const today = todayNum();
      range = { from: new Date(addDays(today, -14)).toISOString(), to: new Date(addDays(today, 120)).toISOString() };
    }
    loadEvents(groupId, range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return undefined;
  }, [groupId, view, focusedEvent]);

  useEffect(() => {
    if (tab !== 'calendar' || !highlightedEventId) return undefined;
    if (!events.some((event) => String(event._id) === String(highlightedEventId))) return undefined;
    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`group-event-${highlightedEventId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    const clearTimer = window.setTimeout(() => setHighlightedEventId(''), 5000);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [events, tab, highlightedEventId]);

  // El login devuelve { id, username } (no "_id").
  const myId = String(user?.id ?? user?._id ?? '');
  const idOf = (ref) => String(ref?._id ?? ref ?? '');
  const group = groups.find((g) => g._id === groupId);
  const creatorId = idOf(group?.creator);
  const isCreator = Boolean(myId && group && creatorId === myId);
  const canManage = (event) => isCreator || idOf(event.createdBy) === myId;

  const openNew = (dateStr = '') => { setEditingEvent(null); setSelectedDate(dateStr); setEventError(''); setEventModal(true); };
  const closeEvent = () => { setEventModal(false); setEditingEvent(null); };

  const save = async (form) => {
    const done = editingEvent
      ? await updateEvent(editingEvent._id, { title: form.title, description: form.description, topics: form.topics, color: form.color, dueDate: form.dueDate, resources: form.resources, resourceLinks: form.resourceLinks })
      : await createEvent(groupId, form);
    if (!done) return setEventError('No se pudo guardar el evento. Revisá tu conexión e intentá de nuevo.');
    closeEvent();
    setEventError('');
  };

  const remove = async (event) => { if (await removeEvent(event._id)) setSelectedEvent(null); };
  const startEdit = (event) => { setSelectedEvent(null); setEditingEvent(event); setEventError(''); setEventModal(true); };
  const changeColor = async (event, color) => {
    const result = await changeEventColor(event._id, color);
    if (result === true) setSelectedEvent((prev) => (prev ? { ...prev, color } : prev));
    return result;
  };

  const invite = async (payload) => {
    if (!payload.username.trim()) return setInviteError('Escribí un usuario');
    if (await inviteToGroup(groupId, payload)) { setInviteOpen(false); loadMembers(groupId); setInviteError(''); }
  };

  const kick = async (member) => {
    if (!window.confirm(`¿Quitar a ${member.username} del grupo?`)) return;
    await removeMember(groupId, member._id);
    loadMembers(groupId);
  };

  const exportIcs = async () => {
    try {
      const { data } = await exportGroupIcs(groupId);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(group?.name || 'tcalendar').replace(/[^\w.-]+/g, '_')}.ics`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('No se pudo exportar el calendario');
    }
  };

  const rangeLoader = (from, to) => loadEvents(groupId, { from, to });
  const openMentionedEvent = (event) => {
    setSelectedEvent(null);
    setFocusedEvent({ _id: event._id, dueDate: event.dueDate });
    setHighlightedEventId(String(event._id));
    setView('agenda');
    setTab('calendar');
  };

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8">
        <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-muted hover:text-ink"><ArrowLeft size={18} aria-hidden="true" /> Tus grupos</Link>

        <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words font-display text-4xl font-extrabold sm:text-5xl">{group?.name || 'Grupo'}</h1>
            {group?.description && <p className="mt-2 max-w-2xl text-lg text-muted">{group.description}</p>}
          </div>
          <button type="button" onClick={() => setTab('calendar')} className="flex items-center gap-3 rounded-full py-1 pr-1 text-muted hover:text-ink" aria-label={`${members.length} miembros, ir a la lista`}>
            <AvatarStack members={members} creatorId={creatorId} max={5} size={38} />
          </button>
        </div>

        {(message || error) && (
          <div role={error ? 'alert' : 'status'} className={`mb-5 rounded-2xl p-4 text-sm font-medium ${error ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-text'}`}>{error || message}</div>
        )}

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-line" role="tablist" aria-label="Secciones del grupo">
          {[['calendar', 'Calendario'], ['forum', 'Foro'], ['resources', 'Recursos']].map(([id, label]) => (
            <button key={id} id={`group-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`group-panel-${id}`} onClick={() => setTab(id)} className={`min-h-12 shrink-0 border-b-2 px-4 font-semibold transition ${tab === id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'}`}>{label}</button>
          ))}
        </div>

        <div id="group-panel-calendar" role="tabpanel" aria-labelledby="group-tab-calendar" hidden={tab !== 'calendar'} className={`${tab === 'calendar' ? 'grid' : 'hidden'} items-start gap-8 lg:grid-cols-[1fr_21rem]`}>
          <section aria-label="Calendario del grupo">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Vista" className="inline-flex rounded-2xl bg-surface-2 p-1">
                {[['agenda', 'Agenda'], ['month', 'Mes']].map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={`min-h-10 rounded-xl px-5 font-semibold transition ${view === id ? 'bg-surface text-ink shadow' : 'text-muted hover:text-ink'}`}>{label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={exportIcs} className="btn btn-quiet btn-sm" title="Descargar para Google, Apple u Outlook"><Download size={16} aria-hidden="true" /> .ics</button>
                <button type="button" onClick={() => openNew()} className="btn btn-primary btn-sm hidden sm:inline-flex"><Plus size={18} aria-hidden="true" /> Nuevo evento</button>
              </div>
            </div>
            {view === 'agenda'
              ? <AgendaView events={events} onOpen={setSelectedEvent} onAdd={() => openNew()} loading={loading} highlightedEventId={highlightedEventId} />
              : <MonthView events={events} onRange={rangeLoader} onOpen={setSelectedEvent} onAdd={openNew} />}
          </section>

          <MembersPanel
            members={members} creatorId={creatorId} myId={myId} isCreator={isCreator} loading={loading}
            onInvite={() => { setInviteError(''); setInviteOpen(true); }} onRemove={kick} onDelete={() => setDeleteOpen(true)}
          />
        </div>
        <div id="group-panel-forum" role="tabpanel" aria-labelledby="group-tab-forum" hidden={tab !== 'forum'} className={tab === 'forum' ? '' : 'hidden'}><GroupForum key={groupId} groupId={groupId} members={members} currentUserId={myId} isCreator={isCreator} isAdmin={Boolean(user?.isAdmin)} onEventClick={openMentionedEvent} active={tab === 'forum'} /></div>
        <div id="group-panel-resources" role="tabpanel" aria-labelledby="group-tab-resources" hidden={tab !== 'resources'} className={tab === 'resources' ? '' : 'hidden'}><GroupResources key={groupId} groupId={groupId} currentUserId={myId} isCreator={isCreator} isAdmin={Boolean(user?.isAdmin)} active={tab === 'resources'} /></div>
      </main>

      {tab === 'calendar' && <button type="button" onClick={() => openNew()} aria-label="Nuevo evento" className="btn btn-primary fixed right-5 z-30 h-14 w-14 rounded-full p-0 shadow-xl sm:hidden" style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
        <Plus size={26} aria-hidden="true" />
      </button>}

      <EventFormModal open={eventModal} onClose={closeEvent} onSave={save} loading={loading} error={eventError} initialData={editingEvent || { dueDate: selectedDate }} groupId={groupId} />
      <EventDetailsModal
        open={Boolean(selectedEvent)} onClose={() => { setSelectedEvent(null); setError(''); }} event={selectedEvent}
        onDelete={remove} onEdit={startEdit} onColorChange={changeColor} canDelete={Boolean(selectedEvent) && canManage(selectedEvent)} loading={loading} error={error}
      />
      <CreateInviteModal groupId={groupId} open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteError(''); }} onInvite={invite} loading={loading} error={inviteError || (inviteOpen ? error : '')} />
      <DeleteGroupModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={async () => { if (await removeGroup(groupId)) navigate('/dashboard'); }} groupName={group?.name || ''} loading={loading} />
    </div>
  );
};

export default GroupPage;
