import { useState, useEffect } from 'react';

interface Empleado {
    id: number;
    name: string;
    primer_apellido: string;
}

interface JornadaLaboral {
    id_empleado: number;
    fecha: string;
    hora_entrada: string;
    hora_salida: string;
    llegadaTarde: boolean;
    minutos_tarde: number;
    horas_trabajadas: number;
}

interface EstadisticasEmpleado {
    id_empleado: number;
    total_llegadas_tarde: number;
    total_minutos_tarde: number;
    promedio_horas_trabajadas: number;
    dias_trabajados: number;
}

const JornadasTable = () => {
    const [jornadas, setJornadas] = useState<JornadaLaboral[]>([]);
    const [jornadasFiltradas, setJornadasFiltradas] = useState<JornadaLaboral[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [estadisticas, setEstadisticas] = useState<Record<number, EstadisticasEmpleado>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Obtener primer y último día del mes actual
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const [fechaInicio, setFechaInicio] = useState(primerDiaMes.toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(ultimoDiaMes.toISOString().split('T')[0]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener jornadas
                const jornadasResponse = await fetch('/api/jornadas');
                if (!jornadasResponse.ok) throw new Error('Error al cargar las jornadas');
                const jornadasData = await jornadasResponse.json();
                
                // Obtener empleados
                const empleadosResponse = await fetch('/api/lista_empleados');
                if (!empleadosResponse.ok) throw new Error('Error al cargar los empleados');
                const empleadosData = await empleadosResponse.json();
                
                setJornadas(jornadasData.jornadas);
                setJornadasFiltradas(jornadasData.jornadas);
                setEmpleados(empleadosData.data);
                setEstadisticas(jornadasData.estadisticas);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        filtrarJornadas();
    }, [fechaInicio, fechaFin, jornadas]);

    const filtrarJornadas = () => {
        let jornadasTemp = [...jornadas];

        if (fechaInicio) {
            jornadasTemp = jornadasTemp.filter(jornada => 
                new Date(jornada.fecha) >= new Date(fechaInicio)
            );
        }

        if (fechaFin) {
            jornadasTemp = jornadasTemp.filter(jornada => 
                new Date(jornada.fecha) <= new Date(fechaFin)
            );
        }

        setJornadasFiltradas(jornadasTemp);
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Control de Jornadas Laborales</h1>
            
            {/* Filtros de fecha */}
            <div className="mb-6 flex gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Inicio
                    </label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Fin
                    </label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>
            </div>
            
            {/* Tabla de Jornadas */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2">Empleado</th>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Entrada</th>
                            <th className="px-4 py-2">Salida</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Minutos Tarde</th>
                            <th className="px-4 py-2">Horas Trabajadas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jornadasFiltradas.map((jornada, index) => {
                            const empleado = empleados.find(e => e.id === jornada.id_empleado);
                            return (
                                <tr key={index} className={`${jornada.llegadaTarde ? 'bg-red-50' : ''}`}>
                                    <td className="px-4 py-2">{empleado ? `${empleado.name} ${empleado.primer_apellido}` : jornada.id_empleado}</td>
                                    <td className="px-4 py-2">{jornada.fecha}</td>
                                    <td className="px-4 py-2">{jornada.hora_entrada}</td>
                                    <td className="px-4 py-2">{jornada.hora_salida}</td>
                                    <td className="px-4 py-2">
                                        {jornada.llegadaTarde ? 
                                            <span className="text-red-500">Tarde</span> : 
                                            <span className="text-green-500">A tiempo</span>
                                        }
                                    </td>
                                    <td className="px-4 py-2">{jornada.minutos_tarde}</td>
                                    <td className="px-4 py-2">{jornada.horas_trabajadas}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Estadísticas por Empleado */}
            <h2 className="text-xl font-bold mt-8 mb-4">Estadísticas por Empleado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(estadisticas).map((stat) => {
                    const empleado = empleados.find(e => e.id === stat.id_empleado);
                    return (
                        <div key={stat.id_empleado} className="bg-white p-4 rounded-lg shadow">
                            <h3 className="font-bold mb-2">
                                {empleado ? `${empleado.name} ${empleado.primer_apellido}` : `Empleado ${stat.id_empleado}`}
                            </h3>
                            <ul>
                                <li>Llegadas tarde: {stat.total_llegadas_tarde}</li>
                                <li>Total minutos tarde: {stat.total_minutos_tarde}</li>
                                <li>Promedio horas trabajadas: {stat.promedio_horas_trabajadas.toFixed(2)}</li>
                                <li>Días trabajados: {stat.dias_trabajados}</li>
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JornadasTable;