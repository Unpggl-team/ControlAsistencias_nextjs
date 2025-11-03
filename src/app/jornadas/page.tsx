'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { RegistroEmpleado } from '../../models';
import { jornadaService } from '../../services';

interface RegistroExtendido extends RegistroEmpleado {
  minutosTarde?: number;
  horasLaboradas?: string;
  tiene_jornada_asignada?: boolean;
  estado: string;
}

export default function JornadasPage() {
  // Configurar rango del mes actual por defecto
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  
  const [fechaInicio, setFechaInicio] = useState<string>(primerDiaMes.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState<string>(ultimoDiaMes.toISOString().split('T')[0]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calcularMinutosTarde = (horaEntrada: string): number => {
    const [horas, minutos] = horaEntrada.split(':').map(Number);
    const entradaMinutos = horas * 60 + minutos;
    const horaLimite = 8 * 60; // 8:00 AM en minutos
    return entradaMinutos > horaLimite ? entradaMinutos - horaLimite : 0;
  };

  const calcularHorasLaboradas = (entrada: string, salida: string): string => {
    const [horasEntrada, minutosEntrada] = entrada.split(':').map(Number);
    const [horasSalida, minutosSalida] = salida.split(':').map(Number);
    
    const entradaMinutos = horasEntrada * 60 + minutosEntrada;
    const salidaMinutos = horasSalida * 60 + minutosSalida;
    
    const diferenciaMinutos = salidaMinutos - entradaMinutos; 
    const horas = Math.floor(diferenciaMinutos / 60);
    const minutos = diferenciaMinutos % 60;
    
    return `${horas}h ${minutos}m`;
  };

  useEffect(() => {
    const obtenerRegistros = async () => {
      setIsLoading(true);
      try {
        // Obtener token de autenticación
        const userdata = localStorage.getItem('user');
        const token = userdata ? JSON.parse(userdata).token : null;
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Obtener registros por rango de fechas y asignaciones de jornada usando servicios
        const [registrosData, asignacionesData] = await Promise.all([
          jornadaService.getRegistroJornada(fechaInicio, fechaFin),
          jornadaService.getEmpleadoJornada()
        ]);
        
        console.log('Datos de registros:', registrosData);
        console.log('Datos de asignaciones:', asignacionesData);
        console.log('Array de registros:', registrosData.data);
        console.log('Es array?', Array.isArray(registrosData.data));
        
        if (!registrosData.data || !Array.isArray(registrosData.data)) {
          console.warn('registrosData.data no es un array válido:', registrosData.data);
          setRegistros([]);
          return;
        }
        
        console.log('Tipo de asignacionesData:', typeof asignacionesData);
        console.log('Es array asignacionesData:', Array.isArray(asignacionesData));
        
        const registrosConCalculos = registrosData.data.map((registro: any) => {
          let minutosTarde = 0;
          let horasLaboradas = '';
          
          // Verificar si el empleado tiene jornada asignada
          // La API devuelve {data: [...]}
          const asignaciones = asignacionesData || [];
          const tieneJornadaAsignada = Array.isArray(asignaciones) && asignaciones.some(
            (asignacion: any) => {
              console.log(`Comparando empleado ${registro.empleado.id} con asignación ${asignacion.id_empleado}, activo: ${asignacion.activo}`);
              return asignacion.id_empleado === registro.empleado.id && asignacion.activo;
            }
          );
          
          console.log(`Empleado ${registro.empleado.id} (${registro.empleado.nombre}) tiene jornada asignada:`, tieneJornadaAsignada);
          
          if (registro.entrada && tieneJornadaAsignada) {
            minutosTarde = calcularMinutosTarde(registro.entrada.hora);
            if (registro.salida) {
              horasLaboradas = calcularHorasLaboradas(
                registro.entrada.hora,
                registro.salida.hora
              );
            }
          }
          
          return {
            ...registro,
            minutosTarde,
            horasLaboradas,
            tiene_jornada_asignada: tieneJornadaAsignada
          };
        });
        
        console.log('Registros con cálculos finales:', registrosConCalculos);
        setRegistros(registrosConCalculos);
      } catch (error) {
        console.error('Error al obtener registros:', error);
        setRegistros([]);
      } finally {
        setIsLoading(false);
      }
    };

    obtenerRegistros();
  }, [fechaInicio, fechaFin]);

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Control de Jornadas" />
      
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Jornadas Laborales
          </h2>
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-40 rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-40 rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 dark:bg-meta-4">
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">ID</h5>
                </th>
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">Nombre</h5>
                </th>
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">Entrada</h5>
                </th>
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">Salida</h5>
                </th>
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">Cédula</h5>
                </th>
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">Estado</h5>
                </th>
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">Tardanza</h5>
                </th>
                <th className="p-2.5 text-center xl:p-5">
                  <h5 className="text-sm font-medium uppercase xsm:text-base">Horas Lab.</h5>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex justify-center items-center h-40">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* Debug info - temporal */}
                  {process.env.NODE_ENV === 'development' && (
                    <tr>
                      <td colSpan={8} className="p-2 text-xs bg-gray-100">
                        Debug: registros={JSON.stringify(registros?.slice(0,1))} | length={registros?.length} | isArray={Array.isArray(registros)}
                      </td>
                    </tr>
                  )}
                  {registros && Array.isArray(registros) && registros.length > 0 ? (
                    registros.map((registro) => (
                      <tr
                        className="border-b border-stroke dark:border-strokedark"
                        key={registro.empleado.id}
                      >
                        <td className="p-2.5 text-center xl:p-5">
                          <p className="text-black dark:text-white">{registro.empleado.id}</p>
                        </td>
                        <td className="p-2.5 text-center xl:p-5">
                          <div className="flex flex-col items-center">
                            <p className="text-black dark:text-white">{registro.empleado.nombre}</p>
                            {!registro.tiene_jornada_asignada && (
                              <span className="text-warning text-sm">(Sin Jornada Asignada)</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-center xl:p-5">
                          <p className="text-black dark:text-white">
                            {registro.entrada ? registro.entrada.hora : 'No registrada'}
                          </p>
                        </td>
                        <td className="p-2.5 text-center xl:p-5">
                          <p className="text-meta-3">
                            {registro.salida ? registro.salida.hora : 'No registrada'}
                          </p>
                        </td>
                        <td className="p-2.5 text-center xl:p-5">
                          <p className="text-meta-5">{registro.empleado.cedula}</p>
                        </td>
                        <td className="p-2.5 text-center xl:p-5">
                          <span
                            className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                              registro.estado === 'Completo'
                                ? 'bg-success text-success'
                                : registro.entrada && !registro.salida
                                ? 'bg-info text-info'
                                : 'bg-warning text-warning'
                            }`}
                          >
                            {registro.estado === 'Completo'
                              ? 'Completo'
                              : registro.entrada && !registro.salida
                              ? 'En Jornada'
                              : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center xl:p-5">
                          <p className={`text-sm ${!registro.tiene_jornada_asignada ? 'text-warning' : registro.minutosTarde ? 'text-danger' : 'text-success'}`}>
                            {!registro.tiene_jornada_asignada ? 'N/A' : registro.minutosTarde ? `${registro.minutosTarde}m tarde` : 'A tiempo'}
                          </p>
                        </td>
                        <td className="p-2.5 text-center xl:p-5">
                          <p className="text-black dark:text-white">
                            {!registro.tiene_jornada_asignada ? 'N/A' : registro.horasLaboradas || '-'}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex justify-center items-center h-40">
                          <p className="text-gray-500">No hay registros para este rango de fechas</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DefaultLayout>
  );
}