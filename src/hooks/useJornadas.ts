import { useState, useEffect } from 'react';
import { JornadaLaboral, EstadisticasEmpleado, EmpleadoJornada, ParametrosJornada, Empleado } from '../models';
import { jornadaService, employeeService } from '../services';

export const useJornadas = () => {
  const [jornadas, setJornadas] = useState<JornadaLaboral[]>([]);
  const [estadisticas, setEstadisticas] = useState<Record<string, EstadisticasEmpleado>>({});
  const [asignacionesJornada, setAsignacionesJornada] = useState<EmpleadoJornada[]>([]);
  const [parametrosJornada, setParametrosJornada] = useState<ParametrosJornada[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jornadasData, parametrosData, empleadosData] = await Promise.all([
          jornadaService.getJornadas(),
          jornadaService.getParametrosJornada(),
          employeeService.getEmpleados()
        ]);

        setJornadas(jornadasData.jornadas);
        setEstadisticas(jornadasData.estadisticas);
        setAsignacionesJornada(jornadasData.asignaciones_jornada);
        setParametrosJornada(parametrosData);
        setEmpleados(empleadosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getParametrosJornada = (idEmpleado: number) => {
    const asignacion = asignacionesJornada.find(a => a.id_empleado === idEmpleado);
    return asignacion?.parametrosJornada;
  };

  return {
    jornadas,
    estadisticas,
    asignacionesJornada,
    parametrosJornada,
    empleados,
    loading,
    error,
    getParametrosJornada,
    refetch: () => {
      // Implementar refetch si es necesario
    }
  };
};