import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
    try {
        const parametrosJornada = await prisma.parametrosJornada.findFirst({
            where: { activo: true },
            orderBy: { fecha_creacion: 'desc' }
        });

        if (!parametrosJornada) {
            throw new Error('No se encontraron parámetros de jornada activos');
        }

        return NextResponse.json({
            message: 'Parámetros obtenidos exitosamente',
            parametros_jornada: parametrosJornada
        });

    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error al obtener parámetros' },
            { status: 500 }
        );
    }
} 