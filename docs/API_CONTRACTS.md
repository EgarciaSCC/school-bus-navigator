# Contratos de API - Sistema de Transporte Escolar NCA

Este documento define las especificaciones para construir cada endpoint del backend. Cada sección contiene el prompt para generar el servicio, estructura de datos y validaciones.

---

## Índice

1. [Autenticación](#1-autenticación)
2. [Rutas](#2-rutas)
3. [Paradas](#3-paradas)
4. [Estudiantes](#4-estudiantes)
5. [Incidentes](#5-incidentes)
6. [Reportes](#6-reportes)
7. [Geolocalización](#7-geolocalización)

---

## 1. Autenticación

### 1.1 Login

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/auth/login que:
- Reciba credenciales cifradas con AES-256
- Descifre y valide contra la base de datos
- Genere JWT con expiración de 1 hora
- Retorne token y datos del usuario sin contraseña
- Registre intentos fallidos para seguridad
```

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```typescript
interface LoginRequest {
  username: string;  // Cifrado con AES-256
  password: string;  // Cifrado con AES-256
}
```

**Response Success (200):**
```typescript
interface LoginResponse {
  success: true;
  message: string;
  token: string;  // JWT
  user: {
    id: string;
    username: string;
    role: 'driver' | 'admin' | 'parent';
    name: string;
    email: string;
  };
}
```

**Response Error (401):**
```typescript
interface LoginErrorResponse {
  success: false;
  message: string;  // "Usuario o contraseña incorrectos"
}
```

**Validaciones:**
- `username`: requerido, string, máximo 50 caracteres
- `password`: requerido, string, mínimo 8 caracteres
- Máximo 5 intentos fallidos por IP en 15 minutos
- Bloqueo temporal de 30 minutos después de 5 intentos fallidos

---

### 1.2 Logout

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/auth/logout que:
- Invalide el token JWT actual
- Agregue el token a una lista negra (blacklist)
- Limpie cualquier sesión activa del usuario
```

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```typescript
interface LogoutResponse {
  success: true;
  message: string;  // "Sesión cerrada exitosamente"
}
```

---

### 1.3 Validar Sesión

**Prompt para construir el endpoint:**
```
Crear endpoint GET /api/auth/validate que:
- Verifique el JWT del header Authorization
- Compruebe que no esté en la lista negra
- Retorne los datos del usuario si es válido
```

**Endpoint:** `GET /api/auth/validate`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```typescript
interface ValidateResponse {
  valid: true;
  user: {
    id: string;
    username: string;
    role: 'driver' | 'admin' | 'parent';
    name: string;
    email: string;
  };
}
```

**Response Error (401):**
```typescript
interface ValidateErrorResponse {
  valid: false;
  message: string;  // "Token inválido o expirado"
}
```

---

## 2. Rutas

### Reglas de Negocio - Rutas

| Regla | Descripción |
|-------|-------------|
| **Máximo de rutas por conductor** | Un conductor puede tener máximo 2 rutas en la mañana (primera jornada) y 2 rutas en la tarde (segunda jornada), para un total de **máximo 4 rutas por día**. |
| **Máximo de rutas por bus** | Un bus escolar solo puede estar asignado a **máximo 4 rutas por día** (misma distribución que conductores). |
| **Sin superposición de horarios** | Un conductor, coordinador o bus **no pueden estar asignados a más de una ruta en el mismo horario**. El sistema debe validar conflictos de horario antes de permitir asignaciones. |
| **Dirección de ruta obligatoria** | Cada ruta debe definir explícitamente si es para **recoger estudiantes** (`to_school`) o **llevar estudiantes a casa** (`from_school`). |

### Tipos de Programación de Rutas

Las rutas pueden programarse de las siguientes formas:

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `school_calendar` | Todos los días escolares según calendario oficial | Lunes a Viernes durante período escolar |
| `specific_weekdays` | Días específicos de la semana seleccionados | Solo Lunes, Miércoles y Viernes |
| `specific_months` | Meses específicos del calendario escolar | Febrero a Junio, Agosto a Noviembre |
| `custom` | Fechas personalizadas seleccionadas manualmente | Fechas específicas para eventos |

---

### 2.1 Obtener Ruta Activa del Conductor

**Prompt para construir el endpoint:**
```
Crear endpoint GET /api/routes/active que:
- Identifique al conductor por el JWT
- Retorne la ruta asignada para el día actual
- Incluya todas las paradas con sus estudiantes
- Calcule tiempos estimados basados en hora actual
```

**Endpoint:** `GET /api/routes/active`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```typescript
interface RouteResponse {
  id: string;
  name: string;
  direction: 'to_school' | 'from_school';
  status: 'not_started' | 'in_progress' | 'completed';
  currentStopIndex: number;
  estimatedStartTime: string;  // "HH:MM"
  estimatedEndTime: string;    // "HH:MM"
  stops: Stop[];
}

interface Stop {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedArrival: string;  // "HH:MM"
  status: 'pending' | 'active' | 'completed';
  completedAt?: string;      // ISO date
  isTerminal: boolean;
  students: Student[];
}

interface Student {
  id: string;
  name: string;
  grade: string;
  photo?: string;
  parentPhone: string;
  status: 'waiting' | 'picked' | 'dropped' | 'absent';
}
```

**Validaciones:**
- Token JWT válido y no expirado
- Usuario debe tener rol 'driver'
- Debe existir ruta asignada para la fecha actual

---

### 2.2 Iniciar Ruta

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/routes/:routeId/start que:
- Cambie el estado de la ruta a 'in_progress'
- Registre timestamp de inicio
- Active la primera parada
- Notifique a los padres que la ruta ha iniciado
```

**Endpoint:** `POST /api/routes/:routeId/start`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```typescript
interface StartRouteResponse {
  success: true;
  message: string;
  route: {
    id: string;
    status: 'in_progress';
    startedAt: string;  // ISO date
    currentStopIndex: number;
  };
}
```

**Validaciones:**
- Ruta debe estar en estado 'not_started'
- Usuario debe ser el conductor asignado
- Fecha actual debe coincidir con fecha de la ruta

---

### 2.3 Finalizar Ruta

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/routes/:routeId/finish que:
- Cambie el estado de la ruta a 'completed'
- Complete todas las paradas pendientes
- Genere reporte automático
- Registre estadísticas de la ruta
```

**Endpoint:** `POST /api/routes/:routeId/finish`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface FinishRouteRequest {
  notes?: string;  // Observaciones del conductor
}
```

**Response Success (200):**
```typescript
interface FinishRouteResponse {
  success: true;
  message: string;
  report: RouteReport;
}
```

### 2.4 Crear Ruta

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/routes que:
- Cree una nueva ruta con programación de calendario
- Valide que el conductor no exceda 4 rutas diarias (2 mañana + 2 tarde)
- Valide que el bus no exceda 4 rutas diarias
- Valide que no haya conflictos de horario con otras rutas asignadas
- Asigne conductor, bus y coordinador sin superposición de horarios
- Requiera dirección de ruta (recoger o llevar estudiantes)
```

**Endpoint:** `POST /api/routes`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface CreateRouteRequest {
  name: string;
  direction: 'to_school' | 'from_school';
  shift: 'morning' | 'afternoon';
  
  // Asignaciones
  driverId: string;
  busId: string;
  coordinatorId?: string;
  
  // Programación
  schedule: {
    type: 'school_calendar' | 'specific_weekdays' | 'specific_months' | 'custom';
    
    // Para 'specific_weekdays'
    weekdays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')[];
    
    // Para 'specific_months'
    months?: number[];  // 1-12
    
    // Para 'custom'
    customDates?: string[];  // Array de fechas ISO
    
    // Período de validez
    startDate: string;  // ISO date
    endDate: string;    // ISO date
  };
  
  // Horarios
  estimatedStartTime: string;  // "HH:MM"
  estimatedEndTime: string;    // "HH:MM"
  
  // Paradas iniciales (opcional)
  stops?: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    isTerminal: boolean;
  }[];
}
```

**Response Success (201):**
```typescript
interface CreateRouteResponse {
  success: true;
  message: string;
  route: {
    id: string;
    name: string;
    direction: 'to_school' | 'from_school';
    shift: 'morning' | 'afternoon';
    schedule: RouteSchedule;
    driver: { id: string; name: string };
    bus: { id: string; plate: string };
    coordinator?: { id: string; name: string };
  };
}
```

**Response Error (409 - Conflicto):**
```typescript
interface CreateRouteConflictResponse {
  success: false;
  message: string;  // "El conductor ya tiene 2 rutas asignadas en la mañana"
  conflicts: {
    type: 'driver_limit' | 'bus_limit' | 'schedule_overlap';
    entity: string;  // ID del conductor, bus o coordinador
    existingRouteId?: string;
    details: string;
  }[];
}
```

**Validaciones:**
- `name`: requerido, 3-100 caracteres
- `direction`: requerido, debe ser 'to_school' o 'from_school'
- `shift`: requerido, debe ser 'morning' o 'afternoon'
- `driverId`: requerido, conductor debe existir y estar activo
- `busId`: requerido, bus debe existir y estar operativo
- El conductor no puede tener más de 2 rutas en el mismo turno (mañana/tarde)
- El conductor no puede tener más de 4 rutas totales en un día
- El bus no puede tener más de 4 rutas totales en un día
- No puede haber superposición de horarios para el mismo conductor, bus o coordinador
- `schedule.type`: requerido
- `schedule.weekdays`: requerido si type es 'specific_weekdays', mínimo 1 día
- `schedule.months`: requerido si type es 'specific_months', valores 1-12
- `schedule.customDates`: requerido si type es 'custom', fechas válidas futuras

---

### 2.5 Validar Disponibilidad

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/routes/validate-availability que:
- Verifique disponibilidad de conductor, bus y coordinador
- Retorne conflictos de horario si existen
- Calcule cuántas rutas tiene asignadas cada entidad
- Sugiera horarios alternativos si hay conflictos
```

**Endpoint:** `POST /api/routes/validate-availability`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface ValidateAvailabilityRequest {
  date: string;  // ISO date
  shift: 'morning' | 'afternoon';
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  driverId?: string;
  busId?: string;
  coordinatorId?: string;
}
```

**Response Success (200):**
```typescript
interface ValidateAvailabilityResponse {
  available: boolean;
  driver?: {
    id: string;
    name: string;
    morningRoutes: number;  // 0-2
    afternoonRoutes: number;  // 0-2
    totalRoutes: number;  // 0-4
    canAssignMore: boolean;
    conflicts: ScheduleConflict[];
  };
  bus?: {
    id: string;
    plate: string;
    totalRoutes: number;
    canAssignMore: boolean;
    conflicts: ScheduleConflict[];
  };
  coordinator?: {
    id: string;
    name: string;
    conflicts: ScheduleConflict[];
  };
  suggestedAlternatives?: {
    startTime: string;
    endTime: string;
    reason: string;
  }[];
}

interface ScheduleConflict {
  routeId: string;
  routeName: string;
  startTime: string;
  endTime: string;
}
```

---

## 3. Paradas

### 3.1 Agregar Nueva Parada

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/routes/:routeId/stops que:
- Agregue una nueva parada intermedia a la ruta
- Inserte antes de la última parada (destino)
- Valide coordenadas y dirección
- Asocie los estudiantes proporcionados
- Recalcule tiempos estimados
```

**Endpoint:** `POST /api/routes/:routeId/stops`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface AddStopRequest {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  students: {
    name: string;
    grade?: string;
    parentPhone?: string;
  }[];
}
```

**Response Success (201):**
```typescript
interface AddStopResponse {
  success: true;
  message: string;
  stop: Stop;
  newRouteOrder: string[];  // Array de IDs en nuevo orden
}
```

**Validaciones:**
- `name`: requerido, string, 3-100 caracteres
- `address`: requerido, string, 5-200 caracteres
- `coordinates.lat`: requerido, número, rango -90 a 90
- `coordinates.lng`: requerido, número, rango -180 a 180
- `students`: array, mínimo 1 estudiante
- `students[].name`: requerido, string, 2-100 caracteres, solo letras y espacios

---

### 3.2 Completar Parada

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/stops/:stopId/complete que:
- Marque la parada como completada
- Registre timestamp de llegada
- Active la siguiente parada
- Notifique a padres de estudiantes recogidos/dejados
- Actualice ETA de paradas restantes
```

**Endpoint:** `POST /api/stops/:stopId/complete`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface CompleteStopRequest {
  studentStatuses: {
    studentId: string;
    status: 'picked' | 'dropped' | 'absent';
  }[];
  notes?: string;
}
```

**Response Success (200):**
```typescript
interface CompleteStopResponse {
  success: true;
  message: string;
  nextStop?: Stop;
  isRouteComplete: boolean;
}
```

**Validaciones:**
- Parada debe estar en estado 'active'
- Todos los estudiantes deben tener un estado asignado
- Usuario debe ser conductor de la ruta

---

### 3.3 Reordenar Paradas

**Prompt para construir el endpoint:**
```
Crear endpoint PUT /api/routes/:routeId/stops/reorder que:
- Reordene las paradas intermedias
- Mantenga primera y última parada (terminales) fijas
- Recalcule tiempos estimados
- Valide que la ruta no esté en progreso
```

**Endpoint:** `PUT /api/routes/:routeId/stops/reorder`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface ReorderStopsRequest {
  stopIds: string[];  // Array de IDs en nuevo orden
}
```

**Response Success (200):**
```typescript
interface ReorderStopsResponse {
  success: true;
  message: string;
  stops: Stop[];  // Paradas en nuevo orden con ETAs actualizados
}
```

**Validaciones:**
- Ruta debe estar en estado 'not_started'
- Primera y última parada no pueden cambiar posición
- Todos los IDs deben pertenecer a la ruta

---

## 4. Estudiantes

### 4.1 Agregar Estudiante a Parada

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/stops/:stopId/students que:
- Agregue un nuevo estudiante a una parada existente
- Valide datos del estudiante
- Permita agregar durante ruta en progreso
- Notifique al padre si se proporciona teléfono
```

**Endpoint:** `POST /api/stops/:stopId/students`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface AddStudentRequest {
  name: string;
  grade?: string;
  parentPhone?: string;
  photo?: string;  // URL o base64
}
```

**Response Success (201):**
```typescript
interface AddStudentResponse {
  success: true;
  message: string;
  student: Student;
}
```

**Validaciones:**
- `name`: requerido, 2-100 caracteres, solo letras, espacios y acentos
- `grade`: opcional, formato válido (ej: "5° Primaria")
- `parentPhone`: opcional, formato E.164 o local válido
- `photo`: opcional, URL válida o base64 de imagen

---

### 4.2 Actualizar Estado de Estudiante

**Prompt para construir el endpoint:**
```
Crear endpoint PUT /api/students/:studentId/status que:
- Actualice el estado del estudiante
- Registre timestamp de la acción
- Envíe notificación push al padre
- Registre para el reporte final
```

**Endpoint:** `PUT /api/students/:studentId/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface UpdateStudentStatusRequest {
  status: 'picked' | 'dropped' | 'absent';
  notes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

**Response Success (200):**
```typescript
interface UpdateStudentStatusResponse {
  success: true;
  message: string;
  student: {
    id: string;
    status: string;
    updatedAt: string;
  };
  notificationSent: boolean;
}
```

---

## 5. Incidentes

### 5.1 Reportar Incidente

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/routes/:routeId/incidents que:
- Registre un incidente durante la ruta
- Clasifique por tipo y severidad
- Notifique a administradores si es crítico
- Guarde ubicación GPS del reporte
- Actualice ETA si afecta tiempos
```

**Endpoint:** `POST /api/routes/:routeId/incidents`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface ReportIncidentRequest {
  type: 'high_traffic' | 'road_closed' | 'breakdown' | 'weather' | 'custom';
  description?: string;  // Requerido si type es 'custom'
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedDelay?: number;  // Minutos de retraso estimado
}
```

**Response Success (201):**
```typescript
interface ReportIncidentResponse {
  success: true;
  message: string;
  incident: {
    id: string;
    type: string;
    reportedAt: string;
    acknowledged: boolean;
  };
  updatedETAs?: {
    stopId: string;
    newETA: string;
  }[];
}
```

**Validaciones:**
- `type`: requerido, debe ser uno de los valores permitidos
- `description`: requerido si type es 'custom', máximo 500 caracteres
- `severity`: requerido
- `coordinates`: requeridas, valores GPS válidos
- `estimatedDelay`: opcional, número positivo, máximo 180 minutos

---

## 6. Reportes

### 6.1 Generar Reporte de Ruta

**Prompt para construir el endpoint:**
```
Crear endpoint GET /api/routes/:routeId/report que:
- Genere reporte completo de la ruta finalizada
- Incluya estadísticas de tiempo y distancia
- Liste todos los estudiantes con sus estados
- Incluya incidentes reportados
- Calcule métricas de rendimiento
```

**Endpoint:** `GET /api/routes/:routeId/report`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```typescript
interface RouteReportResponse {
  id: string;
  routeId: string;
  routeName: string;
  driverName: string;
  date: string;  // ISO date
  
  timing: {
    scheduledStart: string;
    actualStart: string;
    scheduledEnd: string;
    actualEnd: string;
    totalDuration: number;  // minutos
    delayMinutes: number;
  };
  
  distance: {
    plannedKm: number;
    actualKm: number;
    averageSpeedKmh: number;
  };
  
  stops: {
    total: number;
    completed: number;
    skipped: number;
    details: {
      stopId: string;
      name: string;
      scheduledArrival: string;
      actualArrival: string;
      delayMinutes: number;
    }[];
  };
  
  students: {
    total: number;
    picked: number;
    dropped: number;
    absent: number;
    details: {
      studentId: string;
      name: string;
      action: string;
      timestamp: string;
      stopName: string;
    }[];
  };
  
  incidents: {
    id: string;
    type: string;
    description: string;
    reportedAt: string;
    location: {
      lat: number;
      lng: number;
    };
  }[];
  
  notes?: string;
}
```

---

### 6.2 Enviar Reporte

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/reports/:reportId/submit que:
- Envíe el reporte a administración
- Permita agregar notas adicionales
- Marque el reporte como enviado
- Genere PDF si se solicita
```

**Endpoint:** `POST /api/reports/:reportId/submit`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface SubmitReportRequest {
  notes?: string;
  generatePdf?: boolean;
}
```

**Response Success (200):**
```typescript
interface SubmitReportResponse {
  success: true;
  message: string;
  submittedAt: string;
  pdfUrl?: string;
}
```

---

## 7. Geolocalización

### 7.1 Actualizar Ubicación del Bus

**Prompt para construir el endpoint:**
```
Crear endpoint POST /api/location/update que:
- Reciba coordenadas GPS del conductor
- Actualice posición en tiempo real
- Calcule velocidad y dirección
- Detecte proximidad a paradas
- Transmita a padres vía WebSocket
- Actualice ETAs dinámicamente
```

**Endpoint:** `POST /api/location/update`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface UpdateLocationRequest {
  coordinates: {
    lat: number;
    lng: number;
  };
  accuracy: number;      // metros
  speed?: number;        // km/h
  heading?: number;      // grados 0-360
  timestamp: string;     // ISO date del dispositivo
}
```

**Response Success (200):**
```typescript
interface UpdateLocationResponse {
  success: true;
  proximityAlerts?: {
    stopId: string;
    stopName: string;
    distanceMeters: number;
    etaMinutes: number;
  }[];
  isOffRoute?: boolean;
  suggestedRoute?: {
    waypoints: { lat: number; lng: number }[];
  };
}
```

**Validaciones:**
- `coordinates`: requeridas, valores GPS válidos
- `accuracy`: requerida, número positivo
- `speed`: opcional, 0-200 km/h
- `heading`: opcional, 0-360 grados
- `timestamp`: requerido, no mayor a 30 segundos de antigüedad

---

### 7.2 Obtener Ubicación del Bus (Para Padres)

**Prompt para construir el endpoint:**
```
Crear endpoint GET /api/routes/:routeId/bus-location que:
- Retorne última ubicación conocida del bus
- Calcule ETA a la parada del estudiante
- Incluya información de la parada actual
- Requiera autenticación de padre
```

**Endpoint:** `GET /api/routes/:routeId/bus-location`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
```
studentId: string  // ID del estudiante del padre
```

**Response Success (200):**
```typescript
interface BusLocationResponse {
  busLocation: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    updatedAt: string;
  };
  routeStatus: 'not_started' | 'in_progress' | 'completed';
  currentStop: {
    name: string;
    index: number;
  };
  studentStop: {
    name: string;
    etaMinutes: number;
    distanceKm: number;
    stopsAway: number;
  };
}
```

---

## Esquemas de Validación Zod

```typescript
// schemas/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string()
    .min(1, 'Usuario requerido')
    .max(50, 'Usuario muy largo'),
  password: z.string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres'),
});

// schemas/stops.ts
export const addStopSchema = z.object({
  name: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre muy largo'),
  address: z.string()
    .min(5, 'Dirección debe tener al menos 5 caracteres')
    .max(200, 'Dirección muy larga'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  students: z.array(z.object({
    name: z.string()
      .min(2, 'Nombre debe tener al menos 2 caracteres')
      .max(100, 'Nombre muy largo')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Solo letras y espacios'),
    grade: z.string().optional(),
    parentPhone: z.string().optional(),
  })).min(1, 'Debe agregar al menos un estudiante'),
});

// schemas/incidents.ts
export const incidentSchema = z.object({
  type: z.enum(['high_traffic', 'road_closed', 'breakdown', 'weather', 'custom']),
  description: z.string().max(500).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  estimatedDelay: z.number().min(0).max(180).optional(),
}).refine(
  data => data.type !== 'custom' || (data.description && data.description.length > 0),
  { message: 'Descripción requerida para incidentes personalizados', path: ['description'] }
);

// schemas/location.ts
export const locationUpdateSchema = z.object({
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  accuracy: z.number().positive(),
  speed: z.number().min(0).max(200).optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.string().datetime(),
});

// schemas/routes.ts
export const createRouteSchema = z.object({
  name: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre muy largo'),
  direction: z.enum(['to_school', 'from_school'], {
    errorMap: () => ({ message: 'Debe especificar dirección de ruta' })
  }),
  shift: z.enum(['morning', 'afternoon'], {
    errorMap: () => ({ message: 'Debe especificar jornada' })
  }),
  driverId: z.string().uuid('ID de conductor inválido'),
  busId: z.string().uuid('ID de bus inválido'),
  coordinatorId: z.string().uuid().optional(),
  schedule: z.object({
    type: z.enum(['school_calendar', 'specific_weekdays', 'specific_months', 'custom']),
    weekdays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])).optional(),
    months: z.array(z.number().min(1).max(12)).optional(),
    customDates: z.array(z.string().datetime()).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).refine(
    data => {
      if (data.type === 'specific_weekdays') return data.weekdays && data.weekdays.length > 0;
      if (data.type === 'specific_months') return data.months && data.months.length > 0;
      if (data.type === 'custom') return data.customDates && data.customDates.length > 0;
      return true;
    },
    { message: 'Configuración de programación incompleta' }
  ),
  estimatedStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  estimatedEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  stops: z.array(z.object({
    name: z.string().min(3).max(100),
    address: z.string().min(5).max(200),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    isTerminal: z.boolean(),
  })).optional(),
});

export const validateAvailabilitySchema = z.object({
  date: z.string().datetime(),
  shift: z.enum(['morning', 'afternoon']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  driverId: z.string().uuid().optional(),
  busId: z.string().uuid().optional(),
  coordinatorId: z.string().uuid().optional(),
});

// schemas/students.ts
export const addStudentSchema = z.object({
  name: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre muy largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Solo letras y espacios'),
  grade: z.string().optional(),
  parentPhone: z.string()
    .regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, 'Teléfono inválido')
    .optional(),
  photo: z.string().url().optional(),
});

export const updateStudentStatusSchema = z.object({
  status: z.enum(['picked', 'dropped', 'absent']),
  notes: z.string().max(200).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});
```

---

## Códigos de Error HTTP

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos para la operación |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto de estado (ej: ruta ya iniciada) |
| 422 | Unprocessable Entity | Validación fallida |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

---

## Headers Requeridos

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
X-App-Version: 1.0.0
X-Device-ID: <unique_device_id>
```

---

## Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| POST /auth/login | 5 req | 15 min |
| POST /location/update | 60 req | 1 min |
| GET /bus-location | 30 req | 1 min |
| Otros | 100 req | 1 min |

---

## WebSocket Events (Para tiempo real)

```typescript
// Eventos del servidor al cliente
interface ServerEvents {
  'bus:location': {
    routeId: string;
    coordinates: { lat: number; lng: number };
    heading: number;
    speed: number;
  };
  
  'bus:approaching': {
    stopId: string;
    etaMinutes: number;
    distanceMeters: number;
  };
  
  'student:status': {
    studentId: string;
    status: 'picked' | 'dropped' | 'absent';
    timestamp: string;
  };
  
  'route:status': {
    routeId: string;
    status: 'not_started' | 'in_progress' | 'completed';
  };
  
  'incident:reported': {
    type: string;
    description: string;
    estimatedDelay: number;
  };
}

// Eventos del cliente al servidor
interface ClientEvents {
  'subscribe:route': { routeId: string };
  'unsubscribe:route': { routeId: string };
}
```
