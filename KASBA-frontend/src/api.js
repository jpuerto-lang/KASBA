const API_URL = 'http://192.168.3.10:3000'; 

export function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_URL}${endpoint}`, { ...options, headers });
}
