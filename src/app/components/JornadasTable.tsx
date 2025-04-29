import { useState, useEffect } from 'react';

interface Empleado {
    id: number;
    name: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
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

interface AsignacionJornada {
    id: number;
    id_empleado: number;
    parametrosJornadaId: number;
    fecha_asignacion: string;
    activo: boolean;
    parametrosJornada: {
        id: number;
        hora_entrada_esperada: string;
        hora_salida_esperada: string;
        tolerancia_minutos: number;
        horas_laborales: number;
        activo: boolean;
        fecha_creacion: string;
    };
}

const JornadasTable = () => {
    const [jornadas, setJornadas] = useState<JornadaLaboral[]>([]);
    const [jornadasFiltradas, setJornadasFiltradas] = useState<JornadaLaboral[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [estadisticas, setEstadisticas] = useState<Record<string, EstadisticasEmpleado>>({});
    const [asignacionesJornada, setAsignacionesJornada] = useState<AsignacionJornada[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Get first and last day of current month
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const [fechaInicio, setFechaInicio] = useState(primerDiaMes.toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(ultimoDiaMes.toISOString().split('T')[0]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get work schedules
                const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
                const jornadasResponse = await fetch('/api/jornadas', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!jornadasResponse.ok) throw new Error('Error al cargar las jornadas');
                const jornadasData = await jornadasResponse.json();
                
                // Get employees
                console.log(token); // Debugging statement

                if (!token) throw new Error('No se encontró el token en las cookies');
                const empleadosResponse = await fetch('/api/lista_empleados', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (!empleadosResponse.ok) throw new Error('Error al cargar los empleados');
                const empleadosData = await empleadosResponse.json();
                
                setJornadas(jornadasData.jornadas);
                setJornadasFiltradas(jornadasData.jornadas);
                setEmpleados(empleadosData.data);
                setEstadisticas(jornadasData.estadisticas);
                setAsignacionesJornada(jornadasData.asignaciones_jornada);
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
            jornadasTemp = jornadasTemp.filter(jornada => {
                const [dia, mes, año] = jornada.fecha.split('/');
                const fechaJornada = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
                return fechaJornada >= new Date(fechaInicio);
            });
        }

        if (fechaFin) {
            jornadasTemp = jornadasTemp.filter(jornada => {
                const [dia, mes, año] = jornada.fecha.split('/');
                const fechaJornada = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
                return fechaJornada <= new Date(fechaFin);
            });
        }

        setJornadasFiltradas(jornadasTemp);
    };

    // Get schedule parameters for an employee
    const getParametrosJornada = (id_empleado: number) => {
        const asignacion = asignacionesJornada.find(a => a.id_empleado === id_empleado);
        return asignacion?.parametrosJornada;
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Control de Jornadas Laborales</h1>
            
            {/* Schedule Parameters */}
            {asignacionesJornada.length > 0 && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Parámetros de Jornada por Empleado</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {asignacionesJornada.map((asignacion) => {
                            const empleado = empleados.find(e => e.id === asignacion.id_empleado);
                            return (
                                <div key={asignacion.id} className="border p-3 rounded">
                                    <h3 className="font-medium">{empleado?.name} {empleado?.segundo_nombre} {empleado?.primer_apellido} {empleado?.segundo_apellido}</h3>
                                    <div className="text-sm">
                                        <p>Entrada: {asignacion.parametrosJornada.hora_entrada_esperada}</p>
                                        <p>Salida: {asignacion.parametrosJornada.hora_salida_esperada}</p>
                                        <p>Tolerancia: {asignacion.parametrosJornada.tolerancia_minutos} min</p>
                                        <p>Horas: {asignacion.parametrosJornada.horas_laborales}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Date Filters */}
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
            
            {/* Work Schedule Table */}
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
                            <th className="px-4 py-2">Minutos Temprano</th>
                            <th className="px-4 py-2">Horas Trabajadas</th>
                            <th className="px-4 py-2">Cumple Jornada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jornadasFiltradas.map((jornada, index) => (
                            <tr key={index} className={`${jornada.llegadaTarde || jornada.salidaTemprana ? 'bg-red-50' : ''}`}>
                                <td className="px-4 py-2">{jornada.nombre_empleado}</td>
                                <td className="px-4 py-2">{jornada.fecha}</td>
                                <td className="px-4 py-2">{jornada.hora_entrada}</td>
                                <td className="px-4 py-2">{jornada.hora_salida}</td>
                                <td className="px-4 py-2">
                                    {jornada.llegadaTarde && <span className="text-red-500 block">Llegada Tarde</span>}
                                    {jornada.salidaTemprana && <span className="text-orange-500 block">Salida Temprana</span>}
                                    {!jornada.llegadaTarde && !jornada.salidaTemprana && <span className="text-green-500">Normal</span>}
                                </td>
                                <td className="px-4 py-2">{jornada.minutos_tarde}</td>
                                <td className="px-4 py-2">{jornada.minutos_temprano}</td>
                                <td className="px-4 py-2">{jornada.horas_trabajadas.toFixed(2)}</td>
                                <td className="px-4 py-2">
                                    {jornada.cumple_jornada ? 
                                        <span className="text-green-500">Sí</span> : 
                                        <span className="text-red-500">No</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Employee Statistics */}
            <div className="mb-6 mt-8">
                <h2 className="text-xl font-semibold mb-4">Estadísticas por Empleado</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2">Empleado</th>
                                <th className="px-4 py-2">Días Trabajados</th>
                                <th className="px-4 py-2">Días Completos</th>
                                <th className="px-4 py-2">Llegadas Tarde</th>
                                <th className="px-4 py-2">Salidas Temprano</th>
                                <th className="px-4 py-2">Total Min. Tarde</th>
                                <th className="px-4 py-2">Total Min. Temprano</th>
                                <th className="px-4 py-2">Promedio Horas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(estadisticas).map((empleado) => (
                                <tr key={empleado.id_empleado}>
                                    <td className="px-4 py-2">{empleado.nombre_empleado}</td>
                                    <td className="px-4 py-2">{empleado.dias_trabajados}</td>
                                    <td className="px-4 py-2">{empleado.dias_jornada_completa}</td>
                                    <td className="px-4 py-2">{empleado.total_llegadas_tarde}</td>
                                    <td className="px-4 py-2">{empleado.total_salidas_temprano}</td>
                                    <td className="px-4 py-2">{empleado.total_minutos_tarde}</td>
                                    <td className="px-4 py-2">{empleado.total_minutos_temprano}</td>
                                    <td className="px-4 py-2">{empleado.promedio_horas_trabajadas.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(estadisticas).map((stat) => (
                    <div key={stat.id_empleado} className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold mb-2">{stat.nombre_empleado}</h3>
                        <ul className="space-y-1">
                            <li>Llegadas tarde: {stat.total_llegadas_tarde}</li>
                            <li>Salidas temprano: {stat.total_salidas_temprano}</li>
                            <li>Total minutos tarde: {stat.total_minutos_tarde}</li>
                            <li>Total minutos temprano: {stat.total_minutos_temprano}</li>
                            <li>Promedio horas trabajadas: {stat.promedio_horas_trabajadas.toFixed(2)}</li>
                            <li>Días trabajados: {stat.dias_trabajados}</li>
                            <li>Días jornada completa: {stat.dias_jornada_completa}</li>
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JornadasTable;