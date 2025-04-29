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

// Obtener todas las asignaciones de jornadas a empleados o filtrar por id_empleado
export async function GET(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const { searchParams } = new URL(request.url);
        const id_empleado = searchParams.get('id_empleado');

            // Si se proporciona id_empleado, obtener asignación específica
        if (id_empleado) {
            const asignacion = await prisma.empleadoJornada.findFirst({
                where: { 
                    id_empleado: parseInt(id_empleado),
                    activo: true 
                },
                include: {
                    parametrosJornada: true
                }
            });

            if (!asignacion) {
                return NextResponse.json(
                    { message: 'No se encontró asignación de jornada para este empleado' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                message: 'Asignación de jornada obtenida exitosamente',
                data: asignacion
            });
        }

        // Obtener todas las asignaciones activas
        const asignaciones = await prisma.empleadoJornada.findMany({
            where: { activo: true },
            include: {
                parametrosJornada: true
            }
        });

        return NextResponse.json({
            message: 'Asignaciones de jornada obtenidas exitosamente',
            data: asignaciones
        });
    } catch (error) {
        console.error('Error en GET empleado-jornada:', error);
        return NextResponse.json(
            { message: 'Error al obtener las asignaciones de jornada' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Crear una nueva asignación de jornada a empleado
export async function POST(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const body = await request.json();
        
        // Validar datos requeridos
        if (!body.id_empleado || !body.parametrosJornadaId) {
            return NextResponse.json(
                { message: 'Se requiere id_empleado y parametrosJornadaId' },
                { status: 400 }
            );
        }

        // Desactivar asignaciones previas para este empleado
        await prisma.empleadoJornada.updateMany({
            where: { 
                id_empleado: parseInt(body.id_empleado),
                activo: true 
            },
            data: { activo: false }
        });

        // Crear nueva asignación
        const nuevaAsignacion = await prisma.empleadoJornada.create({
            data: {
                id_empleado: parseInt(body.id_empleado),
                parametrosJornadaId: parseInt(body.parametrosJornadaId),
                activo: true
            },
            include: {
                parametrosJornada: true
            }
        });

        return NextResponse.json({
            message: 'Asignación de jornada creada exitosamente',
            data: nuevaAsignacion
        });
    } catch (error) {
        console.error('Error en POST empleado-jornada:', error);
        return NextResponse.json(
            { message: 'Error al crear la asignación de jornada' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Actualizar una asignación existente
export async function PUT(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { message: 'Se requiere el ID de la asignación' },
                { status: 400 }
            );
        }

        const body = await request.json();
        
        // Actualizar asignación
        const asignacionActualizada = await prisma.empleadoJornada.update({
            where: { id: parseInt(id) },
            data: {
                parametrosJornadaId: parseInt(body.parametrosJornadaId),
                activo: body.activo
            },
            include: {
                parametrosJornada: true
            }
        });

        return NextResponse.json({
            message: 'Asignación de jornada actualizada exitosamente',
            data: asignacionActualizada
        });
    } catch (error) {
        console.error('Error en PUT empleado-jornada:', error);
        return NextResponse.json(
            { message: 'Error al actualizar la asignación de jornada' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// Eliminar una asignación (desactivar)
export async function DELETE(request: Request) {
    try {
        if (!prisma) {
            throw new Error('No se pudo conectar con la base de datos');
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { message: 'Se requiere el ID de la asignación' },
                { status: 400 }
            );
        }

        // Desactivar asignación en lugar de eliminarla
        const asignacionDesactivada = await prisma.empleadoJornada.update({
            where: { id: parseInt(id) },
            data: { activo: false }
        });

        return NextResponse.json({
            message: 'Asignación de jornada desactivada exitosamente',
            data: asignacionDesactivada
        });
    } catch (error) {
        console.error('Error en DELETE empleado-jornada:', error);
        return NextResponse.json(
            { message: 'Error al desactivar la asignación de jornada' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}