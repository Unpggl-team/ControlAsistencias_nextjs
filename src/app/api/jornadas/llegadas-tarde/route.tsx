import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
    try {
        const fechaActual = new Date().toISOString().split('T')[0];
        
        const llegadasTardeHoy = await prisma.entradas.count({
            where: {
                fecha_entrada: {
                    gte: new Date(fechaActual),
                    lt: new Date(new Date(fechaActual).setDate(new Date(fechaActual).getDate() + 1))
                },
                hora_entrada: {
                    // Aquí agregarías la lógica para determinar llegadas tarde
                }
            }
        });

        return NextResponse.json({
            message: 'Llegadas tarde obtenidas exitosamente',
            llegadasTardeHoy
        });

    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error al obtener llegadas tarde' },
            { status: 500 }
        );
    }
} 