import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('token')?.value

        if (!token) {
            return NextResponse.json(
                { message: 'No hay token de autenticación' },
                { status: 401 }
            )
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/departamento_catalogo`, {
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
        console.log(process.env.NEXT_PUBLIC_API_BASE_URL);
        const data = await response.json();
        console.log(data);
        return NextResponse.json({ message: 'Departamentos obtenidos exitosamente', data });
        
    } catch (error) {
        console.error('Error al obtener los departamentos:', error);    
        return NextResponse.json(
            { message: 'Error al obtener los departamentos' },
            { status: 500 }
        );
    }
}
