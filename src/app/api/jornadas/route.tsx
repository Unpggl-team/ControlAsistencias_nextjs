import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Reutilizar la instancia global de PrismaClient
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Definir tipos estrictos
type PrismaGlobal = {
    prisma: PrismaClient | undefined;
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

interface JornadaEmpleado {
    id_empleado: number;
    fecha: string;
    hora_entrada: string;
    hora_salida: string;
    llegadaTarde: boolean;
    minutos_tarde: number;
    horas_trabajadas: number;
}

interface ParametrosJornada {
    hora_entrada_esperada: string;
    hora_salida_esperada: string;
    tolerancia_minutos: number;
    horas_laborales: number;
    tiempo_minimo_almuerzo: number;
}

const globalForPrisma = global as unknown as PrismaGlobal;

// Función auxiliar para extraer la hora de un DateTime
function extraerHora(fechaHora: Date): string {
    const horaCompleta = fechaHora.toISOString().split('T')[1];
    return horaCompleta.split('.')[0]; // Obtiene HH:MM:SS
}

// Función auxiliar para formatear la fecha
function formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Bogota' // Ajusta esto a tu zona horaria
    });
}

export async function GET(): Promise<NextResponse> {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const parametrosJornada = await prisma.parametrosJornada.findFirst({
            where: { activo: true },
            orderBy: { fecha_creacion: 'desc' }
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
        const jornadasPorEmpleado = new Map<string, JornadaLaboral>();

        // Obtener la fecha actual en formato YYYY-MM-DD
        const fechaActual = new Date().toISOString().split('T')[0];
        let llegadasTardeHoy = 0;

        entradas.forEach((entrada: Entrada): void => {
            if (!entrada.fecha_entrada || !entrada.hora_entrada) return;

            const fechaEntrada = new Date(entrada.fecha_entrada);
            const horaEntrada = extraerHora(new Date(entrada.hora_entrada));
            const fechaKey = fechaEntrada.toISOString().split('T')[0];
            
            // Calcular si llegó tarde usando la hora exacta de la BD
            const [horaRealHH, horaRealMM] = horaEntrada.split(':').map(Number);
            const [horaEsperadaHH, horaEsperadaMM] = parametrosJornada.hora_entrada_esperada.split(':').map(Number);
            
            const minutosReales = horaRealHH * 60 + horaRealMM;
            const minutosEsperados = horaEsperadaHH * 60 + horaEsperadaMM;
            const minutosTarde = Math.max(0, minutosReales - (minutosEsperados + parametrosJornada.tolerancia_minutos));
            
            const llegadaTarde = minutosTarde > 0;

            // Incrementar contador de llegadas tarde para el día actual
            if (llegadaTarde && fechaKey === fechaActual) {
                llegadasTardeHoy++;
            }

            // Buscar la salida correspondiente
            const salidaCorrespondiente = salidas.find((salida: Salida) => 
                salida.id_empleado === entrada.id_empleado && 
                new Date(salida.fecha_salida).toISOString().split('T')[0] === fechaKey
            );

            const jornadaKey = `${entrada.id_empleado}-${fechaKey}`;
            
            let horasTrabajadas = 0;
            let horaSalida = 'Sin registro';
            let minutosTemprano = 0;
            let salidaTemprana = false;

            if (salidaCorrespondiente?.hora_salida) {
                horaSalida = extraerHora(new Date(salidaCorrespondiente.hora_salida));
                
                // Calcular horas trabajadas usando las horas exactas
                const [horaSalidaHH, horaSalidaMM, horaSalidaSS] = horaSalida.split(':').map(Number);
                const [horaEntradaHH, horaEntradaMM, horaEntradaSS] = horaEntrada.split(':').map(Number);
                
                const minutosTotales = 
                    (horaSalidaHH * 60 + horaSalidaMM) - 
                    (horaEntradaHH * 60 + horaEntradaMM);
                
                horasTrabajadas = Number((minutosTotales / 60).toFixed(2));

                // Calcular si salió temprano
                const [horaSalidaEsperadaHH, horaSalidaEsperadaMM] = parametrosJornada.hora_salida_esperada.split(':').map(Number);
                
                const minutosSalidaEsperados = horaSalidaEsperadaHH * 60 + horaSalidaEsperadaMM;
                const minutosSalidaReales = horaSalidaHH * 60 + horaSalidaMM;
                
                minutosTemprano = Math.max(0, minutosSalidaEsperados - minutosSalidaReales);
                salidaTemprana = minutosTemprano > parametrosJornada.tolerancia_minutos;
            }

            const cumpleJornada = horasTrabajadas >= parametrosJornada.horas_laborales && 
                                !llegadaTarde && 
                                !salidaTemprana;

            jornadasPorEmpleado.set(jornadaKey, {
                id_empleado: entrada.id_empleado,
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

        jornadasPorEmpleado.forEach(jornada => {
            if (!estadisticasPorEmpleado[jornada.id_empleado]) {
                estadisticasPorEmpleado[jornada.id_empleado] = {
                    id_empleado: jornada.id_empleado,
                    total_llegadas_tarde: 0,
                    total_salidas_temprano: 0,
                    total_minutos_tarde: 0,
                    total_minutos_temprano: 0,
                    promedio_horas_trabajadas: 0,
                    dias_trabajados: 0,
                    dias_jornada_completa: 0
                };
            }

            const stats = estadisticasPorEmpleado[jornada.id_empleado];
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

    } catch (error) {
        console.error('Error al procesar las jornadas:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error al procesar las jornadas' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}