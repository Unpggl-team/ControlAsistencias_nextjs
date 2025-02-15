import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('token')

        if (!token) {
            return NextResponse.json(
                { message: 'No hay token de autenticación, debe de iniciar sesión en el sistema' },
                { status: 401 }
            )
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Datos_personal`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.value}`,
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