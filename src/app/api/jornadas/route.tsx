import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

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

interface EmpleadoJornada {
    id: number;
    id_empleado: number;
    parametrosJornada: ParametrosJornada;
    parametrosJornadaId: number;
    fecha_asignacion: Date;
    activo: boolean;
}

const globalForPrisma: PrismaGlobal = global as unknown as PrismaGlobal;

function obtenerNombreCompleto(empleado: Empleado): string {
    const nombres = [empleado.name, empleado.segundo_nombre].filter(Boolean).join(' ');
    const apellidos = [empleado.primer_apellido, empleado.segundo_apellido].filter(Boolean).join(' ');
    return `${nombres} ${apellidos}`.trim();
}

function extraerHora(fechaHora: Date): string {
    const horaCompleta: string = fechaHora.toISOString().split('T')[1];
    return horaCompleta.split('.')[0];
}

function formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Bogota'
    });
}

export async function GET(request: Request): Promise<NextResponse> {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        // Get authorization token from headers
         const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'No hay token de autenticación' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        console.log("token en jornadas " + token);

        const empleadosResponse: Response = await fetch('http://localhost:3000/api/lista_empleados', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!empleadosResponse.ok) {
            throw new Error('Error al obtener la lista de empleados');
        }
        
        const empleadosData = await empleadosResponse.json();
        if (!empleadosData || !empleadosData.data) {
            throw new Error('Datos de empleados no válidos');
        }
        
        const empleados: Empleado[] = empleadosData.data;
        
        // Rest of the code remains the same...
        const asignacionesJornada = await prisma.empleadoJornada.findMany({
            where: { activo: true },
            include: {
                parametrosJornada: true
            },
            orderBy: {
                fecha_asignacion: 'desc'
            }
        });
        
        const parametrosJornadaPorEmpleado = new Map<string, ParametrosJornada>();
        
        asignacionesJornada.forEach((asignacion) => {
            const fechaAsignacion = new Date(asignacion.fecha_asignacion).toISOString().split('T')[0];
            const key = `${asignacion.id_empleado}-${fechaAsignacion}`;
            
            if (!parametrosJornadaPorEmpleado.has(key)) {
                parametrosJornadaPorEmpleado.set(key, {
                    hora_entrada_esperada: asignacion.parametrosJornada.hora_entrada_esperada,
                    hora_salida_esperada: asignacion.parametrosJornada.hora_salida_esperada,
                    tolerancia_minutos: asignacion.parametrosJornada.tolerancia_minutos,
                    horas_laborales: asignacion.parametrosJornada.horas_laborales
                });
            }
        });
        
        const obtenerParametrosJornada = (idEmpleado: number, fecha: string): ParametrosJornada | null => {
            const asignacionesEmpleado = Array.from(parametrosJornadaPorEmpleado.entries())
                .filter(([key]) => key.startsWith(`${idEmpleado}-`))
                .sort(([keyA], [keyB]) => keyB.split('-')[1].localeCompare(keyA.split('-')[1]));

            const asignacionValida = asignacionesEmpleado.find(([key]) => {
                const fechaAsignacion = key.split('-')[1];
                return fechaAsignacion <= fecha;
            });

            return asignacionValida ? asignacionValida[1] : null;
        };

        const entradas = await prisma.entradas.findMany({
            select: {
                id_empleado: true,
                hora_entrada: true,
                fecha_entrada: true
            }
        });

        const salidas = await prisma.salidas.findMany({
            select: {
                id_empleado: true,
                hora_salida: true,
                fecha_salida: true
            }
        });

        const jornadasPorEmpleado = new Map<string, JornadaLaboral>();
        const fechaActual = new Date().toISOString().split('T')[0];
        let llegadasTardeHoy = 0;

        entradas.forEach((entrada) => {
            if (!entrada.fecha_entrada || !entrada.hora_entrada) return;

            const empleado = empleados?.find(emp => emp.id === entrada.id_empleado);
            if (!empleado) return;

            const nombreEmpleado = obtenerNombreCompleto(empleado);
            const fechaEntrada = new Date(entrada.fecha_entrada);
            const horaEntrada = extraerHora(new Date(entrada.hora_entrada));
            const fechaKey = fechaEntrada.toISOString().split('T')[0];
            
            const parametrosJornada = obtenerParametrosJornada(entrada.id_empleado, fechaKey);
            if (!parametrosJornada) return;

            const [horaRealHH, horaRealMM] = horaEntrada.split(':').map(Number);
            const [horaEsperadaHH, horaEsperadaMM] = parametrosJornada.hora_entrada_esperada.split(':').map(Number);
            
            const minutosReales = horaRealHH * 60 + horaRealMM;
            const minutosEsperados = horaEsperadaHH * 60 + horaEsperadaMM;
            const minutosTarde = Math.max(0, minutosReales - (minutosEsperados + parametrosJornada.tolerancia_minutos));
            
            const llegadaTarde = minutosTarde > 0;

            if (llegadaTarde && fechaKey === fechaActual) {
                llegadasTardeHoy++;
            }

            const salidaCorrespondiente = salidas.find(salida => 
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
                
                const [horaSalidaHH, horaSalidaMM] = horaSalida.split(':').map(Number);
                const [horaEntradaHH, horaEntradaMM] = horaEntrada.split(':').map(Number);
                
                const minutosTotales = 
                    (horaSalidaHH * 60 + horaSalidaMM) - 
                    (horaEntradaHH * 60 + horaEntradaMM);
                
                horasTrabajadas = Number((minutosTotales / 60).toFixed(2));
                
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

        const estadisticasPorEmpleado: Record<number, EstadisticasEmpleado> = {};

        jornadasPorEmpleado.forEach((jornada: JornadaLaboral): void => {
            if (!estadisticasPorEmpleado[jornada.id_empleado]) {
                const empleado = empleados?.find(emp => emp.id === jornada.id_empleado);
                const nombreEmpleado = empleado ? obtenerNombreCompleto(empleado) : 'Empleado no encontrado';

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

            const stats = estadisticasPorEmpleado[jornada.id_empleado];
            if (jornada.llegadaTarde) stats.total_llegadas_tarde++;
            if (jornada.salidaTemprana) stats.total_salidas_temprano++;
            stats.total_minutos_tarde += jornada.minutos_tarde;
            stats.total_minutos_temprano += jornada.minutos_temprano;
            if (jornada.cumple_jornada) stats.dias_jornada_completa++;
            
            const totalHorasAnteriores = stats.promedio_horas_trabajadas * stats.dias_trabajados;
            const nuevasHorasTrabajadas = jornada.horas_trabajadas;
            stats.promedio_horas_trabajadas = Number(((totalHorasAnteriores + nuevasHorasTrabajadas) / (stats.dias_trabajados + 1)).toFixed(2));
            stats.dias_trabajados++;
        });

        return NextResponse.json({
            message: 'Jornadas procesadas exitosamente',
            asignaciones_jornada: asignacionesJornada,
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
