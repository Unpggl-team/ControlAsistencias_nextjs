"use client";
import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ParametrosJornada {
  hora_entrada_esperada: string;
  hora_salida_esperada: string;
  tolerancia_minutos: number;
  horas_laborales: number;
  tiempo_minimo_almuerzo: number;
}

interface JornadaLaboral {
  id_empleado: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  llegadaTarde: boolean;
  salidaTemprana: boolean;
  minutos_tarde: number;
  minutos_temprano: number;
  horas_trabajadas: number;
  cumple_jornada: boolean;
}

interface EstadisticasEmpleado {
  id_empleado: number;
  total_llegadas_tarde: number;
  total_salidas_temprano: number;
  total_minutos_tarde: number;
  total_minutos_temprano: number;
  promedio_horas_trabajadas: number;
  dias_trabajados: number;
  dias_jornada_completa: number;
}

const ProtectedComponent = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [jornadas, setJornadas] = useState<JornadaLaboral[]>([]);
  const [estadisticas, setEstadisticas] = useState<Record<number, EstadisticasEmpleado>>({});
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [parametrosJornada, setParametrosJornada] = useState<ParametrosJornada | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/jornadas');
        const data = await response.json();
        setJornadas(data.jornadas);
        setEstadisticas(data.estadisticas);
        setEmpleados(data.empleados);
        setParametrosJornada(data.parametros_jornada);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };

    fetchData();
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DefaultLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-black dark:text-white">
          ¡Bienvenido, {user?.nombres}!
        </h2>
      </div>
      <ECommerce />
      <main className="p-8">
        {/* Parámetros de Jornada */}
        {parametrosJornada && (
          <div className="mb-8 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Parámetros de Jornada Actual</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="font-semibold">Hora de entrada:</p>
                <p>{parametrosJornada.hora_entrada_esperada}</p>
              </div>
              <div>
                <p className="font-semibold">Hora de salida:</p>
                <p>{parametrosJornada.hora_salida_esperada}</p>
              </div>
              <div>
                <p className="font-semibold">Tolerancia:</p>
                <p>{parametrosJornada.tolerancia_minutos} minutos</p>
              </div>
              <div>
                <p className="font-semibold">Horas laborales:</p>
                <p>{parametrosJornada.horas_laborales} horas</p>
              </div>
              <div>
                <p className="font-semibold">Tiempo mínimo almuerzo:</p>
                <p>{parametrosJornada.tiempo_minimo_almuerzo} minutos</p>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas por Empleado */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Estadísticas por Empleado</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Empleado</th>
                  <th className="px-4 py-2 border">Días Trabajados</th>
                  <th className="px-4 py-2 border">Jornadas Completas</th>
                  <th className="px-4 py-2 border">Llegadas Tarde</th>
                  <th className="px-4 py-2 border">Salidas Temprano</th>
                  <th className="px-4 py-2 border">Total Minutos Tarde</th>
                  <th className="px-4 py-2 border">Total Minutos Temprano</th>
                  <th className="px-4 py-2 border">Promedio Horas</th>
                </tr>
              </thead>
              <tbody>
                {empleados && empleados.length > 0 ? (
                  empleados.map((empleado) => {
                    const stats = estadisticas[empleado.id] || {
                      dias_trabajados: 0,
                      dias_jornada_completa: 0,
                      total_llegadas_tarde: 0,
                      total_salidas_temprano: 0,
                      total_minutos_tarde: 0,
                      total_minutos_temprano: 0,
                      promedio_horas_trabajadas: 0
                    };

                    return (
                      <tr key={empleado.id}>
                        <td className="px-4 py-2 border">{empleado.nombre}</td>
                        <td className="px-4 py-2 border text-center">{stats.dias_trabajados}</td>
                        <td className="px-4 py-2 border text-center">{stats.dias_jornada_completa}</td>
                        <td className="px-4 py-2 border text-center">{stats.total_llegadas_tarde}</td>
                        <td className="px-4 py-2 border text-center">{stats.total_salidas_temprano}</td>
                        <td className="px-4 py-2 border text-center">{stats.total_minutos_tarde}</td>
                        <td className="px-4 py-2 border text-center">{stats.total_minutos_temprano}</td>
                        <td className="px-4 py-2 border text-center">
                          {stats.promedio_horas_trabajadas.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-2 text-center">
                      No hay datos de empleados disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registro de Jornadas */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Registro de Jornadas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Empleado</th>
                  <th className="px-4 py-2 border">Fecha</th>
                  <th className="px-4 py-2 border">Entrada</th>
                  <th className="px-4 py-2 border">Salida</th>
                  <th className="px-4 py-2 border">Estado</th>
                  <th className="px-4 py-2 border">Minutos Tarde</th>
                  <th className="px-4 py-2 border">Minutos Temprano</th>
                  <th className="px-4 py-2 border">Horas Trabajadas</th>
                </tr>
              </thead>
              <tbody>
                {jornadas && jornadas.length > 0 ? (
                  jornadas.map((jornada, index) => {
                    const empleado = empleados?.find(e => e.id === jornada.id_empleado);
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 border">{empleado?.nombre || 'N/A'}</td>
                        <td className="px-4 py-2 border">{jornada.fecha}</td>
                        <td className="px-4 py-2 border">{jornada.hora_entrada}</td>
                        <td className="px-4 py-2 border">{jornada.hora_salida}</td>
                        <td className="px-4 py-2 border">
                          <div className="flex flex-col">
                            {jornada.llegadaTarde && (
                              <span className="text-red-500">Llegada Tarde</span>
                            )}
                            {jornada.salidaTemprana && (
                              <span className="text-orange-500">Salida Temprana</span>
                            )}
                            {jornada.cumple_jornada && (
                              <span className="text-green-500">Jornada Completa</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 border text-center">{jornada.minutos_tarde}</td>
                        <td className="px-4 py-2 border text-center">{jornada.minutos_temprano}</td>
                        <td className="px-4 py-2 border text-center">{jornada.horas_trabajadas}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-2 text-center">
                      No hay registros de jornadas disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

export default ProtectedComponent;
