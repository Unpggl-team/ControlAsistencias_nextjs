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

export async function GET() {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const parametros = await prisma.parametrosJornada.findFirst({
            where: { activo: true },
            orderBy: { fecha_creacion: 'desc' }
        });

        return NextResponse.json({
            message: 'Parámetros obtenidos exitosamente',
            data: parametros
        });
    } catch (error) {
        console.error('Error en GET parametros-jornada:', error);
        return NextResponse.json(
            { message: 'Error al obtener los parámetros' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const body = await request.json();
        
        // Desactivar parámetros anteriores
        await prisma.parametrosJornada.updateMany({
            where: { activo: true },
            data: { activo: false }
        });

        // Crear nuevos parámetros
        const nuevosParametros = await prisma.parametrosJornada.create({
            data: {
                hora_entrada_esperada: body.hora_entrada_esperada,
                hora_salida_esperada: body.hora_salida_esperada,
                tolerancia_minutos: parseInt(body.tolerancia_minutos),
                horas_laborales: parseFloat(body.horas_laborales),
                tiempo_minimo_almuerzo: parseInt(body.tiempo_minimo_almuerzo)
            }
        });

        return NextResponse.json({
            message: 'Parámetros creados exitosamente',
            data: nuevosParametros
        });
    } catch (error) {
        console.error('Error en POST parametros-jornada:', error);
        return NextResponse.json(
            { message: 'Error al crear los parámetros' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 