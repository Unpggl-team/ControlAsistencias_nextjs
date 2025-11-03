import { useState, useEffect } from 'react';
import { Empleado, Cargo, Departamento } from '../models';
import { employeeService } from '../services';

export const useEmpleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empleadosData, cargosData, departamentosData] = await Promise.all([
          employeeService.getEmpleados(),
          employeeService.getCargos(),
          employeeService.getDepartamentos()
        ]);

        setEmpleados(empleadosData);
        setCargos(cargosData);
        setDepartamentos(departamentosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getNombreCargo = (id: string): string => {
    const cargo = cargos.find(c => c.id_cargo === id);
    return cargo ? cargo.cargo : id;
  };

  const getNombreDepartamento = (value: number): string | number => {
    if (!departamentos || departamentos.length === 0) return value;
    const departamento = departamentos.find(dep => dep.value === value);
    return departamento ? departamento.option : value;
  };

  return {
    empleados,
    cargos,
    departamentos,
    loading,
    error,
    getNombreCargo,
    getNombreDepartamento
  };
};