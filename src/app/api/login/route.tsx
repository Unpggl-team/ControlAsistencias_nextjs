import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { inss, password } = body;
        
        const response = await fetch('http://test.uncpggl.edu.ni:3011/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                inss,
                password
            })
        });

        if (!response.ok) {
            return NextResponse.json(
                { message: 'Credenciales inválidas' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (error) {
        console.error('Error al obtener los datos:', error);    
        return NextResponse.json(
            { message: 'Error al obtener los datos' },
            { status: 500 }
        );
    }
}