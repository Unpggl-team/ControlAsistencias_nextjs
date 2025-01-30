import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Reutilizar la instancia global de PrismaClient
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma: PrismaClient = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Definir tipos estrictos
type PrismaGlobal = {
    prisma: PrismaClient | undefined;
}

interface Empleado {
    id: number;
    id_recintos: number;
    name: string;
    segundo_nombre: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
    inss: string;
    correo: string | null;
    telefono: string | null;
    direccion: string | null;
    numero_cuenta: string;
    cedula: string;
    id_grado: number;
    id_genero: number;
    id_centro_costo: number | null;
    fecha_inicio: string;
    id_cargo: number;
    id_categoria: number;
    id_departamento: number;
    salario: string;
}

interface Entrada {
    id_empleado: number;
    hora_entrada: Date;
    fecha_entrada: Date;
}

interface Salida {
    id_empleado: number;
    hora_salida: Date;
    fecha_salida: Date;
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

interface ParametrosJornada {
    hora_entrada_esperada: string;
    hora_salida_esperada: string;
    tolerancia_minutos: number;
    horas_laborales: number;
}

const globalForPrisma: PrismaGlobal = global as unknown as PrismaGlobal;

// Función para obtener nombre completo del empleado
function obtenerNombreCompleto(empleado: Empleado): string {
    const nombres = [empleado.name, empleado.segundo_nombre].filter(Boolean).join(' ');
    const apellidos = [empleado.primer_apellido, empleado.segundo_apellido].filter(Boolean).join(' ');
    return `${nombres} ${apellidos}`.trim();
}

// Función auxiliar para extraer la hora de un DateTime
function extraerHora(fechaHora: Date): string {
    const horaCompleta: string = fechaHora.toISOString().split('T')[1];
    return horaCompleta.split('.')[0]; // Obtiene HH:MM:SS
}

// Función auxiliar para formatear la fecha
function formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Bogota'
    });
}

export async function GET(): Promise<NextResponse> {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        // Obtener lista de empleados
        const empleadosResponse: Response = await fetch('http://localhost:3000/api/lista_empleados');
        if (!empleadosResponse.ok) {
            throw new Error('Error al obtener la lista de empleados');
        }
        
        const empleadosData = await empleadosResponse.json();
        if (!empleadosData || !empleadosData.data) {
            throw new Error('Datos de empleados no válidos');
        }
        
        const empleados: Empleado[] = empleadosData.data;

        const parametrosJornada: ParametrosJornada | null = await prisma.parametrosJornada.findFirst({
            where: { activo: true },
            orderBy: { fecha_creacion: 'desc' },
            select: {
                hora_entrada_esperada: true,
                hora_salida_esperada: true,
                tolerancia_minutos: true,
                horas_laborales: true,
            }
        });

        if (!parametrosJornada) {
            throw new Error('No se encontraron parámetros de jornada activos');
        }

        const entradas: Entrada[] = await prisma.entradas.findMany({
            select: {
                id_empleado: true,
                hora_entrada: true,
                fecha_entrada: true
            }
        });

        const salidas: Salida[] = await prisma.salidas.findMany({
            select: {
                id_empleado: true,
                hora_salida: true,
                fecha_salida: true
            }
        });

        const jornadas: JornadaLaboral[] = [];
        const jornadasPorEmpleado: Map<string, JornadaLaboral> = new Map();

        // Obtener la fecha actual en formato YYYY-MM-DD
        const fechaActual: string = new Date().toISOString().split('T')[0];
        let llegadasTardeHoy: number = 0;

        entradas.forEach((entrada: Entrada): void => {
            if (!entrada.fecha_entrada || !entrada.hora_entrada) return;

            const empleado: Empleado | undefined = empleados?.find((emp: Empleado) => emp.id === entrada.id_empleado);
            const nombreEmpleado: string = empleado ? obtenerNombreCompleto(empleado) : 'Empleado no encontrado';

            const fechaEntrada: Date = new Date(entrada.fecha_entrada);
            const horaEntrada: string = extraerHora(new Date(entrada.hora_entrada));
            const fechaKey: string = fechaEntrada.toISOString().split('T')[0];
            
            // Calcular si llegó tarde usando la hora exacta de la BD
            const [horaRealHH, horaRealMM]: number[] = horaEntrada.split(':').map(Number);
            const [horaEsperadaHH, horaEsperadaMM]: number[] = parametrosJornada.hora_entrada_esperada.split(':').map(Number);
            
            const minutosReales: number = horaRealHH * 60 + horaRealMM;
            const minutosEsperados: number = horaEsperadaHH * 60 + horaEsperadaMM;
            const minutosTarde: number = Math.max(0, minutosReales - (minutosEsperados + parametrosJornada.tolerancia_minutos));
            
            const llegadaTarde: boolean = minutosTarde > 0;

            // Incrementar contador de llegadas tarde para el día actual
            if (llegadaTarde && fechaKey === fechaActual) {
                llegadasTardeHoy++;
            }

            // Buscar la salida correspondiente
            const salidaCorrespondiente: Salida | undefined = salidas.find((salida: Salida) => 
                salida.id_empleado === entrada.id_empleado && 
                new Date(salida.fecha_salida).toISOString().split('T')[0] === fechaKey
            );

            const jornadaKey: string = `${entrada.id_empleado}-${fechaKey}`;
            
            let horasTrabajadas: number = 0;
            let horaSalida: string = 'Sin registro';
            let minutosTemprano: number = 0;
            let salidaTemprana: boolean = false;

            if (salidaCorrespondiente?.hora_salida) {
                horaSalida = extraerHora(new Date(salidaCorrespondiente.hora_salida));
                
                // Calcular horas trabajadas usando las horas exactas
                const [horaSalidaHH, horaSalidaMM, horaSalidaSS]: number[] = horaSalida.split(':').map(Number);
                const [horaEntradaHH, horaEntradaMM, horaEntradaSS]: number[] = horaEntrada.split(':').map(Number);
                
                const minutosTotales: number = 
                    (horaSalidaHH * 60 + horaSalidaMM) - 
                    (horaEntradaHH * 60 + horaEntradaMM);
                
                horasTrabajadas = Number((minutosTotales / 60).toFixed(2));

                // Calcular si salió temprano
                const [horaSalidaEsperadaHH, horaSalidaEsperadaMM]: number[] = parametrosJornada.hora_salida_esperada.split(':').map(Number);
                
                const minutosSalidaEsperados: number = horaSalidaEsperadaHH * 60 + horaSalidaEsperadaMM;
                const minutosSalidaReales: number = horaSalidaHH * 60 + horaSalidaMM;
                
                minutosTemprano = Math.max(0, minutosSalidaEsperados - minutosSalidaReales);
                salidaTemprana = minutosTemprano > parametrosJornada.tolerancia_minutos;
            }

            const cumpleJornada: boolean = horasTrabajadas >= parametrosJornada.horas_laborales && 
                                !llegadaTarde && 
                                !salidaTemprana;

            jornadasPorEmpleado.set(jornadaKey, {
                id_empleado: entrada.id_empleado,
                nombre_empleado: nombreEmpleado,
                fecha: fechaEntrada.toLocaleDateString('es-ES'),
                hora_entrada: horaEntrada,
                hora_salida: horaSalida,
                llegadaTarde,
                salidaTemprana,
                minutos_tarde: minutosTarde,
                minutos_temprano: minutosTemprano,
                horas_trabajadas: horasTrabajadas,
                cumple_jornada: cumpleJornada
            });
        });

        // Calcular estadísticas por empleado
        const estadisticasPorEmpleado: Record<number, EstadisticasEmpleado> = {};

        jornadasPorEmpleado.forEach((jornada: JornadaLaboral): void => {
            if (!estadisticasPorEmpleado[jornada.id_empleado]) {
                const empleado: Empleado | undefined = empleados?.find((emp: Empleado) => emp.id === jornada.id_empleado);
                const nombreEmpleado: string = empleado ? obtenerNombreCompleto(empleado) : 'Empleado no encontrado';

                estadisticasPorEmpleado[jornada.id_empleado] = {
                    id_empleado: jornada.id_empleado,
                    nombre_empleado: nombreEmpleado,
                    total_llegadas_tarde: 0,
                    total_salidas_temprano: 0,
                    total_minutos_tarde: 0,
                    total_minutos_temprano: 0,
                    promedio_horas_trabajadas: 0,
                    dias_trabajados: 0,
                    dias_jornada_completa: 0
                };
            }

            const stats: EstadisticasEmpleado = estadisticasPorEmpleado[jornada.id_empleado];
            if (jornada.llegadaTarde) stats.total_llegadas_tarde++;
            if (jornada.salidaTemprana) stats.total_salidas_temprano++;
            stats.total_minutos_tarde += jornada.minutos_tarde;
            stats.total_minutos_temprano += jornada.minutos_temprano;
            if (jornada.cumple_jornada) stats.dias_jornada_completa++;
            stats.promedio_horas_trabajadas = 
                ((stats.promedio_horas_trabajadas * stats.dias_trabajados) + jornada.horas_trabajadas) / 
                (stats.dias_trabajados + 1);
            stats.dias_trabajados++;
        });

        return NextResponse.json({
            message: 'Jornadas procesadas exitosamente',
            parametros_jornada: parametrosJornada,
            jornadas: Array.from(jornadasPorEmpleado.values()),
            estadisticas: estadisticasPorEmpleado,
            llegadasTardeHoy: llegadasTardeHoy
        });

    } catch (error: unknown) {
        console.error('Error al procesar las jornadas:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error al procesar las jornadas' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}