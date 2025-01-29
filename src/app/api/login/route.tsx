import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { inss, password } = body;

        console.log('Datos enviados:', { inss, password });

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                inss: inss,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error de la API:', errorData);
            return NextResponse.json(
                { message: 'Credenciales inválidas', error: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ 
            message: data.message,
            user: {
                id: data.data.id_user,
                nombres: data.data.nombres,
                departamento: data.data.departamento,
                id_departamento: data.data.id_depar,
                id_user: data.data.id_user,
                rol: data.data.id_rol
            },
            token: data.data.token 
        });
        
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return NextResponse.json(
            { message: 'Error al procesar la solicitud' },
            { status: 500 }
        );
    }
}