import { getStoredToken } from '@/services/authService';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { BackendRoutePreview } from '@/services/driverService';

// ========== Start Route ==========

export interface StartRouteResponse extends BackendRoutePreview {}

/**
 * Start a route via PUT /api/driver/routes/startRoute?rutaId={id}
 * Returns the route with estado = "STARTED"
 */
export const startDriverRoute = async (rutaId: string): Promise<StartRouteResponse | null> => {
  const token = getStoredToken();
  if (!token) {
    console.error('No auth token available');
    return null;
  }

  try {
    const url = `${buildApiUrl(API_ENDPOINTS.DRIVER.START_ROUTE)}?rutaId=${encodeURIComponent(rutaId)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to start route:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting route:', error);
    return null;
  }
};

// ========== Passenger Pickup ==========

export interface PassengerActionRequest {
  id: {
    rutaId: string;
    pasajeroId: string;
  };
  estado: string;
  pickupAt?: string;
  dropoffAt?: string;
}

/**
 * Mark passenger pickup via POST /api/driver-passenger/route/passenger-pickup
 */
export const passengerPickup = async (rutaId: string, pasajeroId: string): Promise<boolean> => {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const body: PassengerActionRequest = {
      id: { rutaId, pasajeroId },
      estado: 'PENDIENTE',
      pickupAt: new Date().toISOString(),
    };

    const response = await fetch(buildApiUrl(API_ENDPOINTS.DRIVER_PASSENGER.PICKUP), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Failed to mark pickup:', response.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error marking pickup:', error);
    return false;
  }
};

/**
 * Mark passenger dropoff via POST /api/driver-passenger/route/passenger-dropoff
 */
export const passengerDropoff = async (rutaId: string, pasajeroId: string): Promise<boolean> => {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const body: PassengerActionRequest = {
      id: { rutaId, pasajeroId },
      estado: 'PENDIENTE',
      dropoffAt: new Date().toISOString(),
    };

    const response = await fetch(buildApiUrl(API_ENDPOINTS.DRIVER_PASSENGER.DROPOFF), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Failed to mark dropoff:', response.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error marking dropoff:', error);
    return false;
  }
};
