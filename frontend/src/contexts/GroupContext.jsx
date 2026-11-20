import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  createGroup as apiCreateGroup, fetchGroups, fetchGroupEvents,
  createGroupEvent, deleteEvent, updateEventColor, updateEvent as apiUpdateEvent, inviteMember, fetchGroupMembers,
  removeMember as apiRemoveMember, deleteGroup as apiDeleteGroup,
} from '../services/api';
import { useAuth } from './AuthContext';

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const lastGroupsLoad = useRef(0); // 0 = nunca cargó bien

  // silent: refresco en segundo plano, sin spinner ni mensaje de error
  const loadGroups = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await fetchGroups();
      setGroups(data);
      lastGroupsLoad.current = Date.now();
      setGroupsLoaded(true);
      setError('');
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || 'No se pudieron cargar los grupos');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Solo recargar al cambiar de cuenta, no al actualizar el perfil (p. ej. el avatar).
  const userId = user?._id;
  useEffect(() => {
    setGroupsLoaded(false);
    lastGroupsLoad.current = 0;
    setError('');
    if (userId) loadGroups();
    else setGroups([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Al volver a la pestaña después de un rato (o si la última carga falló), refrescar los grupos en silencio.
  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastGroupsLoad.current > 60000) loadGroups(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Los avisos se borran solos; antes quedaban pegados y reaparecían al cambiar de página.
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    if (!error || !groupsLoaded) return; // si falló la carga inicial, el error se queda hasta que se reintente
    const t = setTimeout(() => setError(''), 6000);
    return () => clearTimeout(t);
  }, [error, groupsLoaded]);

  // Al entrar a otro grupo, no mostrar un instante los eventos/miembros del grupo anterior.
  // (No toca eventsSeq: el calendario ya pidió los eventos del grupo nuevo al montarse y esa respuesta debe valer.)
  const resetGroupData = () => { setEvents([]); setMembers([]); };

  // Editar o mover un evento. No usa el "loading" global para no bloquear la pantalla al arrastrar.
  const updateEvent = async (eventId, payload) => {
    setError('');
    try {
      const { data } = await apiUpdateEvent(eventId, payload);
      setEvents((prev) => prev.map((e) => (e._id === eventId ? data : e)));
      setMessage('Evento actualizado');
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el evento');
      return null;
    }
  };

  const createGroup = async (payload) => {
    setLoading(true); setError('');
    try {
      const { data } = await apiCreateGroup(payload);
      setGroups((prev) => [data, ...prev]);
      setMessage('Grupo creado correctamente');
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el grupo');
      return null;
    } finally { setLoading(false); }
  };

  const removeGroup = async (groupId) => {
    setLoading(true); setError('');
    try {
      await apiDeleteGroup(groupId);
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
      setMessage('Grupo eliminado');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el grupo');
      return false;
    } finally { setLoading(false); }
  };

  // Solo pide el rango visible del calendario ({ from, to }). Si el usuario cambia de mes rápido,
  // se ignoran las respuestas viejas para que no pisen a la más reciente.
  const eventsSeq = useRef(0);
  const loadEvents = async (groupId, range) => {
    const seq = ++eventsSeq.current;
    setLoading(true); setError('');
    try {
      const { data } = await fetchGroupEvents(groupId, range);
      if (seq === eventsSeq.current) setEvents(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los eventos');
      return [];
    } finally { setLoading(false); }
  };

  const createEvent = async (groupId, payload) => {
    setLoading(true); setError('');
    try {
      const { data } = await createGroupEvent(groupId, payload);
      setEvents((prev) => [...prev, data]);
      setMessage('Evento creado correctamente');
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el evento');
      return null;
    } finally { setLoading(false); }
  };

  const removeEvent = async (eventId) => {
    setLoading(true); setError('');
    try {
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      setMessage('Evento eliminado');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el evento');
      return false;
    } finally { setLoading(false); }
  };

  // Devuelve true si salió bien, o el texto del error para mostrarlo en el modal.
  const changeEventColor = async (eventId, color) => {
    try {
      await updateEventColor(eventId, color);
      setEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, color } : e)));
      return true;
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) return '⚠️ No tenés permiso para cambiar el color de este evento';
      if (status === 401) return '🔑 Tu sesión expiró. Iniciá sesión nuevamente.';
      if (status === 404) return '📅 El evento ya no existe.';
      return null;
    }
  };

  const inviteToGroup = async (groupId, payload) => {
    setLoading(true); setError('');
    try {
      const { data } = await inviteMember(groupId, payload);
      setMessage(data.message || 'Invitación enviada');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo invitar al miembro');
      return false;
    } finally { setLoading(false); }
  };

  const loadMembers = async (groupId) => {
    setLoading(true); setError('');
    try {
      const { data } = await fetchGroupMembers(groupId);
      setMembers(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los miembros');
      return [];
    } finally { setLoading(false); }
  };

  const removeMember = async (groupId, memberId) => {
    setLoading(true); setError('');
    try {
      await apiRemoveMember(groupId, memberId);
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      setMessage('Miembro removido');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo remover al miembro');
      return false;
    } finally { setLoading(false); }
  };

  return (
    <GroupContext.Provider value={{
      groups, events, members, selectedGroup, loading, groupsLoaded, message, error,
      setSelectedGroup, setMessage, setError,
      loadGroups, createGroup, removeGroup,
      loadEvents, createEvent, removeEvent, updateEvent, changeEventColor, resetGroupData,
      inviteToGroup, loadMembers, removeMember,
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);