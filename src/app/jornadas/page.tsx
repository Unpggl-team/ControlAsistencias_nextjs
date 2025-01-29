'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';

interface Jornada {
  id_empleado: number;
  nombre_empleado: string;
  hora_entrada: string;
  hora_salida: string;
  horas_trabajadas: number;
  llegada_tarde: boolean;
}

export default function JornadasPage() {
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const obtenerJornadas = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/jornadas/registro?fecha=${fecha}`);
        const data = await response.json();
        setJornadas(data.jornadas);
      } catch (error) {
        console.error('Error al obtener jornadas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    obtenerJornadas();
  }, [fecha]);

  return (
    <>
      <Breadcrumb pageName="Control de Jornadas" />
      
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Jornadas Laborales
          </h2>
          <div className="relative">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="custom-input-date custom-input-date-1 w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="grid grid-cols-6 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-6">
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">ID</h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">Nombre</h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">Entrada</h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">Salida</h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">Horas</h5>
            </div>
            <div className="p-2.5 text-center xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">Estado</h5>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : (
            jornadas.map((jornada) => (
              <div
                className="grid grid-cols-6 border-b border-stroke dark:border-strokedark sm:grid-cols-6"
                key={jornada.id_empleado}
              >
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">{jornada.id_empleado}</p>
                </div>
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">{jornada.nombre_empleado}</p>
                </div>
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-black dark:text-white">{jornada.hora_entrada}</p>
                </div>
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-meta-3">{jornada.hora_salida || 'No registrada'}</p>
                </div>
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <p className="text-meta-5">{jornada.horas_trabajadas.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-center p-2.5 xl:p-5">
                  <span
                    className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                      jornada.llegada_tarde
                        ? 'bg-danger text-danger'
                        : 'bg-success text-success'
                    }`}
                  >
                    {jornada.llegada_tarde ? 'Llegada Tarde' : 'A tiempo'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
} 