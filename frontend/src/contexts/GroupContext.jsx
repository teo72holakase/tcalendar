import { createContext, useContext, useState, useEffect } from 'react';
import {
  createGroup as apiCreateGroup, fetchGroups, fetchGroupEvents,
  createGroupEvent, deleteEvent, inviteMember, fetchGroupMembers,
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data } = await fetchGroups();
      setGroups(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadGroups();
    else setGroups([]);
  }, [user]);

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

  const loadEvents = async (groupId) => {
    setLoading(true); setError('');
    try {
      const { data } = await fetchGroupEvents(groupId);
      setEvents(data);
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
      groups, events, members, selectedGroup, loading, message, error,
      setSelectedGroup, setMessage, setError,
      loadGroups, createGroup, removeGroup,
      loadEvents, createEvent, removeEvent,
      inviteToGroup, loadMembers, removeMember,
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);