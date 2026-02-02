import { getStoredToken } from '@/services/authService';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

// Types based on API_CONTRACTS.md - Section 3
export interface RouteStudent {
  id: string;
  name: string;
  grade: string;
  photo?: string;
  parentPhone: string;
  status: 'waiting' | 'picked' | 'dropped' | 'absent';
}

export interface RouteStop {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedArrival: string;
  status: 'pending' | 'active' | 'completed';
  completedAt?: string;
  isTerminal: boolean;
  students: RouteStudent[];
}

export interface RouteResponse {
  id: string;
  name: string;
  direction: 'to_school' | 'from_school';
  status: 'not_started' | 'in_progress' | 'completed';
  currentStopIndex: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  stops: RouteStop[];
}

export interface StartRouteResponse {
  success: boolean;
  message: string;
  route?: {
    id: string;
    status: 'in_progress';
    startedAt: string;
    currentStopIndex: number;
  };
}

export interface FinishRouteRequest {
  notes?: string;
}

export interface RouteReport {
  id: string;
  routeId: string;
  completedAt: string;
  duration: number;
  stopsCompleted: number;
  studentsTransported: number;
  incidents: number;
}

export interface FinishRouteResponse {
  success: boolean;
  message: string;
  report?: RouteReport;
}

/**
 * Get active route for the driver
 * Endpoint: GET /api/routes/active
 */
export const getActiveRoute = async (): Promise<RouteResponse | null> => {
  const token = getStoredToken();
  
  if (!token) {
    console.error('No auth token available');
    return null;
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ROUTES.ACTIVE), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch active route:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching active route:', error);
    return null;
  }
};

/**
 * Get route by ID
 * Endpoint: GET /api/routes/:routeId
 */
export const getRouteById = async (routeId: string): Promise<RouteResponse | null> => {
  const token = getStoredToken();
  
  if (!token) {
    console.error('No auth token available');
    return null;
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ROUTES.BY_ID(routeId)), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch route:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};

/**
 * Start a route
 * Endpoint: POST /api/routes/:routeId/start
 */
export const startRoute = async (routeId: string): Promise<StartRouteResponse> => {
  const token = getStoredToken();
  
  if (!token) {
    return { success: false, message: 'No hay sesión activa' };
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ROUTES.START(routeId)), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error starting route:', error);
    return { success: false, message: 'Error al iniciar la ruta' };
  }
};

/**
 * Finish a route
 * Endpoint: POST /api/routes/:routeId/finish
 */
export const finishRoute = async (
  routeId: string, 
  request?: FinishRouteRequest
): Promise<FinishRouteResponse> => {
  const token = getStoredToken();
  
  if (!token) {
    return { success: false, message: 'No hay sesión activa' };
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ROUTES.FINISH(routeId)), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request || {}),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error finishing route:', error);
    return { success: false, message: 'Error al finalizar la ruta' };
  }
};

/**
 * Get route report
 * Endpoint: GET /api/routes/:routeId/report
 */
export const getRouteReport = async (routeId: string): Promise<RouteReport | null> => {
  const token = getStoredToken();
  
  if (!token) {
    console.error('No auth token available');
    return null;
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.ROUTES.REPORT(routeId)), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch route report:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching route report:', error);
    return null;
  }
};
