import { io } from 'socket.io-client';

// Support external backend URL for production / GitHub Pages deployment
const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || '').trim();
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

let socket = null;
export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io(BACKEND_URL || '/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
  }
  return socket;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`API request fallback (${endpoint}):`, error.message);
    throw error;
  }
}

// Patients API
export const fetchPatients = () => request('/patients');
export const fetchPatientById = (id) => request(`/patients/${id}`);
export const createPatient = (patientData) => request('/patients', {
  method: 'POST',
  body: JSON.stringify(patientData)
});
export const updatePatient = (id, data) => request(`/patients/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(data)
});

// Exercises / Assignments API
export const fetchVideos = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/videos${query ? `?${query}` : ''}`);
};

export const assignVideo = (patientId, videoData) => request(`/patients/${patientId}/assignments`, {
  method: 'POST',
  body: JSON.stringify(videoData)
});

export const completeExercise = (patientId, completionData) => request(`/patients/${patientId}/complete-exercise`, {
  method: 'POST',
  body: JSON.stringify(completionData)
});

export const removeAssignment = (assignmentId) => request(`/assignments/${assignmentId}`, {
  method: 'DELETE'
});

// Messages API
export const fetchMessages = (patientId) => request(`/patients/${patientId}/messages`);
export const sendMessage = (patientId, messageData) => request(`/patients/${patientId}/messages`, {
  method: 'POST',
  body: JSON.stringify(messageData)
});

// Dashboard & Analytics API
export const fetchDashboardSummary = () => request('/dashboard/summary');
export const fetchAnalyticsData = () => request('/dashboard/analytics');

// Doctor Profile API
export const fetchDoctorProfile = () => request('/doctor/profile');
export const updateDoctorProfile = (data) => request('/doctor/profile', {
  method: 'PUT',
  body: JSON.stringify(data)
});

// Notifications API
export const fetchNotifications = () => request('/notifications');
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, {
  method: 'PATCH'
});
export const markAllNotificationsRead = () => request('/notifications/read-all', {
  method: 'PATCH'
});

