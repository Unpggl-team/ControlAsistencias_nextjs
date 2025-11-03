export interface Empleado {
  id: number;
  name: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  cedula: string;
  id_departamento: number;
  id_cargo: string;
  inss: string;
  tiene_jornada_asignada?: boolean;
  estado?: 'Pendiente' | 'En Jornada' | 'Completo';
}

export interface Cargo {
  id_cargo: string;
  cargo: string;
}

export interface Departamento {
  value: number;
  option: string;
}