import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tcalendar.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tcalendar_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tcalendar_token');
      localStorage.removeItem('tcalendar_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
export const fetchGroups = () => api.get('/groups');
export const createGroup = (payload) => api.post('/groups', payload);
export const inviteMember = (groupId, payload) => api.post(`/groups/${groupId}/invite`, payload);
export const removeMember = (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`);
export const fetchGroupEvents = (groupId) => api.get(`/groups/${groupId}/events`);
export const createGroupEvent = (groupId, payload) => api.post(`/groups/${groupId}/events`, payload);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);
export const fetchGroupMembers = (groupId) => api.get(`/groups/${groupId}/members`);