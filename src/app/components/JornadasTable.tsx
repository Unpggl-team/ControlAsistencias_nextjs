import { useState, useEffect, useCallback } from 'react';
import { Empleado, JornadaLaboral, EstadisticasEmpleado, EmpleadoJornada } from '../../models';
import { useJornadas } from '../../hooks/useJornadas';

const JornadasTable = () => {
    const [jornadasFiltradas, setJornadasFiltradas] = useState<JornadaLaboral[]>([]);
    const { jornadas, estadisticas, asignacionesJornada, empleados, loading, error } = useJornadas();
    
    // Get first and last day of current month
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const [fechaInicio, setFechaInicio] = useState(primerDiaMes.toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(ultimoDiaMes.toISOString().split('T')[0]);


    const filtrarJornadas = useCallback(() => {
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
    }, [jornadas, fechaInicio, fechaFin]);

    useEffect(() => {
        filtrarJornadas();
    }, [filtrarJornadas]);

    // Get schedule parameters for an employee
    const getParametrosJornada = (id_empleado: number) => {
        const asignacion = asignacionesJornada.find(a => a.id_empleado === id_empleado);
        return asignacion?.parametrosJornada;
    };

    if (loading) return <div className="text-gray-900 dark:text-gray-100">Cargando...</div>;
    if (error) return <div className="text-red-600 dark:text-red-400">Error: {error}</div>;

    return (
        <div className="p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Control de Jornadas Laborales</h1>
            
            {/* Schedule Parameters */}
            {asignacionesJornada.length > 0 && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h2 className="text-lg font-semibold mb-2">Parámetros de Jornada por Empleado</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {asignacionesJornada.map((asignacion) => {
                            const empleado = Array.isArray(empleados) ? empleados.find(e => e.id === asignacion.id_empleado) : undefined;
                            return (
                                <div key={asignacion.id} className="border dark:border-gray-700 p-3 rounded bg-white dark:bg-gray-800">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{empleado?.name} {empleado?.segundo_nombre} {empleado?.primer_apellido} {empleado?.segundo_apellido}</h3>
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        <p>Entrada: {asignacion.parametrosJornada?.hora_entrada_esperada}</p>
                                        <p>Salida: {asignacion.parametrosJornada?.hora_salida_esperada}</p>
                                        <p>Tolerancia: {asignacion.parametrosJornada?.tolerancia_minutos} min</p>
                                        <p>Horas: {asignacion.parametrosJornada?.horas_laborales}</p>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha Inicio
                    </label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha Fin
                    </label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
            
            {/* Work Schedule Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Empleado</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Fecha</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Entrada</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Salida</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Estado</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Minutos Tarde</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Minutos Temprano</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Horas Trabajadas</th>
                            <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Cumple Jornada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jornadasFiltradas.map((jornada, index) => (
                            <tr key={index} className={`${jornada.llegadaTarde || jornada.salidaTemprana ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'} border-b dark:border-gray-700`}>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{jornada.nombre_empleado}</td>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{jornada.fecha}</td>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{jornada.hora_entrada}</td>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{jornada.hora_salida}</td>
                                <td className="px-4 py-2">
                                    {jornada.llegadaTarde && <span className="text-red-600 dark:text-red-400 block">Llegada Tarde</span>}
                                    {jornada.salidaTemprana && <span className="text-orange-600 dark:text-orange-400 block">Salida Temprana</span>}
                                    {!jornada.llegadaTarde && !jornada.salidaTemprana && <span className="text-green-600 dark:text-green-400">Normal</span>}
                                </td>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{jornada.minutos_tarde}</td>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{jornada.minutos_temprano}</td>
                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{jornada.horas_trabajadas.toFixed(2)}</td>
                                <td className="px-4 py-2">
                                    {jornada.cumple_jornada ? 
                                        <span className="text-green-600 dark:text-green-400">Sí</span> : 
                                        <span className="text-red-600 dark:text-red-400">No</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Employee Statistics */}
            <div className="mb-6 mt-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Estadísticas por Empleado</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Empleado</th>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Días Trabajados</th>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Días Completos</th>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Llegadas Tarde</th>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Salidas Temprano</th>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Total Min. Tarde</th>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Total Min. Temprano</th>
                                <th className="px-4 py-2 text-gray-900 dark:text-gray-100">Promedio Horas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(estadisticas).map((empleado) => (
                                <tr key={empleado.id_empleado} className="border-b dark:border-gray-700">
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.nombre_empleado}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.dias_trabajados}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.dias_jornada_completa}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.total_llegadas_tarde}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.total_salidas_temprano}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.total_minutos_tarde}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.total_minutos_temprano}</td>
                                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{empleado.promedio_horas_trabajadas.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(estadisticas).map((stat) => (
                    <div key={stat.id_empleado} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow dark:shadow-gray-700 border dark:border-gray-700">
                        <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">{stat.nombre_empleado}</h3>
                        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
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