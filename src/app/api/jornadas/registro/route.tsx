import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mejor manejo de la instancia de PrismaClient
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

interface RegistroRequest {
  id_empleado: number;
  tipo_registro: 'entrada' | 'salida';
}

interface Empleado {
  id: number;
  name: string;
  primer_apellido: string;
  cedula: string;
  id_departamento: number;
  id_cargo: string;
}

interface ParametrosJornada {
  hora_entrada_esperada: string;
  tolerancia_minutos: number;
  activo: boolean;
}

interface Entrada {
  id_empleado: number;
  hora_entrada: Date;
  fecha_entrada: Date;
}

interface Salida {
  id_empleado: number;
  hora_salida: Date;
  fecha_salida: Date;
}

interface RegistroEmpleado {
  empleado: {
    id: number;
    nombre: string;
    cedula: string;
    id_departamento: number;
    id_cargo: string;
  };
  fecha: string;
  entrada: {
    hora: string;
    fecha: string;
  } | null;
  salida: {
    hora: string;
    fecha: string;
  } | null;
  estado: string;
}

export async function POST(request: Request) {
  try {
    const body: RegistroRequest = await request.json();
    const { id_empleado, tipo_registro } = body;
    const fechaActual = new Date();
    // Ajustar a la zona horaria de Managua (UTC-6)
    fechaActual.setHours(fechaActual.getHours() - 6);
    const fechaStr = fechaActual.toISOString().split('T')[0];
    
    // Validar si ya existe un registro para hoy
    const registroHoy = await prisma.entradas.findFirst({
      where: {
        id_empleado,
        fecha_entrada: {
          gte: new Date(fechaActual.setHours(0,0,0,0)),
          lt: new Date(fechaActual.setHours(23,59,59,999))
        }
      }
    });

    const salidaHoy = await prisma.salidas.findFirst({
      where: {
        id_empleado,
        fecha_salida: {
          gte: new Date(fechaActual.setHours(0,0,0,0)), 
          lt: new Date(fechaActual.setHours(23,59,59,999))
        }
      }
    });

    // Obtener parámetros de jornada
    const parametrosJornada = await prisma.parametrosJornada.findFirst({
      where: { activo: true }
    }) as ParametrosJornada | null;

    if (!parametrosJornada) {
      return NextResponse.json(
        { message: 'No se encontraron parámetros de jornada activos' },
        { status: 400 }
      );
    }

    if (tipo_registro === 'entrada') {
      if (registroHoy) {
        return NextResponse.json(
          { message: 'Ya registraste tu entrada hoy' },
          { status: 400 }
        );
      }

      // Calcular si es llegada tarde
      const [horaEsperada, minutoEsperado] = parametrosJornada.hora_entrada_esperada.split(':').map(Number);
      const horaActual = fechaActual.getHours();
      const minutoActual = fechaActual.getMinutes();
      
      const minutosTarde = Math.max(0, 
        (horaActual * 60 + minutoActual) - 
        (horaEsperada * 60 + minutoEsperado + parametrosJornada.tolerancia_minutos)
      );

      const esLlegadaTarde = minutosTarde > 0;

      // Registrar entrada
      const entrada = await prisma.entradas.create({
        data: {
          id_empleado,
          fecha_entrada: fechaActual,
          hora_entrada: fechaActual
        }
      });

      // Crear o actualizar estadísticas
      await prisma.estadisticas.upsert({
        where: {
          id_empleado_fecha: {
            id_empleado,
            fecha: fechaStr
          }
        },
        update: {
          llegadas_tarde: esLlegadaTarde ? 1 : 0,
          minutos_tarde: minutosTarde
        },
        create: {
          id_empleado,
          fecha: fechaStr,
          llegadas_tarde: esLlegadaTarde ? 1 : 0,
          minutos_tarde: minutosTarde,
          salidas_temprano: 0,
          minutos_temprano: 0,
          horas_trabajadas: 0
        }
      });

      return NextResponse.json({
        message: 'Entrada registrada exitosamente',
        data: entrada
      });

    } else if (tipo_registro === 'salida') {
      if (!registroHoy) {
        return NextResponse.json(
          { message: 'No has registrado entrada hoy' },
          { status: 400 }
        );
      }

      if (salidaHoy) {
        return NextResponse.json(
          { message: 'Ya registraste tu salida hoy' },
          { status: 400 }
        );
      }

      // Registrar salida
      const salida = await prisma.salidas.create({
        data: {
          id_empleado,
          fecha_salida: fechaActual,
          hora_salida: fechaActual
        }
      });

      // Calcular horas trabajadas
      const horasTrabajadas = Number(
        ((fechaActual.getTime() - registroHoy.hora_entrada.getTime()) / (1000 * 60 * 60)).toFixed(2)
      );

      // Actualizar estadísticas
      await prisma.estadisticas.update({
        where: {
          id_empleado_fecha: {
            id_empleado,
            fecha: fechaStr
          }
        },
        data: {
          horas_trabajadas: horasTrabajadas
        }
      });

      return NextResponse.json({
        message: 'Salida registrada exitosamente',
        data: salida
      });
    }

    return NextResponse.json(
      { message: 'Tipo de registro inválido' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error al procesar el registro:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error al procesar el registro' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];

    // Obtener empleados de la API externa
    const empleadosResponse = await fetch(`${process.env.NEXT_PUBLIC_PROYECTO_URL_API}/lista_empleados`);
    const empleadosData = await empleadosResponse.json();
    const todosEmpleados: Empleado[] = empleadosData.data;

    // Obtener registros de entrada y salida de Prisma
    const [entradas, salidas] = await Promise.all([
      prisma.entradas.findMany({
        where: {
          fecha_entrada: {
            gte: new Date(`${fecha}T00:00:00.000Z`),
            lt: new Date(`${fecha}T23:59:59.999Z`)
          }
        },
        orderBy: { hora_entrada: 'asc' }
      }),
      prisma.salidas.findMany({
        where: {
          fecha_salida: {
            gte: new Date(`${fecha}T00:00:00.000Z`),
            lt: new Date(`${fecha}T23:59:59.999Z`)
          }
        },
        orderBy: { hora_salida: 'asc' }
      })
    ]);

    // Filtrar empleados que tienen tanto entrada como salida
    const empleadosConRegistrosCompletos = todosEmpleados.filter(empleado => {
      const tieneEntrada = entradas.some(e => e.id_empleado === empleado.id);
      const tieneSalida = salidas.some(s => s.id_empleado === empleado.id);
      return tieneEntrada && tieneSalida;
    });

    const registrosPorEmpleado: RegistroEmpleado[] = empleadosConRegistrosCompletos.map(empleado => {
      const entrada = entradas.find(e => e.id_empleado === empleado.id);
      const salida = salidas.find(s => s.id_empleado === empleado.id);

      return {
        empleado: {
          id: empleado.id,
          nombre: `${empleado.name} ${empleado.primer_apellido}`,
          cedula: empleado.cedula,
          id_departamento: empleado.id_departamento,
          id_cargo: empleado.id_cargo
        },
        fecha,
        entrada: entrada ? {
          hora: entrada.hora_entrada.toISOString().split('T')[1].substring(0, 8),
          fecha: entrada.fecha_entrada.toISOString().split('T')[0]
        } : null,
        salida: salida ? {
          hora: salida.hora_salida.toISOString().split('T')[1].substring(0, 8),
          fecha: salida.fecha_salida.toISOString().split('T')[0]
        } : null,
        estado: 'Completo'
      };
    });

    return NextResponse.json({
      message: 'Registros obtenidos exitosamente',
      data: registrosPorEmpleado,
      total_empleados: empleadosConRegistrosCompletos.length,
      total_registros: registrosPorEmpleado.length
    });

  } catch (error) {
    console.error('Error al obtener registros:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error al obtener registros' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}