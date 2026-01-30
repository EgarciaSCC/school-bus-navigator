// Mock users database for authentication
export interface MockUser {
  id: string;
  username: string;
  password: string; // In production, this would be hashed
  role: 'driver' | 'admin' | 'parent';
  name: string;
  email: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'driver-001',
    username: 'driver',
    password: 'Driver.1234',
    role: 'driver',
    name: 'Juan Pérez',
    email: 'driver@ncatransport.com',
  },
];
