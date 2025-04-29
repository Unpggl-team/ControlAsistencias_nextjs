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

// Obtener un parámetro específico por ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const id = parseInt(params.id);
        const parametro = await prisma.parametrosJornada.findUnique({
            where: { id }
        });

        if (!parametro) {
            return NextResponse.json(
                { message: 'Parámetro no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Parámetro obtenido exitosamente',
            data: parametro
        });
    } catch (error) {
        console.error('Error en GET parametros-jornada/[id]:', error);
        return NextResponse.json(
            { message: 'Error al obtener el parámetro' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Actualizar parámetros existentes
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const id = parseInt(params.id);
        const body = await request.json();

        // Verificar si el parámetro existe
        const parametroExistente = await prisma.parametrosJornada.findUnique({
            where: { id }
        });

        if (!parametroExistente) {
            return NextResponse.json(
                { message: 'Parámetro no encontrado' },
                { status: 404 }
            );
        }

        // Actualizar parámetro
        const parametroActualizado = await prisma.parametrosJornada.update({
            where: { id },
            data: {
                hora_entrada_esperada: body.hora_entrada_esperada,
                hora_salida_esperada: body.hora_salida_esperada,
                tolerancia_minutos: parseInt(body.tolerancia_minutos),
                horas_laborales: parseFloat(body.horas_laborales),
                activo: body.activo !== undefined ? body.activo : parametroExistente.activo
            }
        });

        return NextResponse.json({
            message: 'Parámetro actualizado exitosamente',
            data: parametroActualizado
        });
    } catch (error) {
        console.error('Error en PUT parametros-jornada/[id]:', error);
        return NextResponse.json(
            { message: 'Error al actualizar el parámetro' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Eliminar parámetros
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const id = parseInt(params.id);

        // Verificar si el parámetro existe
        const parametroExistente = await prisma.parametrosJornada.findUnique({
            where: { id }
        });

        if (!parametroExistente) {
            return NextResponse.json(
                { message: 'Parámetro no encontrado' },
                { status: 404 }
            );
        }

        // Eliminar parámetro
        await prisma.parametrosJornada.delete({
            where: { id }
        });

        return NextResponse.json({
            message: 'Parámetro eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en DELETE parametros-jornada/[id]:', error);
        return NextResponse.json(
            { message: 'Error al eliminar el parámetro' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}