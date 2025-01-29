"use client";
import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import ChartOne from "../Charts/ChartOne";
import ChartTwo from "../Charts/ChartTwo";
import ChatCard from "../Chat/ChatCard";
import TableOne from "../Tables/TableOne";
import CardDataStats from "../CardDataStats";
import { FaUsers, FaEye, FaShoppingCart, FaBox } from 'react-icons/fa';
import JornadasTable from "@/app/components/JornadasTable";

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

const MapOne = dynamic(() => import("@/components/Maps/MapOne"), {
  ssr: false,
});

const ChartThree = dynamic(() => import("@/components/Charts/ChartThree"), {
  ssr: false,
});

const ECommerce: React.FC = () => {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [totalEmpleados, setTotalEmpleados] = useState<string>("");
  const [jornadas, setJornadas] = useState<JornadaLaboral[]>([]);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const response = await fetch('/api/lista_empleados');
        if (!response.ok) {
          throw new Error('Error al obtener empleados');
        }
        const data = await response.json();
        setEmpleados(data.data);
       // console.log(data.data.length.toString());
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const fetchJornadas = async () => {
      try {
        const response = await fetch('/api/jornadas');
        if (!response.ok) {
          throw new Error('Error al obtener jornadas');
        }
        const data = await response.json();
        setJornadas(data.jornadas);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchEmpleados();
    fetchJornadas();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total views" total="$3.456K" rate="0.43%" levelUp>
          <FaEye className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>
        <CardDataStats title="Total Profit" total="$45,2K" rate="4.35%" levelUp>
          <FaShoppingCart className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>
        <CardDataStats title="Total Product" total="2.450" rate="2.59%" levelUp>
          <FaBox className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>
        
        <CardDataStats title="Total Empleados" total={empleados.length.toString()} rate="100%" levelUp>
          <FaUsers className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>

        <CardDataStats title="Llegadas Tarde Hoy" total={jornadas.filter(j => 
          j.llegadaTarde && 
          new Date(j.fecha).toDateString() === new Date().toDateString()
        ).length.toString()} rate="0%" levelUp>
          <FaUsers className="fill-primary dark:fill-white" size={22} />
        </CardDataStats>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
          <JornadasTable />
        </div>
        <ChartOne />
        <ChartTwo />
        <ChartThree />
        <MapOne />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
        <ChatCard />
      </div>
    </>
  );
};

export default ECommerce;
