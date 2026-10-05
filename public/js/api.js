const BASE_URL = '/api/tasks';
const AUTH_URL = '/api/auth';

let csrfToken = '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(url, options = {}) {
  const method = options.method || 'GET';
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (method !== 'GET') headers['X-CSRF-Token'] = csrfToken;

  const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (payload.csrf) csrfToken = payload.csrf;

  if (!response.ok) {
    throw new ApiError(payload.error || `Error ${response.status}`, response.status);
  }
  return payload;
}

// --- Auth ---
export const getSession = async () => (await request(`${AUTH_URL}/me`)).data;

export const login = async (email, password) =>
  (await request(`${AUTH_URL}/login`, { method: 'POST', body: JSON.stringify({ email, password }) })).data;

export const register = async (name, email, password) =>
  (await request(`${AUTH_URL}/register`, { method: 'POST', body: JSON.stringify({ name, email, password }) })).data;

export const logout = () => request(`${AUTH_URL}/logout`, { method: 'POST' });

// --- Tareas ---
export const getTasks = async () => (await request(BASE_URL)).data;

export const createTask = async (title) =>
  (await request(BASE_URL, { method: 'POST', body: JSON.stringify({ title }) })).data;

export const toggleTask = async (id) =>
  (await request(`${BASE_URL}/${id}/toggle`, { method: 'PATCH' })).data;

export const deleteTask = (id) => request(`${BASE_URL}/${id}`, { method: 'DELETE' });