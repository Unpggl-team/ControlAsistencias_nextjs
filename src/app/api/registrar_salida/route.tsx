import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mejor manejo de la instancia de PrismaClient
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

interface Salida {
    id: number;
    id_empleado: number;
    hora_salida: Date;
    fecha_salida: Date;
}

interface SalidaFormateada {
    id: number;
    id_empleado: number;
    hora_salida: string;
    fecha_salida: string;
}

export async function GET() {
    try {
        const salidas = await prisma.salidas.findMany({
            select: {
                id: true,
                id_empleado: true,
                hora_salida: true,
                fecha_salida: true
            }
        });
        
        // Formatear las salidas
        const salidasFormateadas = salidas.map((salida: Salida) => ({
            ...salida,
            hora_salida: salida.hora_salida.toISOString().split('T')[1].substring(0, 8),
            fecha_salida: new Date(salida.fecha_salida).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '/')
        }));

        return NextResponse.json({ 
            message: 'Salidas obtenidas exitosamente', 
            data: salidasFormateadas 
        });

    } catch (error) {
        console.error('Error al obtener las salidas:', error);
        return NextResponse.json(
            { message: 'Error al obtener las salidas' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id_empleado } = body;

        if (!id_empleado) {
            return NextResponse.json(
                { message: 'ID de empleado es requerido' },
                { status: 400 }
            );
        }

        // Obtener la fecha y hora actual de Managua
        const fechaActual = new Date();
        // Ajustar a la zona horaria de Managua (UTC-6)
        fechaActual.setHours(fechaActual.getHours() - 6);

        // Verificar si ya existe una salida para este empleado en el día actual
        const salidaExistente = await prisma.salidas.findFirst({
            where: {
                id_empleado: id_empleado,
                fecha_salida: {
                    gte: new Date(fechaActual.toISOString().split('T')[0]),
                    lt: new Date(new Date(fechaActual).setDate(fechaActual.getDate() + 1))
                }
            }
        });

        if (salidaExistente) {
            return NextResponse.json(
                { message: 'Ya se registró la salida para este empleado el día de hoy' },
                { status: 400 }
            );
        }
        
        const salida = await prisma.salidas.create({
            data: {
                id_empleado,
                hora_salida: fechaActual,
                fecha_salida: fechaActual
            }
        });

        return NextResponse.json({
            message: 'Salida registrada exitosamente',
            data: salida
        });

    } catch (error) {
        console.error('Error al registrar salida:', error);
        return NextResponse.json(
            { message: 'Error al registrar salida' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
