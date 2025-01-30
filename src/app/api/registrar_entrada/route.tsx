import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mejor manejo de la instancia de PrismaClient
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

interface Entrada {
    id: number;
    id_empleado: number;
    hora_entrada: Date;
    fecha_entrada: Date;
}

export async function GET() {
    try {
        const entradas = await prisma.entradas.findMany({
            select: {
                id: true,
                id_empleado: true,
                hora_entrada: true,
                fecha_entrada: true
            }
        });
        
        // Formatear las entradas
        const entradasFormateadas = entradas.map((entrada: Entrada) => ({
            ...entrada,
            hora_entrada: entrada.hora_entrada.toISOString().split('T')[1].substring(0, 8),
            fecha_entrada: new Date(entrada.fecha_entrada).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '/')
        }));

        return NextResponse.json(
            { 
                message: 'Entradas obtenidas exitosamente', 
                data: entradasFormateadas 
            }
        );

    } catch (error) {
        console.error('Error al obtener las entradas:', error);
        return NextResponse.json(
            { message: 'Error al obtener las entradas' },
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
        const fechaManagua = new Date(fechaActual.getTime() - (6 * 60 * 60 * 1000));

        // Validar si es después de las 12 PM
        if (fechaManagua.getHours() >= 12) {
            return NextResponse.json(
                { message: 'No se pueden registrar entradas después de las 12 PM' },
                { status: 400 }
            );
        }

        // Verificar si ya existe un registro para hoy
        const inicioDelDia = new Date(fechaManagua);
        inicioDelDia.setHours(0,0,0,0);
        
        const finDelDia = new Date(fechaManagua);
        finDelDia.setHours(23,59,59,999);

        const registroExistente = await prisma.entradas.findFirst({
            where: {
                id_empleado,
                fecha_entrada: {
                    gte: inicioDelDia,
                    lt: finDelDia
                }
            }
        });

        if (registroExistente) {
            return NextResponse.json(
                { message: 'Ya registraste tu entrada el día de hoy' },
                { status: 400 }
            );
        }

        const entrada = await prisma.entradas.create({
            data: {
                id_empleado,
                hora_entrada: fechaManagua,
                fecha_entrada: fechaManagua
            }
        });

        return NextResponse.json({
            message: 'Entrada registrada exitosamente',
            data: entrada
        });

    } catch (error) {
        console.error('Error al registrar entrada:', error);
        return NextResponse.json(
            { message: 'Error al registrar entrada' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
