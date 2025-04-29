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

// Get parameters by ID or get all parameters
export async function GET(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // If ID is provided, get specific parameter
        if (id) {
            const parametro = await prisma.parametrosJornada.findUnique({
                where: { id: parseInt(id) }
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
        }

        // Get all parameters
        const parametros = await prisma.parametrosJornada.findMany({
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
        
        // Deactivate previous parameters
        await prisma.parametrosJornada.updateMany({
            where: { activo: true },
            data: { activo: false }
        });

        // Create new parameters
        const nuevosParametros = await prisma.parametrosJornada.create({
            data: {
                hora_entrada_esperada: body.hora_entrada_esperada,
                hora_salida_esperada: body.hora_salida_esperada,
                tolerancia_minutos: parseInt(body.tolerancia_minutos),
                horas_laborales: parseFloat(body.horas_laborales),
                activo: true
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

export async function PUT(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { message: 'ID no proporcionado' },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Check if parameter exists
        const parametroExistente = await prisma.parametrosJornada.findUnique({
            where: { id: parseInt(id) }
        });

        if (!parametroExistente) {
            return NextResponse.json(
                { message: 'Parámetro no encontrado' },
                { status: 404 }
            );
        }

        // Update parameter
        const parametroActualizado = await prisma.parametrosJornada.update({
            where: { id: parseInt(id) },
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
        console.error('Error en PUT parametros-jornada:', error);
        return NextResponse.json(
            { message: 'Error al actualizar el parámetro' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { message: 'ID no proporcionado' },
                { status: 400 }
            );
        }

        // Check if parameter exists
        const parametroExistente = await prisma.parametrosJornada.findUnique({
            where: { id: parseInt(id) }
        });

        if (!parametroExistente) {
            return NextResponse.json(
                { message: 'Parámetro no encontrado' },
                { status: 404 }
            );
        }

        // Delete parameter
        await prisma.parametrosJornada.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({
            message: 'Parámetro eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en DELETE parametros-jornada:', error);
        return NextResponse.json(
            { message: 'Error al eliminar el parámetro' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}