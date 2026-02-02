// API Configuration
// Base URL and endpoints for the backend API

export const API_CONFIG = {
  // Base URL for API calls - change this to your backend URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://backadminroute-production.up.railway.app',
  
  // API version prefix
  API_PREFIX: '/api',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
  },
  
  // Driver routes
  DRIVER: {
    ROUTES_TODAY: '/driver/routes/today',
    ROUTES_HISTORY: '/driver/routes/history',
  },
  
  // Routes
  ROUTES: {
    ACTIVE: '/routes/active',
    BY_ID: (id: string) => `/routes/${id}`,
    START: (id: string) => `/routes/${id}/start`,
    FINISH: (id: string) => `/routes/${id}/finish`,
    REPORT: (id: string) => `/routes/${id}/report`,
  },
  
  // Stops
  STOPS: {
    ARRIVE: (routeId: string, stopId: string) => `/routes/${routeId}/stops/${stopId}/arrive`,
    COMPLETE: (routeId: string, stopId: string) => `/routes/${routeId}/stops/${stopId}/complete`,
  },
  
  // Students
  STUDENTS: {
    UPDATE_STATUS: (routeId: string, stopId: string, studentId: string) => 
      `/routes/${routeId}/stops/${stopId}/students/${studentId}/status`,
  },
  
  // Incidents
  INCIDENTS: {
    CREATE: '/incidents',
  },
  
  // Geolocation
  GEOLOCATION: {
    UPDATE: '/geolocation/update',
  },
};

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;
};
