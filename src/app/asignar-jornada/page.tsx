'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { Toaster, toast } from 'react-hot-toast';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
type Departamento = {
  value: number;
  option: string;
};

type Empleado = {
  id: number;
  nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo: string;
  id_departamento: number;
  departamento?: string;
};

type ParametrosJornada = {
  id: number;
  hora_entrada_esperada: string;
  hora_salida_esperada: string;
  tolerancia_minutos: number;
  horas_laborales: number;
  activo: boolean;
  fecha_creacion: string;
};

type AsignacionJornada = {
  id: number;
  id_empleado: number;
  parametrosJornadaId: number;
  parametrosJornada: ParametrosJornada;
  activo: boolean;
};

export default function AsignarJornada() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [jornadas, setJornadas] = useState<ParametrosJornada[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionJornada[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmpleado, setSelectedEmpleado] = useState<number | null>(null);
  const [selectedJornada, setSelectedJornada] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtener empleados
const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
const empleadosResponse = await fetch('/api/lista_empleados', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
        if (!empleadosResponse.ok) throw new Error('Error al cargar los empleados');
        const empleadosData = await empleadosResponse.json();
        
        // Obtener departamentos
        const departamentosResponse = await fetch('/api/departamentos');
        if (!departamentosResponse.ok) throw new Error('Error al cargar los departamentos');
        const departamentosData = await departamentosResponse.json();
        setDepartamentos(departamentosData.data);

        // Obtener jornadas
        const jornadasResponse = await fetch('/api/parametros-jornada');
        if (!jornadasResponse.ok) throw new Error('Error al cargar las jornadas');
        const jornadasData = await jornadasResponse.json();
        
        // Obtener asignaciones existentes
        const asignacionesResponse = await fetch('/api/empleado-jornada');
        if (!asignacionesResponse.ok) throw new Error('Error al cargar las asignaciones');
        const asignacionesData = await asignacionesResponse.json();
        
        // Formatear empleados
        const empleadosFormateados = empleadosData.data.map((empleado: any) => {
          const departamento = departamentosData.data.find(
            (dep: Departamento) => dep.value === empleado.id_departamento
          );
          return {
            id: empleado.id,
            nombre: empleado.name,
            segundo_nombre: empleado.segundo_nombre,
            primer_apellido: empleado.primer_apellido,
            segundo_apellido: empleado.segundo_apellido,
            correo: empleado.correo,
            id_departamento: empleado.id_departamento,
            departamento: departamento ? departamento.option : 'No asignado'
          };
        });
        
        setEmpleados(empleadosFormateados);
        // Process jornadas data with the new structure
        const jornadasFormateadas = jornadasData.data ? 
          (Array.isArray(jornadasData.data) ? jornadasData.data : [jornadasData.data])
          .map((jornada: any) => ({
            id: jornada.id,
            hora_entrada_esperada: jornada.hora_entrada_esperada,
            hora_salida_esperada: jornada.hora_salida_esperada,
            tolerancia_minutos: jornada.tolerancia_minutos,
            horas_laborales: jornada.horas_laborales,
            activo: jornada.activo,
            fecha_creacion: jornada.fecha_creacion
          })) : [];
        setJornadas(jornadasFormateadas);
        setAsignaciones(asignacionesData.data || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Rest of the component remains the same
  const filteredEmpleados = empleados.filter((empleado) => {
    const searchTermLower = searchTerm.toLowerCase();
    const fullName = `${empleado.nombre || ''} ${empleado.segundo_nombre || ''} ${empleado.primer_apellido || ''} ${empleado.segundo_apellido || ''}`.toLowerCase();
    const nombres = (empleado.nombre || '').toLowerCase();
    const segundoNombre = (empleado.segundo_nombre || '').toLowerCase();
    const primerApellido = (empleado.primer_apellido || '').toLowerCase();
    const segundoApellido = (empleado.segundo_apellido || '').toLowerCase();
    const departamento = (empleado.departamento || '').toLowerCase();

    return fullName.includes(searchTermLower) || 
           nombres.includes(searchTermLower) ||
           segundoNombre.includes(searchTermLower) ||
           primerApellido.includes(searchTermLower) ||
           segundoApellido.includes(searchTermLower) ||
           departamento.includes(searchTermLower);
  });
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmpleados = filteredEmpleados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmpleados.length / itemsPerPage);
  
  const getJornadaAsignada = (empleadoId: number) => {
    const asignacion = asignaciones.find(a => a.id_empleado === empleadoId && a.activo);
    if (asignacion && asignacion.parametrosJornada) {
      return {
        ...asignacion.parametrosJornada,
        hora_entrada_esperada: asignacion.parametrosJornada.hora_entrada_esperada,
        hora_salida_esperada: asignacion.parametrosJornada.hora_salida_esperada,
        tolerancia_minutos: asignacion.parametrosJornada.tolerancia_minutos
      };
    }
    return null;
  };
  
  const asignarJornada = async () => {
    if (!selectedEmpleado || !selectedJornada) {
      toast.error('Debe seleccionar un empleado y una jornada');
      return;
    }
    
    try {
      const response = await fetch('/api/empleado-jornada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_empleado: selectedEmpleado,
          parametrosJornadaId: selectedJornada
        }),
      });
      
      if (!response.ok) throw new Error('Error al asignar jornada');
      
      const data = await response.json();
      
      setAsignaciones(prev => {
        const filtered = prev.filter(a => a.id_empleado !== selectedEmpleado);
        return [...filtered, data.data];
      });
      
      toast.success('Jornada asignada correctamente');
      setSelectedEmpleado(null);
      setSelectedJornada(null);
    } catch (error) {
      console.error('Error al asignar jornada:', error);
      toast.error('Error al asignar la jornada');
    }
  };
  
  return (
    <DefaultLayout>
      <div className="flex flex-col gap-10">
        <Breadcrumb pageName="Asignar Jornadas" />
        <Toaster position="top-right" />
        
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="p-4 sm:p-6 xl:p-7.5">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h5 className="text-xl font-semibold text-black dark:text-white">
                Asignación de Jornadas a Empleados
              </h5>
              
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Buscar empleados..."
                  className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-2.5">
                  <svg
                    className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                      fill=""
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                      fill=""
                    />
                  </svg>
                </span>
              </div>
            </div>
            
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">
                  Seleccionar Jornada
                </label>
                <select
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  value={selectedJornada || ''}
                  onChange={(e) => setSelectedJornada(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Seleccione una jornada</option>
                  {jornadas.map((jornada) => (
                    <option key={jornada.id} value={jornada.id}>
                      ID: {jornada.id} | Entrada: {jornada.hora_entrada_esperada} | Salida: {jornada.hora_salida_esperada} | Tolerancia: {jornada.tolerancia_minutos} min | Horas: {jornada.horas_laborales} | Creado: {new Date(jornada.fecha_creacion).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  className="inline-flex items-center justify-center rounded-md bg-primary py-3 px-6 sm:px-10 text-center font-medium text-white hover:bg-opacity-90 w-full md:w-auto"
                  onClick={asignarJornada}
                  disabled={!selectedEmpleado || !selectedJornada}
                >
                  Asignar Jornada
                </button>
              </div>
            </div>
            
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[800px] rounded-lg">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="min-w-[200px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                        Empleado
                      </th>
                      <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                        Departamento
                      </th>
                      <th className="min-w-[250px] py-4 px-4 font-medium text-black dark:text-white">
                        Jornada Asignada
                      </th>
                      <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="border-b border-[#eee] py-5 px-4 text-center dark:border-strokedark">
                          Cargando datos...
                        </td>
                      </tr>
                    ) : currentEmpleados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="border-b border-[#eee] py-5 px-4 text-center dark:border-strokedark">
                          No hay empleados que coincidan con la búsqueda
                        </td>
                      </tr>
                    ) : (
                      currentEmpleados.map((empleado) => {
                        const jornadaAsignada = getJornadaAsignada(empleado.id);
                        
                        return (
                          <tr key={empleado.id}>
                            <td className="border-b border-[#eee] py-5 px-4 pl-9 xl:pl-11 dark:border-strokedark">
                              <h5 className="font-medium text-black dark:text-white break-words">
                                {empleado.nombre} {empleado.segundo_nombre} {empleado.primer_apellido} {empleado.segundo_apellido || ''}
                              </h5>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white break-words">{empleado.departamento}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              {jornadaAsignada ? (
                                <p className="text-black dark:text-white break-words">
                                  Entrada: {jornadaAsignada.hora_entrada_esperada} - Salida: {jornadaAsignada.hora_salida_esperada}
                                </p>
                              ) : (
                                <p className="text-meta-1">Sin jornada asignada</p>
                              )}
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <button
                                className={`inline-flex items-center justify-center rounded-md ${
                                  selectedEmpleado === empleado.id ? 'bg-success' : 'bg-primary'
                                } py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 w-full sm:w-auto`}
                                onClick={() => setSelectedEmpleado(empleado.id)}
                              >
                                {selectedEmpleado === empleado.id ? 'Seleccionado' : 'Seleccionar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 overflow-x-auto">
                <nav className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-boxdark dark:border-strokedark dark:text-white"
                  >
                    Anterior
                  </button>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-boxdark dark:border-strokedark dark:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-boxdark dark:border-strokedark dark:text-white"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}