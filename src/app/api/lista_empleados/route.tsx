import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    try {
        // Extraer token desde los headers
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'No hay token de autenticación' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Datos_personal`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json({ message: 'Datos obtenidos exitosamente', data });

    } catch (error) {
        console.error('Error al obtener los datos:', error);
        return NextResponse.json(
            { message: 'Error al obtener los datos' },
            { status: 500 }
        );
    }
}
