import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import CalendarView from '../components/CalendarView';
import EventFormModal from '../components/EventFormModal';
import EventDetailsModal from '../components/EventDetailsModal';
import InviteMemberModal from '../components/InviteMemberModal';
import CreateInviteModal from '../components/CreateInviteModal';
import DeleteGroupModal from '../components/DeleteGroupModal';

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    groups, events, members,
    loadEvents, createEvent, removeEvent,
    inviteToGroup, loadMembers, removeMember, removeGroup,
    loading, error, message, setError, setMessage,
  } = useGroup();

  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [isInviteLinkModalOpen, setInviteLinkModalOpen] = useState(false);
  const [isDeleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventError, setEventError] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Fix recarga: cargar grupo si groups aún está vacío
  useEffect(() => {
    loadEvents(groupId);
    loadMembers(groupId);
  }, [groupId]);

  const currentGroup = groups.find((g) => g._id === groupId);
  const isGroupCreator =
    currentGroup &&
    (currentGroup.creator === user?._id ||
      currentGroup.creator?._id === user?._id ||
      currentGroup.creator?.toString() === user?._id);

  const handleDateClick = (dateStr) => { setSelectedDate(dateStr); setEventModalOpen(true); };
  const handleEventClick = (eventData) => setSelectedEvent(eventData);

  const handleEventSave = async (form) => {
    if (!form.title.trim() || !form.dueDate) { setEventError('Título y fecha son obligatorios'); return; }
    await createEvent(groupId, form);
    setEventModalOpen(false);
    setEventError('');
  };

  const handleEventDelete = async (event) => {
    const deleted = await removeEvent(event._id);
    if (deleted) setSelectedEvent(null);
  };

  const handleInvite = async (payload) => {
    if (!payload.username.trim()) { setInviteError('El usuario es obligatorio'); return; }
    const success = await inviteToGroup(groupId, payload);
    if (success) { setInviteOpen(false); loadMembers(groupId); setInviteError(''); }
  };

  const handleRemoveMember = async (memberId) => {
    await removeMember(groupId, memberId);
    loadMembers(groupId);
  };

  const handleDeleteGroup = async () => {
    const ok = await removeGroup(groupId);
    if (ok) navigate('/dashboard');
  };

  // ========== NOMBRE DEL GRUPO ==========
  const groupName = currentGroup?.name || 'Sin nombre';

  return (
    <div className="min-h-screen">
      <Header title="Calendario del grupo" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft size={18} /> Volver
            </button>
            {/* ========== TÍTULO CON NOMBRE DEL GRUPO EN NEGRITA ========== */}
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
              Eventos del grupo{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {groupName}
              </span>
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Haz clic en una fecha para crear un evento o selecciona uno existente.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isGroupCreator && (
              <>
                <button onClick={() => setInviteOpen(true)} className="rounded-2xl bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
                  Invitar miembro
                </button>
                <button onClick={() => setInviteLinkModalOpen(true)} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                  🔗 Enlace
                </button>
              </>
            )}
            <button onClick={() => setEventModalOpen(true)} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
              Nuevo evento
            </button>
          </div>
        </div>

        {(message || error) && (
          <div className="mb-4 rounded-3xl p-4 text-sm" style={{ background: message ? '#ecfdf5' : '#fef2f2', color: message ? '#166534' : '#991b1b' }}>
            {message || error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          {/* ========== PASAR groupName A CalendarView ========== */}
          <CalendarView
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            groupName={groupName} // ← NUEVA PROP
          />
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Miembros del grupo</h3>
              <ul className="mt-4 space-y-3 text-slate-700 dark:text-slate-300">
                {members.length === 0 ? (
                  <li className="text-sm text-slate-500 dark:text-slate-400">No hay miembros aún.</li>
                ) : (
                  members.map((member) => (
                    <li key={member._id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-700">
                      <p className="font-medium text-slate-900 dark:text-white">{member.username}</p>
                      {isGroupCreator && member._id !== user?._id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={loading}
                          className="ml-2 rounded-xl bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-900 dark:text-rose-300 dark:hover:bg-rose-800"
                        >
                          Remover
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Guía rápida</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>• Haz clic en la fecha para agregar un evento.</li>
                <li>• Haz clic en un evento para ver detalles y eliminar si eres creador.</li>
                <li>• Los eventos se guardan en el grupo y son visibles para todos los miembros.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTÓN BORRAR GRUPO — solo creador, al final centrado */}
        {isGroupCreator && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setDeleteGroupOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-white px-5 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950"
            >
              <Trash2 size={16} /> Borrar grupo
            </button>
          </div>
        )}
      </main>

      <EventFormModal open={isEventModalOpen} onClose={() => setEventModalOpen(false)} onSave={handleEventSave} loading={loading} error={eventError} initialData={{ dueDate: selectedDate }} />
      <EventDetailsModal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onDelete={handleEventDelete}
        canDelete={selectedEvent && (isGroupCreator || selectedEvent.createdBy?._id === user?._id || selectedEvent.createdBy === user?._id)}
        loading={loading}
        error={error}
      />
      <InviteMemberModal open={isInviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} loading={loading} error={inviteError} />
      <CreateInviteModal groupId={groupId} open={isInviteLinkModalOpen} onClose={() => setInviteLinkModalOpen(false)} />
      <DeleteGroupModal
        open={isDeleteGroupOpen}
        onClose={() => setDeleteGroupOpen(false)}
        onConfirm={handleDeleteGroup}
        groupName={currentGroup?.name || ''}
        loading={loading}
      />
    </div>
  );
};

export default GroupPage;