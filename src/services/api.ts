import { Empleado, Cargo, Departamento, ParametrosJornada, EmpleadoJornada, JornadaLaboral, EstadisticasEmpleado } from '../models';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const PROYECTO_API_URL = process.env.NEXT_PUBLIC_PROYECTO_URL_API || '';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getAuthHeaders = (): HeadersInit => {
  const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const token = user ? JSON.parse(user).token : null;

  if (!token) {
    throw new ApiError('No se encontró token de autenticación');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`Error ${response.status}: ${errorText}`, response.status);
  }

  return response.json();
};

export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers = getAuthHeaders();
  const config: RequestInit = {
    headers: { ...headers, ...options.headers },
    ...options
  };

  const response = await fetch(url, config);
  return handleApiResponse<T>(response);
};