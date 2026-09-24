/**
 * API Service Layer for Jello Kanban
 * Connects React frontend to Express backend at http://localhost:5000/api
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request wrapper around native fetch with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Parse JSON body if present
    const contentType = response.headers.get('content-type');
    const hasJson = contentType && contentType.includes('application/json');
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP error ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Boards
  boards: {
    getAll: () => request('/boards'),
    getById: (id) => request(`/boards/${id}`),
    create: (data) =>
      request('/boards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Lists
  lists: {
    create: (data) =>
      request('/lists', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reorder: (id, position) =>
      request(`/lists/${id}/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ position }),
      }),
    delete: (id) =>
      request(`/lists/${id}`, {
        method: 'DELETE',
      }),
  },

  // Cards
  cards: {
    getById: (id) => request(`/cards/${id}`),
    create: (data) =>
      request('/cards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    move: (id, data) =>
      request(`/cards/${id}/move`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/cards/${id}`, {
        method: 'DELETE',
      }),
  },

  // Comments
  comments: {
    getByCardId: (cardId) => request(`/cards/${cardId}/comments`),
    create: (cardId, content) =>
      request(`/cards/${cardId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },

  // Health
  health: {
    check: () => request('/health'),
  },
};

export default api;
