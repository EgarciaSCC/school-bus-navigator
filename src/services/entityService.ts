import { getStoredToken } from '@/services/authService';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

// ========== Types ==========

export interface BusDetail {
  id: string;
  placa: string;
  capacidad: number;
  marca: string;
  modelo: string;
  fechaRevisionTecnica: string;
  fechaSeguroObligatorio: string;
  tipoMotor: 'combustible' | string;
  tipoMotorOtro: string;
  estado: 'activo' | string;
}

export interface CoordinadorDetail {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  estado: 'activo' | string;
  tenant: string;
  createdAt: string;
  updatedAt: string;
  activo: boolean;
}

export interface EstudianteDetail {
  id: string;
  nombre: string;
  matricula: string;
  curso: string;
  direccion: string;
  barrio: string;
  lat: number;
  lng: number;
  telefonoEmergencia: string;
}

export interface RutaDetailResponse {
  ruta: {
    id: string;
    nombre: string;
    busId: string;
    conductorId: string;
    coordinadorId: string;
    sedeId: string;
    estudiantes: string[];
    estado: string;
    createdAt: string | null;
    tipoRuta: 'RECOGIDA' | 'REGRESO';
    horaInicio: string;
    horaFin: string;
    fecha: string | null;
    capacidadActual: number;
    tenant: string;
  };
  estudiantes: EstudianteDetail[];
}

// ========== Helper ==========

const authFetch = async <T>(url: string): Promise<T | null> => {
  const token = getStoredToken();
  if (!token) {
    console.error('No auth token available');
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}:`, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
};

// ========== API Calls ==========

/** GET /api/rutas/{id} */
export const getRutaById = (id: string) =>
  authFetch<RutaDetailResponse>(buildApiUrl(API_ENDPOINTS.RUTAS.BY_ID(id)));

/** GET /api/buses/{id} */
export const getBusById = (id: string) =>
  authFetch<BusDetail>(buildApiUrl(API_ENDPOINTS.BUSES.BY_ID(id)));

/** GET /api/coordinadores/{id} */
export const getCoordinadorById = (id: string) =>
  authFetch<CoordinadorDetail>(buildApiUrl(API_ENDPOINTS.COORDINADORES.BY_ID(id)));

/** GET /api/pasajeros/listPasajerosByRutaId/{rutaId} */
export const getPasajerosByRutaId = (rutaId: string) =>
  authFetch<EstudianteDetail[]>(buildApiUrl(API_ENDPOINTS.PASAJEROS.BY_RUTA_ID(rutaId)));
