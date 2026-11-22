import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://tcalendar.onrender.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tcalendar_token');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Render gratis duerme el servidor tras un rato sin uso. Mientras despierta (~50 s) responde con error de red
// o 502/503/504: las lecturas (GET) se reintentan solas en vez de fallar y dejar la pantalla vacía.
const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 3000;
const isWakingUp = (error) => error.code === 'ERR_NETWORK' || [502, 503, 504].includes(error.response?.status);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (config?.method === 'get' && isWakingUp(error) && (config.__retries ?? 0) < MAX_RETRIES) {
      config.__retries = (config.__retries ?? 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return api(config);
    }
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('tcalendar_token');
      localStorage.removeItem('tcalendar_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Despierta el servidor apenas se abre la app, mientras la persona escribe su usuario y contraseña.
export const wakeServer = () => api.get('/health').catch(() => {});
export const registerUser        = (payload)           => api.post('/auth/register', payload);
export const loginUser           = (payload)           => api.post('/auth/login', payload);
export const fetchCurrentUser    = ()                  => api.get('/auth/me');
export const fetchGroups         = ()                  => api.get('/groups');
export const createGroup         = (payload)           => api.post('/groups', payload);
export const deleteGroup         = (groupId)           => api.delete(`/groups/${groupId}`);
export const inviteMember        = (groupId, payload)  => api.post(`/groups/${groupId}/invite`, payload);
export const removeMember        = (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`);
export const fetchGroupEvents    = (groupId, params)  => api.get(`/groups/${groupId}/events`, { params });
export const fetchGroupPosts     = (groupId, cursor)  => api.get(`/groups/${groupId}/posts`, { params: cursor ? { cursor } : {} });
export const createGroupPost     = (groupId, content) => api.post(`/groups/${groupId}/posts`, { content });
export const deleteGroupPost     = (groupId, postId)  => api.delete(`/groups/${groupId}/posts/${postId}`);
export const fetchGroupComments  = (groupId, postId, cursor, parentId) => api.get(`/groups/${groupId}/posts/${postId}/comments`, { params: { ...(cursor ? { cursor } : {}), ...(parentId ? { parentId } : {}) } });
export const createGroupComment  = (groupId, postId, content, parentId) => api.post(`/groups/${groupId}/posts/${postId}/comments`, { content, ...(parentId ? { parentId } : {}) });
export const deleteGroupComment  = (groupId, postId, commentId) => api.delete(`/groups/${groupId}/posts/${postId}/comments/${commentId}`);
export const fetchGroupResources = (groupId, cursor)  => api.get(`/groups/${groupId}/resources`, { params: cursor ? { cursor } : {} });
export const searchGroupResources = (groupId, query) => api.get(`/groups/${groupId}/resources`, { params: { q: query } });
export const createGroupResource = (groupId, payload) => api.post(`/groups/${groupId}/resources`, payload);
export const deleteGroupResource = (groupId, id)      => api.delete(`/groups/${groupId}/resources/${id}`);
export const setGroupResourcePinned = (groupId, id, pinned) => api.patch(`/groups/${groupId}/resources/${id}/pin`, { pinned });
export const exportGroupIcs      = (groupId)           => api.get(`/groups/${groupId}/events.ics`, { responseType: 'blob' });
export const updateEvent         = (eventId, payload)  => api.put(`/events/${eventId}`, payload);
export const changePassword      = (payload)           => api.put('/auth/password', payload);
export const updateAvatar        = (avatar)            => api.put('/auth/avatar', { avatar });
export const adminResetPassword  = (payload)           => api.post('/auth/admin/reset-password', payload);
export const fetchPushKey        = ()                  => api.get('/push/key');
export const pushSubscribe       = (subscription)      => api.post('/push/subscribe', subscription);
export const pushUnsubscribe     = (endpoint)          => api.post('/push/unsubscribe', { endpoint });
export const createGroupEvent    = (groupId, payload)  => api.post(`/groups/${groupId}/events`, payload);
export const deleteEvent         = (eventId)           => api.delete(`/events/${eventId}`);
export const fetchGroupMembers   = (groupId)           => api.get(`/groups/${groupId}/members`);
export const updateEventColor    = (eventId, color)    => api.patch(`/events/${eventId}/color`, { color });
export const fetchUpcomingEvents = ()                  => api.get('/events/upcoming');
export const fetchSchedules      = ()                  => api.get('/schedules');
export const createSchedule      = (payload)           => api.post('/schedules', payload);
export const updateSchedule      = (id, payload)       => api.put(`/schedules/${id}`, payload);
export const deleteSchedule      = (id)                => api.delete(`/schedules/${id}`);
export const addScheduleToGroup  = (id, groupId)       => api.post(`/schedules/${id}/groups/${groupId}`);
export const removeScheduleFromGroup = (id, groupId)   => api.delete(`/schedules/${id}/groups/${groupId}`);

export default api;