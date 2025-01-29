import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request): Promise<NextResponse> {
    try {
        // Obtener la fecha de la URL
        const { searchParams } = new URL(request.url);
        const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];

        const parametrosJornada = await prisma.parametrosJornada.findFirst({
            where: { activo: true }
        });

        if (!parametrosJornada) {
            throw new Error('No se encontraron parámetros de jornada activos');
        }

        const entradas = await prisma.entradas.findMany({
            where: {
                fecha_entrada: {
                    gte: new Date(fecha),
                    lt: new Date(new Date(fecha).setDate(new Date(fecha).getDate() + 1))
                }
            }
        });

        // Obtener empleados de la API externa
        const empleadosResponse = await fetch('URL_DE_TU_API_EXTERNA/empleados');
        const empleados = await empleadosResponse.json();

        const salidas = await prisma.salidas.findMany({
            where: {
                fecha_salida: {
                    gte: new Date(fecha),
                    lt: new Date(new Date(fecha).setDate(new Date(fecha).getDate() + 1))
                }
            }
        });

        // Procesar los datos y crear el objeto de jornadas
        const jornadas = entradas.map(entrada => {
            const salida = salidas.find(s => s.id_empleado === entrada.id_empleado);
            const empleado = empleados.find((e: any) => e.id === entrada.id_empleado);
            
            const horaEntrada = entrada.hora_entrada.toLocaleTimeString('es-ES', { 
                hour: '2-digit',
                minute: '2-digit'
            });
            const horaSalida = salida ? salida.hora_salida.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }) : null;
            
            // Calcular horas trabajadas
            const horasTrabajadas = salida 
                ? ((new Date(salida.fecha_salida).getTime() - new Date(entrada.fecha_entrada).getTime()) / (1000 * 60 * 60))
                : 0;

            // Determinar si es llegada tarde
            const horaLimite = new Date(`${fecha}T${parametrosJornada.hora_entrada_esperada}`);
            const llegadaTarde = new Date(entrada.fecha_entrada) > horaLimite;

            return {
                id_empleado: entrada.id_empleado,
                nombre_empleado: empleado?.nombre || 'Empleado no encontrado',
                hora_entrada: horaEntrada,
                hora_salida: horaSalida,
                horas_trabajadas: horasTrabajadas,
                llegada_tarde: llegadaTarde
            };
        });

        return NextResponse.json({
            message: 'Jornadas obtenidas exitosamente',
            jornadas
        });

    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error al obtener jornadas' },
            { status: 500 }
        );
    }
}