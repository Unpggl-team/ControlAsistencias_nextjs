import { Empleado, Cargo, Departamento } from '../models';
import { apiRequest } from './api';

export const employeeService = {
  async getEmpleados(): Promise<Empleado[]> {
    const response = await apiRequest<{ data: Empleado[] }>('/api/lista_empleados');
    return response.data;
  },

  async getCargos(): Promise<Cargo[]> {
    const response = await apiRequest<{ data: Cargo[] }>('/api/obtenerCargos');
    return response.data;
  },

  async getDepartamentos(): Promise<Departamento[]> {
    const response = await apiRequest<{ data: Departamento[] }>('/api/departamentos');
    return response.data;
  },

  async registrarEntrada(idEmpleado: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/registrar_entrada', {
      method: 'POST',
      body: JSON.stringify({ id_empleado: idEmpleado })
    });
  },

  async registrarSalida(idEmpleado: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/registrar_salida', {
      method: 'POST',
      body: JSON.stringify({ id_empleado: idEmpleado })
    });
  }
};