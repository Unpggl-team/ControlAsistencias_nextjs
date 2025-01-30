"use client";
import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import ChartOne from "../Charts/ChartOne";
import ChartTwo from "../Charts/ChartTwo";
import ChatCard from "../Chat/ChatCard";
import TableOne from "../Tables/TableOne";
import CardDataStats from "../CardDataStats";
import { FaUsers, FaEye, FaShoppingCart, FaBox, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import JornadasTable from "@/app/components/JornadasTable";

interface ParametrosJornada {
  hora_entrada_esperada: string;
  hora_salida_esperada: string;
  tolerancia_minutos: number;
  horas_laborales: number;
}

interface JornadaLaboral {
  id_empleado: number;
  nombre_empleado: string;
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
  nombre_empleado: string;
  total_llegadas_tarde: number;
  total_salidas_temprano: number;
  total_minutos_tarde: number;
  total_minutos_temprano: number;
  promedio_horas_trabajadas: number;
  dias_trabajados: number;
  dias_jornada_completa: number;
}

const MapOne = dynamic(() => import("@/components/Maps/MapOne"), {
  ssr: false,
});

const ChartThree = dynamic(() => import("@/components/Charts/ChartThree"), {
  ssr: false,
});

const ECommerce: React.FC = () => {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [jornadas, setJornadas] = useState<JornadaLaboral[]>([]);
  const [estadisticas, setEstadisticas] = useState<Record<string, EstadisticasEmpleado>>({});
  const [parametrosJornada, setParametrosJornada] = useState<ParametrosJornada | null>(null);
  const [llegadasTardeHoy, setLlegadasTardeHoy] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empleadosRes, jornadasRes] = await Promise.all([
          fetch('/api/lista_empleados'),
          fetch('/api/jornadas')
        ]);

        if (!empleadosRes.ok || !jornadasRes.ok) {
          throw new Error('Error al obtener datos');
        }

        const empleadosData = await empleadosRes.json();
        const jornadasData = await jornadasRes.json();

        setEmpleados(empleadosData.data);
        setJornadas(jornadasData.jornadas);
        setEstadisticas(jornadasData.estadisticas);
        setParametrosJornada(jornadasData.parametros_jornada);
        setLlegadasTardeHoy(jornadasData.llegadasTardeHoy);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, []);

  const totalMinutosTarde = Object.values(estadisticas).reduce(
    (total, emp) => total + emp.total_minutos_tarde, 
    0
  );

  const totalSalidasTempranas = Object.values(estadisticas).reduce(
    (total, emp) => total + emp.total_salidas_temprano,
    0
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats 
          title="Total Empleados" 
          total={empleados.length.toString()} 
          rate="Activos" 
          levelUp
        >
          <FaUsers className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>

        <CardDataStats 
          title="Llegadas Tarde Hoy" 
          total={llegadasTardeHoy.toString()} 
          rate="Empleados" 
          levelDown={llegadasTardeHoy > 0}
        >
          <FaClock className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>

        <CardDataStats 
          title="Total Minutos Tarde" 
          total={totalMinutosTarde.toString()} 
          rate="Minutos" 
          levelDown
        >
          <FaExclamationTriangle className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>

        <CardDataStats 
          title="Salidas Tempranas" 
          total={totalSalidasTempranas.toString()} 
          rate="Total" 
          levelDown
        >
          <FaUsers className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
          <JornadasTable />
        </div>
        {/*<ChartOne />
        <ChartTwo />
        <ChartThree />
        <MapOne />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
        <ChatCard />*/}
      </div>
    </>
  );
};

export default ECommerce;
