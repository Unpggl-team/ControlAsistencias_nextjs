'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { BsCalendar3 } from 'react-icons/bs';
import DatePickerOne from '@/components/FormElements/DatePicker/DatePickerOne';

interface Empleado {
  id: number;
  nombre: string;
  cedula: string;
  id_departamento: number;
  id_cargo: string;
}

interface Registro {
  empleado: Empleado;
  fecha: string;
  entrada: {
    hora: string;
    fecha: string;
  } | null;
  salida: {
    hora: string;
    fecha: string;
  } | null;
  estado: string;
  minutosTarde?: number;
  horasLaboradas?: string;
}

export default function JornadasPage() {
  const fechaActual = new Date(new Date().getTime() - 6 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fecha, setFecha] = useState<string>(fechaActual);
  const [registros, setRegistros] = useState<Registro[]>([]);
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
        const response = await fetch(`/api/jornadas/registro?fecha=${fecha}`);
        const data = await response.json();
        
        const registrosConCalculos = data.data.map((registro: Registro) => {
          let minutosTarde = 0;
          let horasLaboradas = '';
          
          if (registro.entrada) {
            minutosTarde = calcularMinutosTarde(registro.entrada.hora);
            if (registro.salida) {
              horasLaboradas = calcularHorasLaboradas(registro.entrada.hora, registro.salida.hora);
            }
          }
          
          return {
            ...registro,
            minutosTarde,
            horasLaboradas
          };
        });
        
        setRegistros(registrosConCalculos);
      } catch (error) {
        console.error('Error al obtener registros:', error);
      } finally {
        setIsLoading(false);
      }
    };

    obtenerRegistros();
  }, [fecha]);

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Control de Jornadas" />
      
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Jornadas Laborales
          </h2>
          <div className="relative flex items-center w-72">
            <DatePickerOne 
              selectedDate={fecha}
              onDateChange={(newDate) => setFecha(newDate)}
            />
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
              ) : Array.isArray(registros) && registros.length > 0 ? (
                registros.map((registro) => (
                  <tr
                    className="border-b border-stroke dark:border-strokedark"
                    key={registro.empleado.id}
                  >
                    <td className="p-2.5 text-center xl:p-5">
                      <p className="text-black dark:text-white">{registro.empleado.id}</p>
                    </td>
                    <td className="p-2.5 text-center xl:p-5">
                      <p className="text-black dark:text-white">{registro.empleado.nombre}</p>
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
                            : 'bg-warning text-warning'
                        }`}
                      >
                        {registro.estado}
                      </span>
                    </td>
                    <td className="p-2.5 text-center xl:p-5">
                      <p className={`text-sm ${registro.minutosTarde ? 'text-danger' : 'text-success'}`}>
                        {registro.minutosTarde ? `${registro.minutosTarde}m tarde` : 'A tiempo'}
                      </p>
                    </td>
                    <td className="p-2.5 text-center xl:p-5">
                      <p className="text-black dark:text-white">
                        {registro.horasLaboradas || '-'}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="flex justify-center items-center h-40">
                      <p className="text-gray-500">No hay registros para esta fecha</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DefaultLayout>
  );
}