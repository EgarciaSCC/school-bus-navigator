import { getStoredToken } from '@/services/authService';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

// Types matching the actual backend response for GET /api/driver/routes/getRoutesToday
export interface BackendRoutePreview {
  id: string;
  nombre: string;
  busId: string;
  conductorId: string;
  coordinadorId: string;
  sedeId: string;
  estudiantes: string[];
  estado: string; // 'ACTIVE' | 'PROGRAMMED' | 'COMPLETED'
  createdAt: string | null;
  tipoRuta: 'RECOGIDA' | 'REGRESO';
  horaInicio: string; // "HH:MM"
  horaFin: string;    // "HH:MM"
  fecha: string | null;
  capacidadActual: number;
  tenant: string;
}

export interface DriverRoutesTodayResponse {
  driverId: string;
  driverName: string;
  date: string;
  activeRoutes: BackendRoutePreview[];
  scheduledRoutes: BackendRoutePreview[];
  completedRoutes: BackendRoutePreview[];
}

export interface DriverRouteHistoryResponse {
  routes: BackendRoutePreview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalRoutes: number;
    totalStudentsTransported: number;
    averageDuration: number;
  };
}

export interface HistoryQueryParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Get driver's routes for today
 * Endpoint: GET /api/driver/routes/getRoutesToday
 */
export const getDriverRoutesToday = async (): Promise<DriverRoutesTodayResponse | null> => {
  const token = getStoredToken();
  
  if (!token) {
    console.error('No auth token available');
    return null;
  }
  
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.DRIVER.ROUTES_TODAY), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch driver routes:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Normalize: ensure estudiantes is always an array
    const normalize = (routes: BackendRoutePreview[] | undefined | null): BackendRoutePreview[] =>
      (routes || []).map(r => ({ ...r, estudiantes: r.estudiantes || [] }));
    
    return {
      ...data,
      activeRoutes: normalize(data.activeRoutes),
      scheduledRoutes: normalize(data.scheduledRoutes),
      completedRoutes: normalize(data.completedRoutes),
    };
  } catch (error) {
    console.error('Error fetching driver routes today:', error);
    return null;
  }
};

/**
 * Get driver's route history
 * Endpoint: GET /api/driver/routes/history
 */
export const getDriverRouteHistory = async (
  params?: HistoryQueryParams
): Promise<DriverRouteHistoryResponse | null> => {
  const token = getStoredToken();
  
  if (!token) {
    console.error('No auth token available');
    return null;
  }
  
  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${buildApiUrl(API_ENDPOINTS.DRIVER.ROUTES_HISTORY)}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch route history:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching driver route history:', error);
    return null;
  }
};
