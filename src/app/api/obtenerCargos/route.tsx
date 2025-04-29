import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        // Validate authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'No hay token de autenticación' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];

        // Validate API base URL
        if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
            throw new Error('API base URL is not configured');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/obtenerCargos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error al obtener los cargos: ${errorData}`);
        }

        const data = await response.json();

        return NextResponse.json({
            message: 'Cargos obtenidos exitosamente',
            data: data.cargos
        }, { status: 200 });

    } catch (error) {
        console.error('Error en GET obtenerCargos:', error);
        return NextResponse.json(
            { 
                message: 'Error al obtener los cargos',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}