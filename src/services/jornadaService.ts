import { ParametrosJornada, EmpleadoJornada, JornadaLaboral, EstadisticasEmpleado, RegistroEmpleado } from '../models';
import { apiRequest } from './api';

export const jornadaService = {
  async getParametrosJornada(): Promise<ParametrosJornada[]> {
    return apiRequest<ParametrosJornada[]>('/api/parametros-jornada');
  },

  async createParametrosJornada(data: Omit<ParametrosJornada, 'id' | 'fecha_creacion'>): Promise<ParametrosJornada> {
    return apiRequest<ParametrosJornada>('/api/parametros-jornada', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateParametrosJornada(id: number, data: Partial<ParametrosJornada>): Promise<ParametrosJornada> {
    return apiRequest<ParametrosJornada>(`/api/parametros-jornada/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteParametrosJornada(id: number): Promise<void> {
    return apiRequest<void>(`/api/parametros-jornada/${id}`, {
      method: 'DELETE'
    });
  },

  async getEmpleadoJornada(): Promise<EmpleadoJornada[]> {
    const response = await apiRequest<{ data: EmpleadoJornada[] }>('/api/empleado-jornada');
    return response.data;
  },

  async assignJornadaToEmpleado(data: Omit<EmpleadoJornada, 'id' | 'fecha_asignacion'>): Promise<EmpleadoJornada> {
    return apiRequest<EmpleadoJornada>('/api/empleado-jornada', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getJornadas(): Promise<{
    jornadas: JornadaLaboral[];
    estadisticas: Record<string, EstadisticasEmpleado>;
    asignaciones_jornada: EmpleadoJornada[];
  }> {
    return apiRequest<{
      jornadas: JornadaLaboral[];
      estadisticas: Record<string, EstadisticasEmpleado>;
      asignaciones_jornada: EmpleadoJornada[];
    }>('/api/jornadas');
  },

  async getRegistroJornada(fechaInicio?: string, fechaFin?: string): Promise<{
    data: RegistroEmpleado[];
  }> {
    let queryParams = '';
    if (fechaInicio && fechaFin) {
      queryParams = `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    
    return apiRequest<{
      data: RegistroEmpleado[];
    }>(`/api/jornadas/registro${queryParams}`);
  },

  async getEstadisticas(): Promise<{
    estadisticas: Record<string, EstadisticasEmpleado>;
  }> {
    return apiRequest<{
      estadisticas: Record<string, EstadisticasEmpleado>;
    }>('/api/jornadas/estadisticas');
  },

  async getLlegadasTarde(): Promise<{
    llegadas_tarde: any[];
  }> {
    return apiRequest<{
      llegadas_tarde: any[];
    }>('/api/jornadas/llegadas-tarde');
  }
};