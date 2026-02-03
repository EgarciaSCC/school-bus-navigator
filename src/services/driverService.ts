import { getStoredToken } from '@/services/authService';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

// Types based on API_CONTRACTS.md - Section 2
export interface DriverRoutePreview {
  id: string;
  name: string;
  direction: 'to_school' | 'from_school';
  status: 'not_started' | 'in_progress' | 'completed';
  estimatedStartTime: string;  // "HH:MM"
  estimatedEndTime: string;    // "HH:MM"
  actualStartTime?: string;    // "HH:MM" - solo para completadas
  actualEndTime?: string;      // "HH:MM" - solo para completadas
  stopsCount: number;
  studentsCount: number;
  studentsTransported?: number;  // solo para completadas
  busPlate: string;
  busId: string;
}

export interface DriverRoutesTodayResponse {
  driverId: string;
  driverName: string;
  date: string;
  activeRoute: DriverRoutePreview | null;
  scheduledRoutes: DriverRoutePreview[];
  completedRoutes: DriverRoutePreview[];
}

export interface DriverRouteHistoryResponse {
  routes: DriverRoutePreview[];
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
 * Endpoint: GET /api/driver/routes/today
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
    return data;
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
