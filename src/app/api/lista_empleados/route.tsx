import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const response = await fetch('http://test.uncpggl.edu.ni:3011/api/Datos_personal', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 13224|pA7dwRWILfpggCMloUtHK7WgwcqQQwEaMTDYutAu',
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