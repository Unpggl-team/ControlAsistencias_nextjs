export interface ParametrosJornada {
  id?: number;
  hora_entrada_esperada: string;
  hora_salida_esperada: string;
  tolerancia_minutos: number;
  horas_laborales: number;
  activo: boolean;
  fecha_creacion?: string;
}

export interface EmpleadoJornada {
  id: number;
  id_empleado: number;
  parametrosJornadaId: number;
  fecha_asignacion: string;
  activo: boolean;
  parametrosJornada?: ParametrosJornada;
}

export interface JornadaLaboral {
  id_empleado: number;
  nombre_empleado: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  llegadaTarde: boolean;
  salidaTemprana: boolean;
  minutos_tarde: number;
  minutos_temprano: number;
  horas_trabajadas: number;
  cumple_jornada: boolean;
}

export interface EstadisticasEmpleado {
  id_empleado: number;
  nombre_empleado: string;
  total_llegadas_tarde: number;
  total_salidas_temprano: number;
  total_minutos_tarde: number;
  total_minutos_temprano: number;
  promedio_horas_trabajadas: number;
  dias_trabajados: number;
  dias_jornada_completa: number;
}

export interface Entrada {
  id: number;
  id_empleado: number;
  hora_entrada: Date;
  fecha_entrada: Date;
}

export interface Salida {
  id: number;
  id_empleado: number;
  hora_salida: Date;
  fecha_salida: Date;
}

export interface RegistroEmpleado {
  empleado: {
    id: number;
    name: string;
    primer_apellido: string;
  };
  entrada?: {
    hora_entrada: string;
    fecha_entrada: string;
  };
  salida?: {
    hora_salida: string;
    fecha_salida: string;
  };
}